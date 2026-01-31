"""
Interview API

Endpoints for AI-led interview management.
"""

from typing import Optional, List, Literal
from uuid import uuid4
from datetime import datetime
import shutil
from pathlib import Path

from langchain_core.messages import HumanMessage, AIMessage

from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile
from pydantic import BaseModel, Field

from app.langgraph import (
    InterviewState,
    create_initial_state,
    get_interview_graph,
)
from app.vectorstore import store_response, get_job_context
from app.stt import transcribe_audio
from app.tts import generate_speech


router = APIRouter(prefix="/ai/interview", tags=["AI Interview"])


# In-memory session storage (replace with Redis in production)
_interview_sessions: dict[str, InterviewState] = {}


# Helper function to safely extract message content
def get_message_content(message) -> str:
    """Extract content from either a dict or LangChain message object."""
    if hasattr(message, "content"):
        return message.content
    elif isinstance(message, dict):
        return message.get("content", "")
    return str(message)


class StartInterviewRequest(BaseModel):
    """Request to start an interview session."""

    job_id: str
    candidate_id: str
    candidate_name: Optional[str] = None


class StartInterviewResponse(BaseModel):
    """Response with interview session details."""

    interview_id: str
    status: str
    current_stage: str
    current_question: str
    message_count: int
    audio_url: Optional[str] = None


class RespondRequest(BaseModel):
    """Candidate response submission."""

    interview_id: str
    response: str


class RespondResponse(BaseModel):
    """Response after processing candidate input."""

    interview_id: str
    status: str
    current_stage: str
    next_question: Optional[str] = None
    pending_response: bool
    evaluation_summary: Optional[dict] = None
    audio_url: Optional[str] = None


class AudioRespondResponse(BaseModel):
    """Response after processing audio submission."""

    interview_id: str
    transcript: str
    status: str
    current_stage: str
    next_question: Optional[str] = None
    is_complete: bool = False
    audio_url: Optional[str] = None
    evaluation: Optional[dict] = None


class TranscriptionResponse(BaseModel):
    """Simple transcription response."""

    transcript: str
    duration_seconds: float = 0


class InterviewStateResponse(BaseModel):
    """Current interview state."""

    interview_id: str
    current_stage: str
    questions_asked: int
    avg_confidence: float
    avg_technical: float
    confidence_trend: str
    is_complete: bool


class CompleteInterviewResponse(BaseModel):
    """Final interview results."""

    interview_id: str
    status: str
    recommendation: Optional[str]
    feedback: Optional[dict]
    scores: dict


@router.post(
    "/start",
    response_model=StartInterviewResponse,
    summary="Start AI interview session",
)
async def start_interview(request: StartInterviewRequest):
    """
    Start a new AI-led interview session.

    Process:
    1. Validate job exists in vector store
    2. Create interview state
    3. Run initial load_context node
    4. Return first question
    """
    # Generate interview ID
    interview_id = str(uuid4())

    # Try to get job context (optional - will use default if not found)
    job_context = None
    try:
        job_context = await get_job_context(request.job_id)
    except Exception as e:
        print(f"Warning: Could not fetch job context: {e}")

    # Create initial state with or without job context
    state = create_initial_state(
        interview_id=interview_id,
        job_id=request.job_id,
        candidate_id=request.candidate_id,
    )

    # Add job context if available
    if job_context:
        state["job_context"] = job_context

    # Run just the load_context node to get first question
    # (Full graph would loop infinitely waiting for responses)
    from app.langgraph.nodes.load_context import load_context_node

    try:
        # Get initial context and first question
        updates = await load_context_node(state)

        # Merge updates into state
        for key, value in updates.items():
            state[key] = value

        # Store session
        _interview_sessions[interview_id] = state

        # Get first question
        current_question = state.get("current_question", "")
        if not current_question and state.get("messages"):
            current_question = get_message_content(state["messages"][-1])

        return StartInterviewResponse(
            interview_id=interview_id,
            status="active",
            current_stage=state.get("current_stage", "warmup"),
            current_question=current_question,
            message_count=len(state.get("messages", [])),
        )

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to start interview: {str(e)}"
        )


@router.post(
    "/respond",
    response_model=RespondResponse,
    summary="Submit candidate response",
)
async def submit_response(request: RespondRequest, background_tasks: BackgroundTasks):
    """
    Process candidate's response and generate next question.

    Process:
    1. Validate session exists
    2. Add response to state
    3. Run graph to evaluate and generate next question
    4. Store response embedding (background)
    5. Return next question or completion
    """
    if request.interview_id not in _interview_sessions:
        raise HTTPException(status_code=404, detail="Interview session not found")

    state = _interview_sessions[request.interview_id]

    # Check if interview is complete
    if state.get("current_stage") == "complete":
        raise HTTPException(status_code=400, detail="Interview is already complete")

    # Add candidate response to state
    state["last_response"] = request.response
    state["pending_response"] = False

    # Add to messages using HumanMessage (consistent with LangChain)
    if isinstance(state.get("messages"), list):
        state["messages"].append(HumanMessage(content=request.response))
    else:
        state["messages"] = [HumanMessage(content=request.response)]

    try:
        # Call appropriate node based on stage
        from app.langgraph.nodes.warmup import warmup_node
        from app.langgraph.nodes.technical import technical_node
        from app.langgraph.nodes.deep_dive import deep_dive_node
        from app.langgraph.nodes.wrapup import wrapup_node
        from app.langgraph.nodes.feedback import feedback_node

        stage = state.get("current_stage", "warmup")

        if stage == "warmup":
            updates = await warmup_node(state)
        elif stage == "technical":
            updates = await technical_node(state)
        elif stage == "deep_dive":
            updates = await deep_dive_node(state)
        elif stage == "wrapup":
            updates = await wrapup_node(state)
        else:
            updates = {"current_stage": "complete"}

        # Merge updates into state
        for key, value in updates.items():
            if key == "messages" and isinstance(value, list):
                # Append new messages
                if not isinstance(state.get("messages"), list):
                    state["messages"] = []
                state["messages"].extend(value)
            else:
                state[key] = value

        # Update session
        _interview_sessions[request.interview_id] = state

        # Store response embedding in background (skip if Qdrant has issues)
        try:
            background_tasks.add_task(
                store_response,
                interview_id=request.interview_id,
                question_id=state.get("current_question_id", "unknown"),
                response_text=request.response,
                confidence_score=state.get("confidence_scores", [0.5])[-1]
                if state.get("confidence_scores")
                else 0.5,
                technical_score=state.get("technical_scores", [0.5])[-1]
                if state.get("technical_scores")
                else 0.5,
                is_high_quality=state.get("avg_technical", 0) >= 0.7,
            )
        except Exception:
            pass  # Skip if Qdrant fails

        # Get next question
        next_question = state.get("current_question", "")

        # Build evaluation summary
        eval_summary = None
        if state.get("confidence_scores"):
            eval_summary = {
                "last_confidence": round(state["confidence_scores"][-1], 2),
                "avg_confidence": round(state.get("avg_confidence", 0.5), 2),
                "trend": state.get("confidence_trend", "stable"),
            }

        return RespondResponse(
            interview_id=request.interview_id,
            status="complete" if state.get("current_stage") == "complete" else "active",
            current_stage=state.get("current_stage", "warmup"),
            next_question=next_question,
            pending_response=state.get("pending_response", True),
            evaluation_summary=eval_summary,
        )

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to process response: {str(e)}"
        )


@router.get(
    "/{interview_id}/state",
    response_model=InterviewStateResponse,
    summary="Get interview state",
)
async def get_interview_state(interview_id: str):
    """Get current state of an interview session."""
    if interview_id not in _interview_sessions:
        raise HTTPException(status_code=404, detail="Interview session not found")

    state = _interview_sessions[interview_id]

    return InterviewStateResponse(
        interview_id=interview_id,
        current_stage=state.get("current_stage", "unknown"),
        questions_asked=state.get("questions_asked", 0),
        avg_confidence=round(state.get("avg_confidence", 0.5), 2),
        avg_technical=round(state.get("avg_technical", 0.5), 2),
        confidence_trend=state.get("confidence_trend", "stable"),
        is_complete=state.get("current_stage") == "complete",
    )


@router.post(
    "/{interview_id}/complete",
    response_model=CompleteInterviewResponse,
    summary="Complete interview and get feedback",
)
async def complete_interview(interview_id: str):
    """
    Force complete an interview and generate feedback.

    Use this to end an interview early or get final results.
    """
    if interview_id not in _interview_sessions:
        raise HTTPException(status_code=404, detail="Interview session not found")

    state = _interview_sessions[interview_id]

    # If not already complete, generate feedback
    if state.get("current_stage") != "complete":
        state["current_stage"] = "complete"
        state["pending_response"] = False

        try:
            from app.langgraph.nodes.feedback import feedback_node

            updates = await feedback_node(state)
            for key, value in updates.items():
                state[key] = value
            _interview_sessions[interview_id] = state
        except Exception as e:
            import traceback

            traceback.print_exc()
            # Continue with basic feedback if node fails
            state["final_feedback"] = {
                "summary": "Interview completed",
                "recommendation": state.get("recommendation", "maybe"),
            }

    return CompleteInterviewResponse(
        interview_id=interview_id,
        status="complete",
        recommendation=state.get("recommendation"),
        feedback=state.get("final_feedback"),
        scores={
            "confidence": round(state.get("avg_confidence", 0.5), 2),
            "technical": round(state.get("avg_technical", 0.5), 2),
            "clarity": round(state.get("avg_clarity", 0.5), 2),
            "questions_answered": state.get("questions_asked", 0),
        },
    )


@router.delete(
    "/{interview_id}",
    summary="Delete interview session",
)
async def delete_interview(interview_id: str):
    """Delete an interview session from memory."""
    if interview_id in _interview_sessions:
        del _interview_sessions[interview_id]
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Session not found")


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    summary="Transcribe audio to text",
)
async def transcribe_audio_endpoint(audio: UploadFile = File(...)):
    """
    Transcribe audio file using Whisper.
    """
    try:
        audio_bytes = await audio.read()
        result = await transcribe_audio(audio_bytes, audio.filename or "audio.webm")
        return TranscriptionResponse(
            transcript=result["transcript"],
            duration_seconds=result.get("duration_seconds", 0),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post(
    "/start-with-audio",
    response_model=StartInterviewResponse,
    summary="Start interview with TTS audio",
)
async def start_interview_with_audio(request: StartInterviewRequest):
    """
    Start interview and return first question with TTS audio.
    """
    # Use existing start logic
    interview_id = str(uuid4())

    job = None
    try:
        job = await get_job_context(request.job_id)
    except Exception:
        pass

    try:
        # Create initial state
        initial_state = create_initial_state(
            interview_id=interview_id,
            job_id=request.job_id,
            candidate_id=request.candidate_id,
        )

        # Set job context manually (as it's not in constructor)
        initial_state["job_context"] = {
            "title": job.get("title") if job else "Software Engineer",
            "description": job.get("description") if job else "Standard interview",
            "skills_required": job.get("skills_required") or [] if job else [],
            "experience_level": job.get("experience_required") or "Mid-Level"
            if job
            else "Mid-Level",
        }

        # Initialize graph execution with thread_id
        from app.langgraph import get_interview_graph

        graph = get_interview_graph()

        config = {"configurable": {"thread_id": interview_id}}

        # Run graph - this will automatically persist state via MemorySaver
        final_state = await graph.ainvoke(initial_state, config)

        # Get current question
        current_question = final_state.get("current_question", "")
        if not current_question and final_state.get("messages"):
            current_question = get_message_content(final_state["messages"][-1])

        # Generate TTS audio
        audio_url = None
        if current_question:
            try:
                print(f"Generating TTS for question: {current_question[:50]}...")
                tts_result = await generate_speech(
                    current_question, session_id=interview_id
                )
                audio_url = tts_result.get("audio_url")
                print(f"TTS generated: {audio_url}")
            except Exception as e:
                import traceback

                print(f"TTS generation failed: {e}")
                traceback.print_exc()

        # Store session in memory for lookup
        _interview_sessions[interview_id] = final_state

        return StartInterviewResponse(
            interview_id=interview_id,
            status="active",
            current_stage=final_state.get("current_stage", "warmup"),
            current_question=current_question,
            message_count=len(final_state.get("messages", [])),
            audio_url=audio_url,
        )

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to start interview: {str(e)}"
        )


# Audio output directory
AUDIO_DIR = Path("./audio_output")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/{interview_id}/submit-audio",
    response_model=AudioRespondResponse,
    summary="Submit audio answer for interview question",
)
async def submit_audio_response(interview_id: str, audio: UploadFile = File(...)):
    """
    Process candidate audio response:
    1. Transcribe audio to text
    2. Process text through interview graph
    3. Generate audio for next question
    """
    # Verify session exists
    if interview_id not in _interview_sessions:
        raise HTTPException(status_code=404, detail="Interview session not found")

    try:
        # 1. Transcribe Audio
        audio_data = await audio.read()

        # Save temp copy for debugging
        temp_filename = f"temp_{interview_id}_{uuid4().hex[:8]}.webm"
        temp_filepath = AUDIO_DIR / temp_filename
        with open(temp_filepath, "wb") as f:
            f.write(audio_data)

        print(f"Transcribing audio: {len(audio_data)} bytes")
        transcript_result = await transcribe_audio(
            audio_data, filename=audio.filename or "audio.webm"
        )
        transcript_text = transcript_result.get("transcript", "")
        print(f"Transcription: {transcript_text}")

        if not transcript_text:
            raise HTTPException(status_code=400, detail="Could not transcribe audio")

        # 2. Process using the SAME approach as /respond endpoint
        # (Don't use graph.update_state - use direct node calls like /respond does)

        state = _interview_sessions[interview_id]

        # Check if interview is complete
        if state.get("current_stage") == "complete":
            raise HTTPException(status_code=400, detail="Interview is already complete")

        # Add candidate response to state
        state["last_response"] = transcript_text
        state["pending_response"] = False

        # Add to messages using HumanMessage (consistent with LangChain)
        if isinstance(state.get("messages"), list):
            state["messages"].append(HumanMessage(content=transcript_text))
        else:
            state["messages"] = [HumanMessage(content=transcript_text)]

        # Call appropriate node based on current stage
        from app.langgraph.nodes.warmup import warmup_node
        from app.langgraph.nodes.technical import technical_node
        from app.langgraph.nodes.deep_dive import deep_dive_node
        from app.langgraph.nodes.wrapup import wrapup_node

        stage = state.get("current_stage", "warmup")
        print(f"Processing stage: {stage}")

        if stage == "warmup":
            updates = await warmup_node(state)
        elif stage == "technical":
            updates = await technical_node(state)
        elif stage == "deep_dive":
            updates = await deep_dive_node(state)
        elif stage == "wrapup":
            updates = await wrapup_node(state)
        else:
            updates = {"current_stage": "complete"}

        # Merge updates into state
        for key, value in updates.items():
            if key == "messages" and isinstance(value, list):
                state["messages"].extend(value)
            else:
                state[key] = value

        # Save updated state
        _interview_sessions[interview_id] = state

        # Get next question
        next_question = state.get("current_question")
        is_complete = state.get("current_stage") == "complete"

        # 3. Generate TTS for next question
        audio_url = None
        if next_question and not is_complete:
            try:
                tts_result = await generate_speech(
                    next_question, session_id=interview_id
                )
                audio_url = tts_result.get("audio_url")
            except Exception as e:
                print(f"TTS generation failed: {e}")

        return AudioRespondResponse(
            interview_id=interview_id,
            transcript=transcript_text,
            status="complete" if is_complete else "active",
            current_stage=state.get("current_stage", "warmup"),
            next_question=next_question,
            is_complete=is_complete,
            audio_url=audio_url,
            evaluation={
                "confidence": round(state.get("avg_confidence", 0.5), 2),
                "technical": round(state.get("avg_technical", 0.5), 2),
            }
            if state.get("confidence_scores")
            else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Error processing audio response: {str(e)}"
        )

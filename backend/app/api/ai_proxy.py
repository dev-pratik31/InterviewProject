"""
AI Proxy Routes

Proxy endpoints to forward requests to the AI service.
These allow the frontend to communicate through the backend.
"""

from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from pydantic import BaseModel, Field
from typing import Optional, List

from app.core.dependencies import CurrentUser
from app.services.ai_service_placeholder import get_ai_client


router = APIRouter(prefix="/ai", tags=["AI Services"])


# ===========================
# JD Generation
# ===========================


class GenerateJDRequest(BaseModel):
    job_title: str = Field(..., min_length=3)
    experience_required: int = Field(..., ge=0, le=30)
    industry: str = "Technology"
    tech_stack: Optional[List[str]] = None
    company_name: Optional[str] = None


class GenerateJDResponse(BaseModel):
    overview: str
    responsibilities: List[str]
    requirements: List[str]
    nice_to_have: List[str]


@router.post("/generate-jd", response_model=GenerateJDResponse)
async def generate_job_description(
    request: GenerateJDRequest,
    current_user: CurrentUser,
):
    """Generate AI-powered job description."""
    if current_user.get("role") != "hr":
        raise HTTPException(status_code=403, detail="Only HR can generate JDs")

    client = get_ai_client()

    try:
        result = await client.generate_job_description(
            job_title=request.job_title,
            experience_required=request.experience_required,
            industry=request.industry,
            tech_stack=request.tech_stack,
            company_name=request.company_name,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")


# ===========================
# Interview Management
# ===========================


class StartInterviewRequest(BaseModel):
    job_id: str
    application_id: str


class StartInterviewResponse(BaseModel):
    interview_id: str
    status: str
    current_stage: str
    current_question: str


@router.post("/interview/start", response_model=StartInterviewResponse)
async def start_interview(
    request: StartInterviewRequest,
    current_user: CurrentUser,
):
    """Start AI interview session for a candidate."""
    client = get_ai_client()

    try:
        result = await client.start_interview(
            job_id=request.job_id,
            candidate_id=str(current_user.get("_id")),
            candidate_name=current_user.get("full_name"),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")


class RespondRequest(BaseModel):
    interview_id: str
    response: str


class RespondResponse(BaseModel):
    interview_id: str
    status: str
    current_stage: str
    next_question: Optional[str] = None
    pending_response: bool
    evaluation_summary: Optional[dict] = None


@router.post("/interview/respond", response_model=RespondResponse)
async def submit_response(
    request: RespondRequest,
    current_user: CurrentUser,
):
    """Submit candidate response to AI interviewer."""
    client = get_ai_client()

    try:
        result = await client.submit_response(
            interview_id=request.interview_id,
            response_text=request.response,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")


class InterviewStateResponse(BaseModel):
    interview_id: str
    current_stage: str
    questions_asked: int
    avg_confidence: float
    avg_technical: float
    confidence_trend: str
    is_complete: bool


@router.get("/interview/{interview_id}/state", response_model=InterviewStateResponse)
async def get_interview_state(
    interview_id: str,
    current_user: CurrentUser,
):
    """Get current interview state."""
    client = get_ai_client()

    try:
        result = await client.get_interview_state(interview_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")


class CompleteInterviewResponse(BaseModel):
    interview_id: str
    status: str
    recommendation: Optional[str] = None
    feedback: Optional[dict] = None
    scores: dict


@router.post(
    "/interview/{interview_id}/complete", response_model=CompleteInterviewResponse
)
async def complete_interview(
    interview_id: str,
    current_user: CurrentUser,
):
    """Complete interview and get feedback."""
    client = get_ai_client()

    try:
        result = await client.complete_interview(interview_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")


@router.get("/health")
async def ai_health_check():
    """Check AI service health."""
    client = get_ai_client()
    is_healthy = await client.health_check()

    return {
        "ai_service": "healthy" if is_healthy else "unavailable",
    }


# ===========================
# Audio Interview Endpoints
# ===========================


class StartInterviewWithAudioRequest(BaseModel):
    job_id: str
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None


class StartInterviewWithAudioResponse(BaseModel):
    interview_id: str
    status: str
    current_stage: str
    current_question: str
    message_count: int
    audio_url: Optional[str] = None


@router.post(
    "/interview/start-with-audio", response_model=StartInterviewWithAudioResponse
)
async def start_interview_with_audio(
    request: StartInterviewWithAudioRequest,
    current_user: CurrentUser,
):
    """Start AI interview session with TTS audio."""
    client = get_ai_client()

    try:
        result = await client.start_interview_with_audio(
            job_id=request.job_id,
            candidate_id=request.candidate_id or str(current_user.get("_id")),
            candidate_name=request.candidate_name or current_user.get("full_name"),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")


class AudioRespondResponse(BaseModel):
    interview_id: str
    transcript: str
    status: str
    current_stage: str
    next_question: Optional[str] = None
    is_complete: bool = False
    audio_url: Optional[str] = None
    evaluation: Optional[dict] = None


@router.post(
    "/interview/{interview_id}/submit-audio", response_model=AudioRespondResponse
)
async def submit_audio_response(
    interview_id: str,
    audio: UploadFile = File(...),
    current_user: CurrentUser = None,
):
    """Submit audio response for transcription and processing."""
    client = get_ai_client()

    try:
        audio_data = await audio.read()
        result = await client.submit_audio_response(
            interview_id=interview_id,
            audio_data=audio_data,
            filename=audio.filename or "audio.webm",
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

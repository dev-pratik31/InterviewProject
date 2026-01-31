"""
Warmup Node

Interview warmup phase for rapport building.
Evaluates communication style and initial confidence.
"""

from datetime import datetime

from langchain_core.messages import AIMessage, HumanMessage

from app.langgraph.state import InterviewState, calculate_trend, calculate_average
from app.evaluation.scoring import evaluate_response
from app.vectorstore.question_store import get_questions_for_stage
from app.llm import get_provider
from app.utils.prompts import WARMUP_QUESTION_PROMPT, WARMUP_FOLLOWUP_PROMPT
from app.config import settings


def get_message_content(message) -> str:
    """Extract content from either a dict or LangChain message object."""
    if hasattr(message, "content"):
        return message.content
    elif isinstance(message, dict):
        return message.get("content", "")
    return str(message)


def is_assistant_message(message) -> bool:
    """Check if message is from assistant/AI."""
    if hasattr(message, "type"):
        return message.type == "ai"
    elif isinstance(message, dict):
        return message.get("role") == "assistant"
    return False


def is_human_message(message) -> bool:
    """Check if message is from human/user."""
    if hasattr(message, "type"):
        return message.type == "human"
    elif isinstance(message, dict):
        return message.get("role") in ("human", "user")
    return False


async def warmup_node(state: InterviewState) -> dict:
    """
    Warmup phase of the interview.

    Actions:
    1. If pending_response, wait for candidate input
    2. Evaluate the last response
    3. Generate next warmup question
    4. Check if ready to advance

    Returns:
        State updates
    """
    updates = {}

    # Check if we're waiting for candidate response
    if state["pending_response"]:
        # This means we need to wait - return minimal update
        return {}

    # We have a response to evaluate
    if state["last_response"]:
        # Evaluate the response
        evaluation = await evaluate_response(
            response=state["last_response"],
            question=state["current_question"],
            stage="warmup",
            job_context=state["job_context"],
        )

        # Update score lists
        confidence_scores = state["confidence_scores"] + [evaluation["confidence"]]
        clarity_scores = state["clarity_scores"] + [evaluation["clarity"]]
        technical_scores = state["technical_scores"] + [evaluation["technical"]]
        depth_scores = state["depth_scores"] + [evaluation["depth"]]

        # Calculate aggregates
        avg_confidence = calculate_average(confidence_scores)
        avg_clarity = calculate_average(clarity_scores)
        confidence_trend = calculate_trend(confidence_scores)

        # Check for struggle
        struggle_count = state["struggle_count"]
        if evaluation["confidence"] < settings.confidence_threshold_simplify:
            struggle_count += 1
        else:
            struggle_count = 0

        # Determine if should simplify
        should_simplify = (
            evaluation["confidence"] < settings.confidence_threshold_simplify
        )

        # Determine if ready to advance
        should_advance = (
            avg_confidence >= settings.confidence_threshold_advance
            and avg_clarity >= settings.clarity_threshold_advance
            and state["questions_in_stage"] >= 2
        )

        updates.update(
            {
                "confidence_scores": confidence_scores,
                "clarity_scores": clarity_scores,
                "technical_scores": technical_scores,
                "depth_scores": depth_scores,
                "avg_confidence": avg_confidence,
                "avg_clarity": avg_clarity,
                "confidence_trend": confidence_trend,
                "struggle_count": struggle_count,
                "should_simplify": should_simplify,
                "should_advance": should_advance,
            }
        )

    # Check if we should advance (will be caught by conditional edge)
    if (
        updates.get("should_advance")
        or state["questions_in_stage"] >= state["max_questions_per_stage"]
    ):
        return {
            **updates,
            "questions_in_stage": 0,  # Reset for next stage
        }

    # Generate next question
    llm = get_provider()

    # Get context for question generation - handle both dict and LangChain messages
    questions_asked = [
        get_message_content(m) for m in state["messages"] if is_assistant_message(m)
    ]

    difficulty = state["difficulty_level"]
    if updates.get("should_simplify"):
        difficulty = max(1, difficulty - 1)

    # Generate question
    messages = [
        {"role": "system", "content": WARMUP_QUESTION_PROMPT},
        {
            "role": "user",
            "content": f"""
Job Title: {state["job_context"]["title"]}
Company: {state["job_context"].get("company_name", "Company")}
Skills Required: {", ".join(state["job_context"].get("skills_required", []))}

Questions already asked:
{chr(10).join(questions_asked[-3:])}

Candidate's last response:
{state.get("last_response", "This is the first question")}

Difficulty level: {difficulty}/5
Questions in stage: {state["questions_in_stage"]}/5

Generate the next warmup question. Focus on understanding the candidate's background and communication style.
""",
        },
    ]

    next_question = await llm.generate(messages, temperature=0.7)

    # Create message using AIMessage
    new_message = AIMessage(content=next_question)

    return {
        **updates,
        "current_question": next_question,
        "messages": [new_message],
        "pending_response": True,
        "questions_asked": state["questions_asked"] + 1,
        "questions_in_stage": state["questions_in_stage"] + 1,
        "difficulty_level": difficulty,
        "last_response": None,
    }

"""
Deep Dive Node

Advanced technical exploration for strong candidates.
Tests depth of knowledge and system design thinking.
"""

from datetime import datetime

from langchain_core.messages import AIMessage, HumanMessage

from app.langgraph.state import InterviewState, calculate_trend, calculate_average
from app.evaluation.scoring import evaluate_response
from app.llm import get_provider
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


DEEP_DIVE_PROMPT = """You are an expert technical interviewer conducting a deep dive assessment.
Generate challenging questions that explore:
- System design and architecture decisions
- Trade-offs and scalability considerations
- Real-world problem solving
- Advanced concepts in their domain

The candidate has shown strong technical skills and is ready for advanced questions."""


async def deep_dive_node(state: InterviewState) -> dict:
    """
    Deep dive phase for strong candidates.

    Actions:
    1. Evaluate depth and insight of responses
    2. Ask follow-up questions on interesting points
    3. Explore system design and architecture
    4. Assess problem-solving approach

    Returns:
        State updates
    """
    updates = {}

    # Check if we're waiting for candidate response
    if state["pending_response"]:
        return {}

    # Evaluate response if present
    if state["last_response"]:
        evaluation = await evaluate_response(
            response=state["last_response"],
            question=state["current_question"],
            stage="deep_dive",
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
        avg_technical = calculate_average(technical_scores)
        avg_depth = calculate_average(depth_scores)
        confidence_trend = calculate_trend(confidence_scores)

        # Check for struggle in deep dive
        struggle_count = state["struggle_count"]
        if evaluation["depth"] < 0.4:
            struggle_count += 1
        else:
            struggle_count = 0

        # Detect fatigue
        fatigue_detected = (
            confidence_trend == "declining" and state["questions_asked"] >= 10
        )

        updates.update(
            {
                "confidence_scores": confidence_scores,
                "clarity_scores": clarity_scores,
                "technical_scores": technical_scores,
                "depth_scores": depth_scores,
                "avg_confidence": avg_confidence,
                "avg_clarity": avg_clarity,
                "avg_technical": avg_technical,
                "avg_depth": avg_depth,
                "confidence_trend": confidence_trend,
                "struggle_count": struggle_count,
                "fatigue_detected": fatigue_detected,
            }
        )

    # Check exit conditions
    if (
        updates.get("fatigue_detected")
        or updates.get("struggle_count", 0) >= 2
        or state["questions_in_stage"] >= state["max_questions_per_stage"]
        or state["questions_asked"] >= state["max_total_questions"]
    ):
        return {
            **updates,
            "questions_in_stage": 0,
        }

    # Generate next deep dive question
    llm = get_provider()

    # Get conversation context - handle both dict and LangChain messages
    recent_exchanges = []
    for msg in state["messages"][-6:]:
        role = "AI" if is_assistant_message(msg) else "Candidate"
        content = get_message_content(msg)
        recent_exchanges.append(f"{role}: {content[:200]}...")

    messages = [
        {"role": "system", "content": DEEP_DIVE_PROMPT},
        {
            "role": "user",
            "content": f"""
Job Title: {state["job_context"]["title"]}
Required Skills: {", ".join(state["job_context"].get("skills_required", []))}

Candidate's performance:
- Technical score: {updates.get("avg_technical", state["avg_technical"]):.2f}
- Depth score: {updates.get("avg_depth", state.get("avg_depth", 0.5)):.2f}
- Confidence trend: {updates.get("confidence_trend", state["confidence_trend"])}

Recent conversation:
{chr(10).join(recent_exchanges)}

Generate a deep dive question that:
1. Builds on the candidate's previous responses
2. Explores system design or architectural thinking
3. Tests ability to handle ambiguity and trade-offs
4. Requires synthesis of multiple concepts

Output only the question.
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
        "last_response": None,
    }

"""
Deep Dive Interview Node

Advanced technical probing for high-performing candidates.
Tests depth of understanding and problem-solving approach.
"""

from datetime import datetime

from app.langgraph.state import InterviewState, calculate_trend, calculate_average
from app.evaluation.scoring import evaluate_response
from app.llm import get_provider
from app.utils.prompts import DEEP_DIVE_QUESTION_PROMPT
from app.config import settings


async def deep_dive_node(state: InterviewState) -> dict:
    """
    Deep dive phase for advanced candidates.
    
    Actions:
    1. Generate challenging scenario-based questions
    2. Probe deeper into previous answers
    3. Test system design and architecture thinking
    
    Returns:
        State updates
    """
    updates = {}
    
    if state["pending_response"]:
        return {}
    
    # Evaluate response
    if state["last_response"]:
        evaluation = await evaluate_response(
            response=state["last_response"],
            question=state["current_question"],
            stage="deep_dive",
            job_context=state["job_context"],
        )
        
        # Update scores
        confidence_scores = state["confidence_scores"] + [evaluation["confidence"]]
        clarity_scores = state["clarity_scores"] + [evaluation["clarity"]]
        technical_scores = state["technical_scores"] + [evaluation["technical"]]
        depth_scores = state["depth_scores"] + [evaluation["depth"]]
        
        avg_confidence = calculate_average(confidence_scores)
        avg_clarity = calculate_average(clarity_scores)
        avg_technical = calculate_average(technical_scores)
        confidence_trend = calculate_trend(confidence_scores)
        
        # Track struggle
        struggle_count = state["struggle_count"]
        if evaluation["depth"] < 0.5 and evaluation["technical"] < 0.5:
            struggle_count += 1
        else:
            struggle_count = 0
        
        # Fatigue detection
        fatigue_detected = (
            confidence_trend == "declining" and
            state["questions_asked"] >= 10
        )
        
        updates.update({
            "confidence_scores": confidence_scores,
            "clarity_scores": clarity_scores,
            "technical_scores": technical_scores,
            "depth_scores": depth_scores,
            "avg_confidence": avg_confidence,
            "avg_clarity": avg_clarity,
            "avg_technical": avg_technical,
            "confidence_trend": confidence_trend,
            "struggle_count": struggle_count,
            "fatigue_detected": fatigue_detected,
        })
    
    # Check exit conditions
    if (
        updates.get("fatigue_detected") or
        updates.get("struggle_count", 0) >= 2 or
        state["questions_in_stage"] >= state["max_questions_per_stage"] or
        state["questions_asked"] >= state["max_total_questions"]
    ):
        return {
            **updates,
            "questions_in_stage": 0,
        }
    
    # Generate deep dive question
    llm = get_provider()
    
    # Get best responses for follow-up
    best_technical_idx = -1
    if state["technical_scores"]:
        best_technical_idx = state["technical_scores"].index(max(state["technical_scores"]))
    
    # Find the corresponding response
    candidate_responses = [m for m in state["messages"] if m["role"] == "candidate"]
    best_response = ""
    if candidate_responses and best_technical_idx >= 0 and best_technical_idx < len(candidate_responses):
        best_response = candidate_responses[best_technical_idx]["content"]
    
    messages = [
        {"role": "system", "content": DEEP_DIVE_QUESTION_PROMPT},
        {"role": "user", "content": f"""
Job Title: {state["job_context"]["title"]}
Required Skills: {', '.join(state["job_context"].get("skills_required", []))}

Candidate's performance:
- Technical average: {updates.get("avg_technical", state["avg_technical"]):.2f}
- Depth average: {calculate_average(state["depth_scores"]):.2f}
- Trend: {updates.get("confidence_trend", state["confidence_trend"])}

Strongest response so far:
{best_response[:500] if best_response else "N/A"}

Last response:
{state.get("last_response", "N/A")[:500]}

Generate a deep-dive question that:
1. Challenges the candidate on system design or architecture
2. Probes deeper into a topic they showed strength in
3. Tests edge case thinking and trade-off analysis
4. Is at difficulty level 4-5

Output only the question.
"""}
    ]
    
    next_question = await llm.generate(messages, temperature=0.5)
    
    new_message = {
        "role": "assistant",
        "content": next_question,
        "timestamp": datetime.utcnow().isoformat(),
        "evaluation": None,
    }
    
    return {
        **updates,
        "current_question": next_question,
        "messages": [new_message],
        "pending_response": True,
        "questions_asked": state["questions_asked"] + 1,
        "questions_in_stage": state["questions_in_stage"] + 1,
        "last_response": None,
    }

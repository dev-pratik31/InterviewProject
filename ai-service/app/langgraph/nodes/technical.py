"""
Technical Interview Node

Core technical assessment phase.
Tests domain knowledge and problem-solving ability.
"""

from datetime import datetime

from app.langgraph.state import InterviewState, calculate_trend, calculate_average
from app.evaluation.scoring import evaluate_response
from app.vectorstore.question_store import get_questions_for_stage
from app.llm import get_provider
from app.utils.prompts import TECHNICAL_QUESTION_PROMPT
from app.config import settings


async def technical_node(state: InterviewState) -> dict:
    """
    Technical interview phase.
    
    Actions:
    1. Evaluate technical accuracy of responses
    2. Adjust difficulty based on performance
    3. Generate relevant technical questions
    4. Track depth of understanding
    
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
            stage="technical",
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
        confidence_trend = calculate_trend(confidence_scores)
        
        # Check for struggle
        struggle_count = state["struggle_count"]
        if evaluation["technical"] < 0.4:
            struggle_count += 1
        else:
            struggle_count = 0
        
        # Detect fatigue (declining confidence + low technical)
        fatigue_detected = (
            confidence_trend == "declining" and
            avg_technical < 0.5 and
            state["questions_asked"] >= 8
        )
        
        # Determine difficulty adjustment
        difficulty = state["difficulty_level"]
        if evaluation["technical"] >= 0.8 and evaluation["confidence"] >= 0.7:
            difficulty = min(5, difficulty + 1)
        elif evaluation["technical"] < 0.4:
            difficulty = max(1, difficulty - 1)
        
        # Determine if ready to advance
        should_advance = (
            avg_technical >= settings.technical_threshold_deep_dive and
            confidence_trend in ["improving", "stable"] and
            state["questions_in_stage"] >= 3
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
            "difficulty_level": difficulty,
            "should_advance": should_advance,
        })
    
    # Check exit conditions
    if (
        updates.get("fatigue_detected") or 
        updates.get("struggle_count", 0) >= 3 or
        state["questions_in_stage"] >= state["max_questions_per_stage"]
    ):
        return {
            **updates,
            "questions_in_stage": 0,
        }
    
    # Generate next technical question
    llm = get_provider()
    
    # Get relevant skills to test
    skills = state["job_context"].get("skills_required", [])
    
    # Determine which skill to focus on based on coverage
    covered_topics = []
    for msg in state["messages"]:
        if msg["role"] == "assistant":
            covered_topics.append(msg["content"])
    
    messages = [
        {"role": "system", "content": TECHNICAL_QUESTION_PROMPT},
        {"role": "user", "content": f"""
Job Title: {state["job_context"]["title"]}
Required Skills: {', '.join(skills)}
Experience Required: {state["job_context"].get("experience_required", 0)}+ years

Candidate's technical score so far: {updates.get("avg_technical", state["avg_technical"]):.2f}
Confidence trend: {updates.get("confidence_trend", state["confidence_trend"])}
Difficulty level: {updates.get("difficulty_level", state["difficulty_level"])}/5

Recent questions asked:
{chr(10).join([q[:100] + '...' for q in covered_topics[-3:]])}

Last response from candidate:
{state.get("last_response", "N/A")[:500]}

Generate a technical question that:
1. Tests one of the required skills not yet covered
2. Matches the current difficulty level
3. Allows the candidate to demonstrate depth of knowledge
4. Is specific and answerable in 2-3 minutes

Output only the question, nothing else.
"""}
    ]
    
    next_question = await llm.generate(messages, temperature=0.6)
    
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

"""
Feedback Generation Node

Final node that generates structured interview feedback.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.langgraph.state import InterviewState, calculate_average
from app.llm import get_provider


class InterviewFeedback(BaseModel):
    """Structured feedback output."""
    
    # Scores (0-10)
    overall_score: float = Field(..., ge=0, le=10)
    technical_score: float = Field(..., ge=0, le=10)
    communication_score: float = Field(..., ge=0, le=10)
    problem_solving_score: float = Field(..., ge=0, le=10)
    confidence_score: float = Field(..., ge=0, le=10)
    
    # Qualitative
    strengths: list[str] = Field(..., min_length=1, max_length=5)
    areas_for_improvement: list[str] = Field(..., min_length=1, max_length=5)
    
    # Recommendation
    recommendation: str = Field(..., pattern="^(strong_hire|hire|maybe|no_hire)$")
    recommendation_rationale: str
    
    # Summary
    detailed_summary: str


FEEDBACK_PROMPT = """You are an expert technical interviewer generating structured feedback.

Analyze the interview transcript and provide objective, fair feedback.

IMPORTANT GUIDELINES:
- Base scores ONLY on demonstrated knowledge and communication
- Do NOT make assumptions about the candidate
- Focus on specific examples from the interview
- Be constructive in areas for improvement
- Recommendation must be justified by concrete evidence

Scoring scale (0-10):
- 0-3: Below expectations, significant gaps
- 4-5: Meets minimum requirements, room for growth
- 6-7: Solid performance, meets expectations
- 8-9: Strong performance, exceeds expectations  
- 10: Exceptional, outstanding demonstration

Output strictly valid JSON matching the schema."""


async def feedback_node(state: InterviewState) -> dict:
    """
    Generate comprehensive interview feedback.
    
    Actions:
    1. Compile interview transcript
    2. Calculate aggregate scores
    3. Generate structured feedback using LLM
    4. Determine hire recommendation
    
    Returns:
        State updates with final feedback
    """
    llm = get_provider()
    
    # Compile transcript
    transcript = []
    for msg in state["messages"]:
        role = "Interviewer" if msg["role"] == "assistant" else "Candidate"
        transcript.append(f"{role}: {msg['content']}")
    
    transcript_text = "\n\n".join(transcript)
    
    # Calculate scores
    avg_confidence = calculate_average(state["confidence_scores"])
    avg_clarity = calculate_average(state["clarity_scores"])
    avg_technical = calculate_average(state["technical_scores"])
    avg_depth = calculate_average(state["depth_scores"])
    
    # Generate feedback
    messages = [
        {"role": "system", "content": FEEDBACK_PROMPT},
        {"role": "user", "content": f"""
## Interview Context
Job Title: {state["job_context"]["title"]}
Company: {state["job_context"]["company_name"]}
Required Skills: {', '.join(state["job_context"].get("skills_required", []))}
Experience Required: {state["job_context"].get("experience_required", 0)}+ years

## Performance Metrics
- Questions Asked: {state["questions_asked"]}
- Technical Average: {avg_technical:.2f}
- Confidence Average: {avg_confidence:.2f}
- Clarity Average: {avg_clarity:.2f}
- Depth Average: {avg_depth:.2f}
- Confidence Trend: {state["confidence_trend"]}
- Struggle Count: {state["struggle_count"]}
- Fatigue Detected: {state["fatigue_detected"]}

## Interview Transcript
{transcript_text}

## Task
Generate structured feedback following the schema exactly.
All scores should be on a 0-10 scale.
Provide specific examples to justify your assessment.
"""} 
    ]
    
    try:
        feedback = await llm.generate_structured(
            messages=messages,
            response_model=InterviewFeedback,
            temperature=0.3,
        )
        
        feedback_dict = feedback.model_dump()
        
    except Exception as e:
        # Fallback to manual calculation
        overall = (avg_technical * 0.4 + avg_clarity * 0.3 + avg_confidence * 0.3) * 10
        
        # Determine recommendation based on scores
        if overall >= 7.5:
            recommendation = "strong_hire"
        elif overall >= 6.0:
            recommendation = "hire"
        elif overall >= 4.5:
            recommendation = "maybe"
        else:
            recommendation = "no_hire"
        
        feedback_dict = {
            "overall_score": round(overall, 1),
            "technical_score": round(avg_technical * 10, 1),
            "communication_score": round(avg_clarity * 10, 1),
            "problem_solving_score": round(avg_depth * 10, 1),
            "confidence_score": round(avg_confidence * 10, 1),
            "strengths": ["Completed the interview"],
            "areas_for_improvement": ["Could not generate detailed feedback"],
            "recommendation": recommendation,
            "recommendation_rationale": f"Based on aggregate scores: {overall:.1f}/10",
            "detailed_summary": f"Interview completed with {state['questions_asked']} questions. "
                               f"Technical: {avg_technical:.2f}, Clarity: {avg_clarity:.2f}",
        }
    
    return {
        "current_stage": "complete",
        "final_feedback": feedback_dict,
        "recommendation": feedback_dict["recommendation"],
        "pending_response": False,
    }

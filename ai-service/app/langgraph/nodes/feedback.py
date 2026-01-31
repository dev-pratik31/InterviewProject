"""
Feedback Generation Node

Final node that generates detailed, signal-based interview feedback.
Analyzes implicit behavioral, communication, and technical signals.
"""

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field

from app.langgraph.state import InterviewState, calculate_average
from app.llm import get_provider


class BehavioralFeedback(BaseModel):
    """
    Structured feedback report based on behavioral signal analysis.
    Designed for recruiters to assess candidate fit beyond simple scores.
    """

    # 1. Overall Interview Summary
    overall_summary: str = Field(
        ...,
        description="High-level assessment of the interview interaction and candidate performance.",
    )

    # 2. Communication & Expression Signals
    communication_signals: List[str] = Field(
        ..., description="Observations on clarity, structure, articulation, and pacing."
    )

    # 3. Confidence & Behavioral Patterns
    confidence_signals: List[str] = Field(
        ...,
        description="Analysis of confidence evolution, hesitation markers, and assertiveness.",
    )

    # 4. Technical Reasoning Signals
    technical_signals: List[str] = Field(
        ...,
        description="Observations on depth of thought, logical structuring, and edge case awareness.",
    )

    # 5. Learning & Adaptability Signals
    adaptability_signals: List[str] = Field(
        ...,
        description="Analysis of how the candidate responds to hints, feedback, or increasing difficulty.",
    )

    # 6. Observed Strengths
    strengths: List[str] = Field(
        ...,
        description="Key strengths derived strictly from observed behavior and responses.",
    )

    # 7. Improvement Opportunities
    opportunities: List[str] = Field(
        ...,
        description="Constructive, actionable insights for candidate growth or areas of concern.",
    )

    # 8. Role Alignment Assessment
    role_alignment: str = Field(
        ...,
        description="Assessment of how valid the candidate's skills and behaviors are for the specific role context.",
    )

    # 9. Final Recommendation (Non-Numeric)
    recommendation: Literal[
        "Strong Fit", "Potential Fit", "Needs Further Evaluation", "Not a Fit Currently"
    ] = Field(
        ...,
        description="Final categorical recommendation based on all observed signals.",
    )


FEEDBACK_PROMPT = """You are an expert Talent Intelligence Analyst.
Your role is to analyze an interview transcript and generate a "Behavioral Signal–Based Feedback Report" for a recruiter.

## CORE OBJECTIVE
Replace simple score-based evaluations with deep, implicit signal analysis.
Focus on HOW the candidate communicates, thinks, and adapts, not just WHAT they say.

## INPUT DATA
You will be provided with:
1. Job Context (Role, Company, Skills)
2. Performance Metrics (Aggregated signals like confidence trends, technical averages)
3. Full Interview Transcript

## ANALYSIS DIMENSIONS (Implicit Signals)
Look for these specific markers in the transcript:

1. **Communication Signals**:
   - STRUCTURAL: Do they use "First, then, finally" structures? (High clarity)
   - QUALIFIERS: Do they overuse "I guess", "maybe"? (Low certainty) vs "In my experience..." (High authority)
   - PACING: Do they ramble or get straight to the point?

2. **Confidence Patterns**:
   - EVOLUTION: Did they start nervous and warm up? Or crumble under pressure?
   - RECOVERY: How did they handle not knowing an answer? (Honesty vs. Bluffing)

3. **Technical Reasoning**:
   - DEPTH: Do they explain existing solutions or invent new ones?
   - BREADTH: Do they mention trade-offs, edge cases, and alternative approaches?

4. **Adaptability**:
   - ATTENTION: Do they incorporate information from previous questions?
   - OPENNESS: How do they react to challenging follow-ups?

## OUTPUT GUIDELINES
- **Tone**: Professional, objective, insightful, clinical but human.
- **Forbidden**: DO NOT output numeric scores (e.g., "8/10").
- **Evidence**: Back up claims with observations (e.g., "Candidate demonstrated strong adaptability when...")

GENERATE THE REPORT AS VALID JSON MATCHING THE SCHEMA.
"""


async def feedback_node(state: InterviewState) -> dict:
    """
    Generate comprehensive interview feedback using behavioral signal analysis.

    Actions:
    1. Compile interview transcript
    2. Aggregate implicit signals
    3. Generate structured feedback using LLM

    Returns:
        State updates with final feedback
    """
    llm = get_provider()

    # Compile transcript
    transcript = []
    for msg in state["messages"]:
        # Handle both dict and LangChain message objects
        role = "Interviewer"
        content = ""

        if hasattr(msg, "type"):
            role = "Interviewer" if msg.type == "ai" else "Candidate"
            content = msg.content
        elif isinstance(msg, dict):
            role = "Interviewer" if msg.get("role") == "assistant" else "Candidate"
            content = msg.get("content", "")

        transcript.append(f"{role}: {content}")

    transcript_text = "\n\n".join(transcript)

    # Calculate aggregate metrics for context (internal use only)
    avg_confidence = calculate_average(state["confidence_scores"])
    avg_clarity = calculate_average(state["clarity_scores"])
    avg_technical = calculate_average(state["technical_scores"])
    avg_depth = calculate_average(state["depth_scores"])

    # Prepare prompt
    messages = [
        {"role": "system", "content": FEEDBACK_PROMPT},
        {
            "role": "user",
            "content": f"""
## 1. Job Context
- Role: {state["job_context"]["title"]}
- Company: {state["job_context"].get("company_name", "Company")}
- Required Skills: {", ".join(state["job_context"].get("skills_required", []))}
- Experience: {state["job_context"].get("experience_required", 0)}+ years

## 2. Derived behavioral signals (Internal Telemetry)
- Technical Depth Indicator: {avg_technical:.2f} (0-1 range)
- Communication Clarity: {avg_clarity:.2f}
- Confidence Trend: {state["confidence_trend"]} (e.g., rising, falling, stable)
- Struggle Markers: {state["struggle_count"]} instances detected
- Fatigue Detected: {state["fatigue_detected"]}

## 3. Interview Transcript
{transcript_text}

## TASK
Analyze the implicit signals in the transcript and generate the detailed Behavioral Signal–Based Feedback Report.
""",
        },
    ]

    try:
        feedback = await llm.generate_structured(
            messages=messages,
            response_model=BehavioralFeedback,
            temperature=0.4,  # Slightly higher temperature for more nuance/creativity in analysis
        )

        feedback_dict = feedback.model_dump()

    except Exception as e:
        print(f"Feedback generation failed: {e}")
        import traceback

        traceback.print_exc()

        # Fallback to basic manual report
        feedback_dict = {
            "overall_summary": "Interview completed, but detailed AI analysis failed.",
            "communication_signals": ["Unable to analyze."],
            "confidence_signals": ["Unable to analyze."],
            "technical_signals": ["Unable to analyze."],
            "adaptability_signals": ["Unable to analyze."],
            "strengths": ["Candidate completed the session."],
            "opportunities": ["Review transcript manually."],
            "role_alignment": "Unknown",
            "recommendation": "Needs Further Evaluation",
        }

    return {
        "current_stage": "complete",
        "final_feedback": feedback_dict,
        "recommendation": feedback_dict[
            "recommendation"
        ],  # Top-level key for easy access
        "pending_response": False,
    }

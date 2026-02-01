"""
Resume Screening API

Analyzes resume content against job descriptions using LLM.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.llm.provider import get_provider

router = APIRouter(prefix="/ai/resume", tags=["Resume Screening"])


class ResumeScreeningRequest(BaseModel):
    """Request to screen a resume."""

    job_description: str
    resume_text: str


class ResumeScreeningResponse(BaseModel):
    """Structured resume screening result."""

    score: int = Field(..., description="Match score from 0 to 100")
    strengths: List[str] = Field(..., description="List of matching strengths")
    gaps: List[str] = Field(..., description="List of missing skills or gaps")
    transferable_skills: List[str] = Field(..., description="Skills that transfer well")
    summary: str = Field(..., description="Recruiter-friendly summary")


SYSTEM_PROMPT = """
You are an expert technical recruiter and hiring manager assistant.
Your task is to analyze a candidate's resume against a specific Job Description (JD).

GOAL: Provide a fair, objective, and structured screening report.
- Score the match from 0 to 100 based on REQUIRED skills and experience.
- Identify clear STRENGTHS (direct matches).
- Identify GAPS (missing requirements).
- Identify TRANSFERABLE SKILLS (adjacent technologies or soft skills).
- Write a concise SUMMARY for the hiring manager.

RULES:
- Be objective. Do not hallucinate skills not present in the resume.
- If the resume is very short or irrelevant, give a low score.
- The summary should be professional and neutral.
- Score < 50: Poor match
- Score 50-70: Potential match with gaps
- Score 70-85: Strong match
- Score > 85: Exceptional match
"""


@router.post("/screen", response_model=ResumeScreeningResponse)
async def screen_resume(request: ResumeScreeningRequest):
    """
    Screen a resume against a job description using AI.
    """
    try:
        provider = get_provider()

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"""
JOB DESCRIPTION:
{request.job_description}

RESUME CONTENT:
{request.resume_text}

Analyze the resume and provide the structured report.
""",
            },
        ]

        result = await provider.generate_structured(
            messages=messages, response_model=ResumeScreeningResponse, temperature=0.1
        )

        return result

    except Exception as e:
        print(f"Resume screening error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

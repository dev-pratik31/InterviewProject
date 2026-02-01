"""
Application Model

Defines the Application document structure for MongoDB.
Represents a candidate's application to a specific job.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.utils.enums import ApplicationStatus


class ApplicationModel(BaseModel):
    """
    Job application document model.

    Links candidates to job postings with application metadata.
    Each candidate can only apply once per job (enforced by unique index).
    """

    # References
    candidate_id: str = Field(..., description="Candidate user ObjectId")
    job_id: str = Field(..., description="Job posting ObjectId")

    # Application content
    cover_letter: Optional[str] = Field(
        None, max_length=5000, description="Optional cover letter"
    )
    resume_url: Optional[str] = Field(
        None, description="Resume URL (can override profile resume)"
    )

    # Status tracking
    status: ApplicationStatus = Field(
        default=ApplicationStatus.PENDING, description="Application status"
    )

    # Resume Screening (Internal)
    resume_text: Optional[str] = Field(None, description="Extracted resume text")
    resume_match_score: Optional[int] = Field(
        None, description="AI-generated match score (0-100)"
    )
    resume_screening_analysis: Optional[dict] = Field(
        None, description="Structured analysis: strengths, gaps, summary"
    )

    # HR notes (internal)
    hr_notes: Optional[str] = Field(
        None, max_length=2000, description="Internal HR notes"
    )

    # Interview scheduling
    interview_type: Optional[str] = Field(
        None, description="'now' for immediate or 'scheduled' for later"
    )
    interview_scheduled_at: Optional[datetime] = Field(
        None, description="Scheduled interview datetime"
    )
    interview_status: Optional[str] = Field(
        None, description="'pending', 'scheduled', 'in_progress', 'completed'"
    )
    interview_id: Optional[str] = Field(None, description="AI interview session ID")

    # AI Interview feedback
    interview_feedback: Optional[dict] = Field(
        None, description="Detailed feedback from AI interview"
    )
    ai_recommendation: Optional[str] = Field(
        None, description="AI recommendation: strong_hire, hire, maybe, no_hire"
    )
    interview_scores: Optional[dict] = Field(
        None, description="Confidence, technical, clarity scores"
    )
    interview_completed_at: Optional[datetime] = Field(
        None, description="When interview was completed"
    )

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = Field(None, description="When HR reviewed")

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class ApplicationInDB(ApplicationModel):
    """
    Application model with database ID.
    """

    id: str = Field(..., alias="_id", description="MongoDB ObjectId as string")

    class Config:
        populate_by_name = True

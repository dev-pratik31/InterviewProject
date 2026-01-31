"""
Interview Schemas

Request and response schemas for interview scheduling endpoints.

Phase 1: Basic scheduling
Phase 2: AI interview data, transcripts, and feedback
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.utils.enums import InterviewStatus


# ============================================
# Request Schemas
# ============================================

class InterviewScheduleRequest(BaseModel):
    """
    Interview scheduling request schema.
    
    Candidates use this to schedule interviews for their applications.
    """
    application_id: str = Field(..., description="Application ObjectId")
    scheduled_time: datetime = Field(..., description="Proposed interview time")
    duration_minutes: int = Field(
        default=60,
        ge=15,
        le=180,
        description="Interview duration in minutes"
    )


class InterviewUpdateRequest(BaseModel):
    """
    Interview update request schema.
    Used by HR to update interview status or reschedule.
    """
    scheduled_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=180)
    status: Optional[InterviewStatus] = None
    notes: Optional[str] = Field(None, max_length=5000)


# ============================================
# Response Schemas
# ============================================

class InterviewResponse(BaseModel):
    """
    Interview response schema.
    """
    id: str
    application_id: str
    candidate_id: str
    job_id: str
    scheduled_time: datetime
    duration_minutes: int
    status: InterviewStatus
    notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    # Populated fields
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None


class InterviewListResponse(BaseModel):
    """
    Interview list item response.
    """
    id: str
    scheduled_time: datetime
    duration_minutes: int
    status: InterviewStatus
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    candidate_name: Optional[str] = None


# ============================================
# Phase 2 Schemas (Not implemented yet)
# ============================================

# class InterviewTranscriptEntry(BaseModel):
#     """Single transcript entry."""
#     role: str  # 'ai' or 'candidate'
#     content: str
#     timestamp: datetime


# class InterviewFeedback(BaseModel):
#     """AI-generated interview feedback."""
#     overall_score: float = Field(..., ge=0, le=10)
#     technical_score: float = Field(..., ge=0, le=10)
#     communication_score: float = Field(..., ge=0, le=10)
#     problem_solving_score: float = Field(..., ge=0, le=10)
#     strengths: list[str]
#     areas_for_improvement: list[str]
#     recommendation: str  # 'strongly_recommend', 'recommend', 'neutral', 'not_recommend'
#     summary: str


# class InterviewDetailResponse(InterviewResponse):
#     """Extended interview response with Phase 2 data."""
#     transcript: list[InterviewTranscriptEntry] = []
#     feedback: Optional[InterviewFeedback] = None
#     current_stage: Optional[str] = None  # For live interviews

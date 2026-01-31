"""
Interview Model

Defines the Interview document structure for MongoDB.

Phase 1: Stores scheduling information only
Phase 2: Will store AI interview transcripts, feedback, and scoring

Phase 2 Integration Points:
- LangGraph will orchestrate the interview flow
- Interview transcripts will be embedded in Qdrant
- AI-generated feedback will be stored here
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.utils.enums import InterviewStatus


class InterviewModel(BaseModel):
    """
    Interview document model.
    
    Phase 1: Scheduling and basic status tracking
    Phase 2: AI-led interviews with transcripts and feedback
    """
    
    # References
    application_id: str = Field(..., description="Application ObjectId")
    candidate_id: str = Field(..., description="Candidate user ObjectId")
    job_id: str = Field(..., description="Job posting ObjectId")
    
    # Scheduling
    scheduled_time: datetime = Field(..., description="Interview date and time")
    duration_minutes: int = Field(
        default=60,
        ge=15,
        le=180,
        description="Expected interview duration"
    )
    
    # Status
    status: InterviewStatus = Field(
        default=InterviewStatus.SCHEDULED,
        description="Interview status"
    )
    
    # Phase 1: Basic notes
    notes: Optional[str] = Field(
        None,
        max_length=5000,
        description="Interview notes"
    )
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(None)
    
    # =========================================
    # PHASE 2 FIELDS (Not implemented yet)
    # =========================================
    
    # AI Interview Data
    # transcript: Optional[list[dict]] = Field(
    #     None,
    #     description="Interview transcript: [{role: 'ai'|'candidate', content: str, timestamp: datetime}]"
    # )
    
    # LangGraph State
    # langgraph_state: Optional[dict] = Field(
    #     None,
    #     description="LangGraph interview flow state"
    # )
    # current_stage: Optional[str] = Field(
    #     None,
    #     description="Current interview stage: warmup, technical, problem_solving, wrapup"
    # )
    
    # AI Feedback
    # ai_feedback: Optional[dict] = Field(
    #     None,
    #     description="AI-generated feedback with scores and recommendations"
    # )
    # overall_score: Optional[float] = Field(
    #     None,
    #     ge=0,
    #     le=10,
    #     description="AI overall score"
    # )
    
    # Qdrant Integration
    # transcript_embedding_ids: list[str] = Field(
    #     default_factory=list,
    #     description="Qdrant vector IDs for transcript chunks"
    # )
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class InterviewInDB(InterviewModel):
    """
    Interview model with database ID.
    """
    id: str = Field(..., alias="_id", description="MongoDB ObjectId as string")
    
    class Config:
        populate_by_name = True

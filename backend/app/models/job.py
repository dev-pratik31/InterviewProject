"""
Job Model

Defines the Job document structure for MongoDB.
Jobs are posted by HR users and linked to companies.

Phase 2 Note:
- Job descriptions will be embedded in Qdrant for semantic search
- AI-generated job descriptions will be stored here
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.utils.enums import JobStatus


class JobModel(BaseModel):
    """
    Job posting document model.
    
    Stores job details, requirements, and status.
    Linked to a company and created by HR user.
    """
    
    # Basic information
    title: str = Field(
        ..., 
        min_length=3, 
        max_length=200, 
        description="Job title"
    )
    description: str = Field(
        ..., 
        min_length=50, 
        max_length=10000, 
        description="Job description (manual in Phase 1, AI-generated in Phase 2)"
    )
    
    # Requirements
    experience_required: int = Field(
        ..., 
        ge=0, 
        le=30, 
        description="Years of experience required"
    )
    skills_required: list[str] = Field(
        default_factory=list,
        description="Required skills for the position"
    )
    education: Optional[str] = Field(
        None,
        max_length=200,
        description="Education requirements"
    )
    
    # Compensation (optional)
    salary_min: Optional[int] = Field(None, ge=0, description="Minimum salary")
    salary_max: Optional[int] = Field(None, ge=0, description="Maximum salary")
    salary_currency: str = Field(default="USD", max_length=3)
    
    # Job details
    location: Optional[str] = Field(None, max_length=200, description="Job location")
    remote_type: str = Field(
        default="onsite",
        description="Remote work type: onsite, remote, hybrid"
    )
    employment_type: str = Field(
        default="full-time",
        description="Employment type: full-time, part-time, contract"
    )
    
    # Status
    status: JobStatus = Field(
        default=JobStatus.DRAFT,
        description="Job posting status"
    )
    
    # References
    company_id: str = Field(..., description="Company ObjectId")
    hr_id: str = Field(..., description="HR user ObjectId who created this job")
    
    # Metrics
    views_count: int = Field(default=0)
    applications_count: int = Field(default=0)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = Field(None, description="When job was published")
    
    # Phase 2: AI Integration fields (not used in Phase 1)
    # embedding_id: Optional[str] = Field(None, description="Qdrant vector ID")
    # ai_generated: bool = Field(default=False, description="Whether description was AI-generated")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class JobInDB(JobModel):
    """
    Job model with database ID.
    """
    id: str = Field(..., alias="_id", description="MongoDB ObjectId as string")
    
    class Config:
        populate_by_name = True

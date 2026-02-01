"""
Job Schemas

Request and response schemas for job and company endpoints.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.utils.enums import CompanySize, JobStatus


# ============================================
# Company Schemas
# ============================================


class CompanyCreateRequest(BaseModel):
    """
    Company creation request schema.
    """

    name: str = Field(..., min_length=2, max_length=200)
    industry: str = Field(..., min_length=2, max_length=100)
    size: CompanySize
    description: Optional[str] = Field(None, max_length=2000)
    website: Optional[str] = None
    logo_url: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)


class CompanyUpdateRequest(BaseModel):
    """
    Company update request schema.
    All fields optional for partial updates.
    """

    name: Optional[str] = Field(None, min_length=2, max_length=200)
    industry: Optional[str] = Field(None, min_length=2, max_length=100)
    size: Optional[CompanySize] = None
    description: Optional[str] = Field(None, max_length=2000)
    website: Optional[str] = None
    logo_url: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)


class CompanyResponse(BaseModel):
    """
    Company response schema.
    """

    id: str
    name: str
    industry: str
    size: CompanySize
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime


# ============================================
# Job Schemas
# ============================================


class JobCreateRequest(BaseModel):
    """
    Job creation request schema.

    Phase 1: Manual job description input
    Phase 2: AI-generated descriptions via ai_service
    """

    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=50, max_length=10000)
    experience_required: int = Field(..., ge=0, le=30)
    skills_required: list[str] = Field(default_factory=list)
    education: Optional[str] = Field(None, max_length=200)

    # Compensation
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: str = Field(default="USD", max_length=3)

    # Job details
    location: Optional[str] = Field(None, max_length=200)
    remote_type: str = Field(default="onsite")
    employment_type: str = Field(default="full-time")

    # Initial status
    status: JobStatus = Field(default=JobStatus.DRAFT)


class JobUpdateRequest(BaseModel):
    """
    Job update request schema.
    All fields optional for partial updates.
    """

    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=50, max_length=10000)
    experience_required: Optional[int] = Field(None, ge=0, le=30)
    skills_required: Optional[list[str]] = None
    education: Optional[str] = Field(None, max_length=200)
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: Optional[str] = Field(None, max_length=3)
    location: Optional[str] = Field(None, max_length=200)
    remote_type: Optional[str] = None
    employment_type: Optional[str] = None
    status: Optional[JobStatus] = None


class JobResponse(BaseModel):
    """
    Job response schema for single job.
    """

    id: str
    title: str
    description: str
    experience_required: int
    skills_required: list[str]
    education: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str
    location: Optional[str] = None
    remote_type: str
    employment_type: str
    status: JobStatus
    company_id: str
    views_count: int
    applications_count: int
    created_at: datetime
    published_at: Optional[datetime] = None

    # Populated in API
    company_name: Optional[str] = None


class JobListResponse(BaseModel):
    """
    Job list item response (lighter weight).
    """

    id: str
    title: str
    experience_required: int
    location: Optional[str] = None
    remote_type: str
    employment_type: str
    status: JobStatus
    company_name: Optional[str] = None
    created_at: datetime
    applications_count: int = 0


# ============================================
# Application Schemas
# ============================================


class ApplicationCreateRequest(BaseModel):
    """
    Job application request schema.
    """

    job_id: str = Field(..., description="Job to apply for")
    cover_letter: Optional[str] = Field(None, max_length=5000)
    resume_url: Optional[str] = None


class ApplicationResponse(BaseModel):
    """
    Application response schema.
    """

    id: str
    candidate_id: str
    job_id: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    status: str
    created_at: datetime

    # Populated fields
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None

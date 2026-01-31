# Schemas module exports
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    AuthResponse,
)
from app.schemas.job import (
    CompanyCreateRequest,
    CompanyUpdateRequest,
    CompanyResponse,
    JobCreateRequest,
    JobUpdateRequest,
    JobResponse,
    JobListResponse,
    ApplicationCreateRequest,
    ApplicationResponse,
)
from app.schemas.interview import (
    InterviewScheduleRequest,
    InterviewUpdateRequest,
    InterviewResponse,
    InterviewListResponse,
)

__all__ = [
    # Auth
    "UserRegisterRequest",
    "UserLoginRequest",
    "TokenResponse",
    "UserResponse",
    "AuthResponse",
    # Job
    "CompanyCreateRequest",
    "CompanyUpdateRequest",
    "CompanyResponse",
    "JobCreateRequest",
    "JobUpdateRequest",
    "JobResponse",
    "JobListResponse",
    "ApplicationCreateRequest",
    "ApplicationResponse",
    # Interview
    "InterviewScheduleRequest",
    "InterviewUpdateRequest",
    "InterviewResponse",
    "InterviewListResponse",
]

# Services module exports
from app.services.auth_service import (
    register_user,
    authenticate_user,
    create_user_token,
    format_user_response,
    get_user_by_id,
    update_user_profile,
)
from app.services.job_service import (
    create_company,
    get_company_by_hr,
    get_company_by_id,
    update_company,
    create_job,
    get_job_by_id,
    get_jobs_by_hr,
    get_published_jobs,
    update_job,
    increment_job_views,
    create_application,
    get_applications_by_candidate,
    get_applications_by_job,
    get_application_by_id,
    update_application_status,
)
from app.services.interview_service import (
    schedule_interview,
    get_interview_by_id,
    get_interviews_by_candidate,
    get_interviews_by_job,
    get_interviews_by_hr,
    update_interview,
    cancel_interview,
)
from app.services.ai_service_placeholder import get_ai_client, AIServiceClient

__all__ = [
    # Auth
    "register_user",
    "authenticate_user",
    "create_user_token",
    "format_user_response",
    "get_user_by_id",
    "update_user_profile",
    # Job
    "create_company",
    "get_company_by_hr",
    "get_company_by_id",
    "update_company",
    "create_job",
    "get_job_by_id",
    "get_jobs_by_hr",
    "get_published_jobs",
    "update_job",
    "increment_job_views",
    "create_application",
    "get_applications_by_candidate",
    "get_applications_by_job",
    "get_application_by_id",
    "update_application_status",
    # Interview
    "schedule_interview",
    "get_interview_by_id",
    "get_interviews_by_candidate",
    "get_interviews_by_job",
    "get_interviews_by_hr",
    "update_interview",
    "cancel_interview",
    # AI
    "get_ai_client",
    "AIServiceClient",
]

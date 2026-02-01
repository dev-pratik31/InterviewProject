"""
HR API Routes

Endpoints for HR users to manage companies, jobs, applications, and interviews.
All endpoints require HR role authentication.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import CurrentHRUser
from app.schemas.job import (
    CompanyCreateRequest,
    CompanyUpdateRequest,
    CompanyResponse,
    JobCreateRequest,
    JobUpdateRequest,
    JobResponse,
    JobListResponse,
    ApplicationResponse,
)
from app.schemas.interview import InterviewResponse, InterviewUpdateRequest
from app.services.job_service import (
    create_company,
    get_company_by_hr,
    get_company_by_id,
    update_company,
    create_job,
    get_job_by_id,
    get_jobs_by_hr,
    update_job,
    get_applications_by_job,
    get_application_by_id,
    update_application_status,
)
from app.services.interview_service import (
    get_interviews_by_hr,
    get_interviews_by_job,
    get_interview_by_id,
    update_interview,
)
from app.utils.enums import ApplicationStatus
from app.utils.responses import pagination_response


router = APIRouter(prefix="/hr", tags=["HR"])


# ============================================
# Company Endpoints
# ============================================


@router.post(
    "/company",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create company profile",
)
async def create_company_profile(
    request: CompanyCreateRequest, current_user: CurrentHRUser
):
    """
    Create a company profile for the HR user.

    Each HR user can only have one company.
    """
    try:
        company = await create_company(current_user["_id"], request)
        return CompanyResponse(
            id=str(company["_id"]),
            name=company["name"],
            industry=company["industry"],
            size=company["size"],
            description=company.get("description"),
            website=company.get("website"),
            logo_url=company.get("logo_url"),
            location=company.get("location"),
            created_at=company["created_at"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/company",
    response_model=CompanyResponse,
    summary="Get my company",
)
async def get_my_company(current_user: CurrentHRUser):
    """Get the current HR user's company profile."""
    company = await get_company_by_hr(current_user["_id"])

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found. Create one first.",
        )

    return CompanyResponse(
        id=str(company["_id"]),
        name=company["name"],
        industry=company["industry"],
        size=company["size"],
        description=company.get("description"),
        website=company.get("website"),
        logo_url=company.get("logo_url"),
        location=company.get("location"),
        created_at=company["created_at"],
    )


@router.put(
    "/company",
    response_model=CompanyResponse,
    summary="Update company profile",
)
async def update_company_profile(
    request: CompanyUpdateRequest, current_user: CurrentHRUser
):
    """Update the HR user's company profile."""
    company = await get_company_by_hr(current_user["_id"])

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company profile not found"
        )

    updated = await update_company(str(company["_id"]), request)

    return CompanyResponse(
        id=str(updated["_id"]),
        name=updated["name"],
        industry=updated["industry"],
        size=updated["size"],
        description=updated.get("description"),
        website=updated.get("website"),
        logo_url=updated.get("logo_url"),
        location=updated.get("location"),
        created_at=updated["created_at"],
    )


# ============================================
# Job Endpoints
# ============================================


@router.post(
    "/jobs",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a job posting",
)
async def create_job_posting(request: JobCreateRequest, current_user: CurrentHRUser):
    """
    Create a new job posting.

    Requires a company profile to be set up first.
    """
    company_id = current_user.get("company_id")

    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Create a company profile first",
        )

    company = await get_company_by_id(company_id)

    job = await create_job(current_user["_id"], company_id, request)

    return JobResponse(
        id=str(job["_id"]),
        title=job["title"],
        description=job["description"],
        experience_required=job["experience_required"],
        skills_required=job["skills_required"],
        education=job.get("education"),
        salary_min=job.get("salary_min"),
        salary_max=job.get("salary_max"),
        salary_currency=job["salary_currency"],
        location=job.get("location"),
        remote_type=job["remote_type"],
        employment_type=job["employment_type"],
        status=job["status"],
        company_id=job["company_id"],
        views_count=job["views_count"],
        applications_count=job["applications_count"],
        created_at=job["created_at"],
        published_at=job.get("published_at"),
        company_name=company["name"] if company else None,
    )


@router.get(
    "/jobs",
    summary="Get my job postings",
)
async def get_my_jobs(
    current_user: CurrentHRUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """Get all job postings created by the current HR user."""
    jobs, total = await get_jobs_by_hr(current_user["_id"], page, page_size)

    # Get company name
    company_id = current_user.get("company_id")
    company = await get_company_by_id(company_id) if company_id else None
    company_name = company["name"] if company else None

    job_list = [
        JobListResponse(
            id=str(job["_id"]),
            title=job["title"],
            experience_required=job["experience_required"],
            location=job.get("location"),
            remote_type=job["remote_type"],
            employment_type=job["employment_type"],
            status=job["status"],
            company_name=company_name,
            created_at=job["created_at"],
            applications_count=job.get("applications_count", 0),
        )
        for job in jobs
    ]

    return pagination_response(
        data=[j.model_dump() for j in job_list],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/jobs/{job_id}",
    response_model=JobResponse,
    summary="Get job details",
)
async def get_job_details(job_id: str, current_user: CurrentHRUser):
    """Get detailed information about a specific job."""
    job = await get_job_by_id(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    if job["hr_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this job",
        )

    company = await get_company_by_id(job["company_id"])

    return JobResponse(
        id=str(job["_id"]),
        title=job["title"],
        description=job["description"],
        experience_required=job["experience_required"],
        skills_required=job["skills_required"],
        education=job.get("education"),
        salary_min=job.get("salary_min"),
        salary_max=job.get("salary_max"),
        salary_currency=job["salary_currency"],
        location=job.get("location"),
        remote_type=job["remote_type"],
        employment_type=job["employment_type"],
        status=job["status"],
        company_id=job["company_id"],
        views_count=job["views_count"],
        applications_count=job["applications_count"],
        created_at=job["created_at"],
        published_at=job.get("published_at"),
        company_name=company["name"] if company else None,
    )


@router.put(
    "/jobs/{job_id}",
    response_model=JobResponse,
    summary="Update job posting",
)
async def update_job_posting(
    job_id: str, request: JobUpdateRequest, current_user: CurrentHRUser
):
    """Update a job posting."""
    job = await get_job_by_id(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    if job["hr_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this job",
        )

    updated = await update_job(job_id, request)
    company = await get_company_by_id(updated["company_id"])

    return JobResponse(
        id=str(updated["_id"]),
        title=updated["title"],
        description=updated["description"],
        experience_required=updated["experience_required"],
        skills_required=updated["skills_required"],
        education=updated.get("education"),
        salary_min=updated.get("salary_min"),
        salary_max=updated.get("salary_max"),
        salary_currency=updated["salary_currency"],
        location=updated.get("location"),
        remote_type=updated["remote_type"],
        employment_type=updated["employment_type"],
        status=updated["status"],
        company_id=updated["company_id"],
        views_count=updated["views_count"],
        applications_count=updated["applications_count"],
        created_at=updated["created_at"],
        published_at=updated.get("published_at"),
        company_name=company["name"] if company else None,
    )


# ============================================
# Application Endpoints
# ============================================


@router.get(
    "/jobs/{job_id}/applications",
    summary="Get applications for a job",
)
async def get_job_applications(
    job_id: str,
    current_user: CurrentHRUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """Get all applications for a specific job."""
    # Verify job ownership
    job = await get_job_by_id(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    if job["hr_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this job",
        )

    applications, total = await get_applications_by_job(job_id, page, page_size)

    # Enrich with candidate and job info
    from app.services.auth_service import get_user_by_id

    app_list = []
    for app in applications:
        candidate = await get_user_by_id(app["candidate_id"])
        app_list.append(
            ApplicationResponse(
                id=str(app["_id"]),
                candidate_id=str(app["candidate_id"]),
                job_id=str(app["job_id"]),
                cover_letter=app.get("cover_letter"),
                resume_url=app.get("resume_url"),
                status=app["status"],
                created_at=app["created_at"],
                job_title=job["title"],
                candidate_name=candidate["full_name"] if candidate else None,
                candidate_email=candidate["email"] if candidate else None,
            )
        )

    return pagination_response(
        data=[a.model_dump() for a in app_list],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/applications/{application_id}",
    summary="Get application with interview feedback",
)
async def get_single_application(
    application_id: str,
    current_user: CurrentHRUser,
):
    """Get single application with full interview feedback for HR review."""
    application = await get_application_by_id(application_id)

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    # Verify job ownership
    job = await get_job_by_id(application["job_id"])
    if not job or job["hr_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this application",
        )

    # Get candidate info
    from app.services.auth_service import get_user_by_id

    candidate = await get_user_by_id(application["candidate_id"])

    return {
        "id": str(application["_id"]),
        "candidate_id": str(application["candidate_id"]),
        "job_id": str(application["job_id"]),
        "cover_letter": application.get("cover_letter"),
        "resume_url": application.get("resume_url"),
        "status": application["status"],
        "created_at": application["created_at"],
        "job_title": job["title"],
        "candidate_name": candidate["full_name"] if candidate else None,
        "candidate_email": candidate["email"] if candidate else None,
        # Resume screening fields
        "resume_screening_analysis": application.get("resume_screening_analysis"),
        "resume_match_score": application.get("resume_match_score"),
        # Interview feedback fields
        "interview_type": application.get("interview_type"),
        "interview_scheduled_at": application.get("interview_scheduled_at"),
        "interview_status": application.get("interview_status"),
        "interview_id": str(application["interview_id"])
        if application.get("interview_id")
        else None,
        "interview_feedback": application.get("interview_feedback"),
        "ai_recommendation": application.get("ai_recommendation"),
        "interview_scores": application.get("interview_scores"),
        "interview_completed_at": application.get("interview_completed_at"),
    }


@router.put(
    "/applications/{application_id}/status",
    response_model=ApplicationResponse,
    summary="Update application status",
)
async def update_app_status(
    application_id: str,
    current_user: CurrentHRUser,
    status: Optional[str] = None,
):
    """Update the status of an application (accept/reject)."""
    from pydantic import BaseModel

    application = await get_application_by_id(application_id)

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    # Verify job ownership
    job = await get_job_by_id(application["job_id"])
    if not job or job["hr_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this application",
        )

    updated = await update_application_status(application_id, status, None)

    return ApplicationResponse(
        id=str(updated["_id"]),
        candidate_id=str(updated["candidate_id"]),
        job_id=str(updated["job_id"]),
        cover_letter=updated.get("cover_letter"),
        resume_url=updated.get("resume_url"),
        status=updated["status"],
        created_at=updated["created_at"],
        job_title=job["title"],
    )


# ============================================
# Interview Endpoints
# ============================================


@router.get(
    "/interviews",
    summary="Get all interviews",
)
async def get_all_interviews(
    current_user: CurrentHRUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """Get all interviews for jobs managed by the current HR user."""
    interviews, total = await get_interviews_by_hr(current_user["_id"], page, page_size)

    # Enrich with job and candidate info
    from app.services.auth_service import get_user_by_id

    interview_list = []
    for interview in interviews:
        job = await get_job_by_id(interview["job_id"])
        candidate = await get_user_by_id(interview["candidate_id"])
        company = await get_company_by_id(job["company_id"]) if job else None

        interview_list.append(
            InterviewResponse(
                id=str(interview["_id"]),
                application_id=str(interview["application_id"]),
                candidate_id=str(interview["candidate_id"]),
                job_id=str(interview["job_id"]),
                scheduled_time=interview["scheduled_time"],
                duration_minutes=interview["duration_minutes"],
                status=interview["status"],
                notes=interview.get("notes"),
                created_at=interview["created_at"],
                completed_at=interview.get("completed_at"),
                job_title=job["title"] if job else None,
                company_name=company["name"] if company else None,
                candidate_name=candidate["full_name"] if candidate else None,
                candidate_email=candidate["email"] if candidate else None,
            )
        )

    return pagination_response(
        data=[i.model_dump() for i in interview_list],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/interviews/{interview_id}",
    response_model=InterviewResponse,
    summary="Update interview",
)
async def update_interview_details(
    interview_id: str,
    request: InterviewUpdateRequest,
    current_user: CurrentHRUser,
):
    """Update interview details (reschedule, add notes, change status)."""
    interview = await get_interview_by_id(interview_id)

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found"
        )

    # Verify job ownership
    job = await get_job_by_id(interview["job_id"])
    if not job or job["hr_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this interview",
        )

    updated = await update_interview(interview_id, request)

    from app.services.auth_service import get_user_by_id

    candidate = await get_user_by_id(updated["candidate_id"])
    company = await get_company_by_id(job["company_id"])

    return InterviewResponse(
        id=str(updated["_id"]),
        application_id=str(updated["application_id"]),
        candidate_id=str(updated["candidate_id"]),
        job_id=str(updated["job_id"]),
        scheduled_time=updated["scheduled_time"],
        duration_minutes=updated["duration_minutes"],
        status=updated["status"],
        notes=updated.get("notes"),
        created_at=updated["created_at"],
        completed_at=updated.get("completed_at"),
        job_title=job["title"],
        company_name=company["name"] if company else None,
        candidate_name=candidate["full_name"] if candidate else None,
        candidate_email=candidate["email"] if candidate else None,
    )

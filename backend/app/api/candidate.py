"""
Candidate API Routes

Endpoints for candidates to browse jobs, apply, and schedule interviews.
All endpoints require Candidate role authentication.
"""

from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import CurrentCandidateUser
from app.schemas.job import (
    JobResponse,
    JobListResponse,
    ApplicationCreateRequest,
    ApplicationResponse,
)
from app.schemas.interview import (
    InterviewScheduleRequest,
    InterviewResponse,
    InterviewListResponse,
)
from app.services.job_service import (
    get_published_jobs,
    get_job_by_id,
    get_company_by_id,
    increment_job_views,
    create_application,
    get_applications_by_candidate,
    get_application_by_id,
)
from app.services.interview_service import (
    schedule_interview,
    get_interviews_by_candidate,
    get_interview_by_id,
)
from app.utils.responses import pagination_response


router = APIRouter(prefix="/candidate", tags=["Candidate"])


# ============================================
# Job Browsing Endpoints
# ============================================

@router.get(
    "/jobs",
    summary="Browse job openings",
)
async def browse_jobs(
    current_user: CurrentCandidateUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: str = Query(None, description="Search jobs by title or description"),
):
    """
    Browse published job openings.
    
    Supports text search across job titles and descriptions.
    """
    jobs, total = await get_published_jobs(page, page_size, search)
    
    job_list = []
    for job in jobs:
        company = await get_company_by_id(job["company_id"])
        job_list.append(
            JobListResponse(
                id=str(job["_id"]),
                title=job["title"],
                experience_required=job["experience_required"],
                location=job.get("location"),
                remote_type=job["remote_type"],
                employment_type=job["employment_type"],
                status=job["status"],
                company_name=company["name"] if company else None,
                created_at=job["created_at"],
            )
        )
    
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
async def get_job_detail(job_id: str, current_user: CurrentCandidateUser):
    """
    Get detailed information about a job.
    
    Increments view count for analytics.
    """
    job = await get_job_by_id(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Increment views
    await increment_job_views(job_id)
    
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
        views_count=job["views_count"] + 1,  # Include current view
        applications_count=job["applications_count"],
        created_at=job["created_at"],
        published_at=job.get("published_at"),
        company_name=company["name"] if company else None,
    )


# ============================================
# Application Endpoints
# ============================================

@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply to a job",
)
async def apply_to_job(
    request: ApplicationCreateRequest,
    current_user: CurrentCandidateUser
):
    """
    Apply to a job opening.
    
    Can only apply once per job.
    """
    try:
        application = await create_application(current_user["_id"], request)
        
        job = await get_job_by_id(application["job_id"])
        company = await get_company_by_id(job["company_id"]) if job else None
        
        return ApplicationResponse(
            id=str(application["_id"]),
            candidate_id=application["candidate_id"],
            job_id=application["job_id"],
            cover_letter=application.get("cover_letter"),
            resume_url=application.get("resume_url"),
            status=application["status"],
            created_at=application["created_at"],
            job_title=job["title"] if job else None,
            company_name=company["name"] if company else None,
            candidate_name=current_user["full_name"],
            candidate_email=current_user["email"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/applications",
    summary="Get my applications",
)
async def get_my_applications(
    current_user: CurrentCandidateUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """Get all applications submitted by the current candidate."""
    applications, total = await get_applications_by_candidate(
        current_user["_id"], page, page_size
    )
    
    app_list = []
    for app in applications:
        job = await get_job_by_id(app["job_id"])
        company = await get_company_by_id(job["company_id"]) if job else None
        
        app_list.append(
            ApplicationResponse(
                id=str(app["_id"]),
                candidate_id=app["candidate_id"],
                job_id=app["job_id"],
                cover_letter=app.get("cover_letter"),
                resume_url=app.get("resume_url"),
                status=app["status"],
                created_at=app["created_at"],
                job_title=job["title"] if job else None,
                company_name=company["name"] if company else None,
                candidate_name=current_user["full_name"],
                candidate_email=current_user["email"],
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
    response_model=ApplicationResponse,
    summary="Get application details",
)
async def get_application_detail(
    application_id: str,
    current_user: CurrentCandidateUser
):
    """Get details of a specific application."""
    application = await get_application_by_id(application_id)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    if application["candidate_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this application"
        )
    
    job = await get_job_by_id(application["job_id"])
    company = await get_company_by_id(job["company_id"]) if job else None
    
    return ApplicationResponse(
        id=str(application["_id"]),
        candidate_id=application["candidate_id"],
        job_id=application["job_id"],
        cover_letter=application.get("cover_letter"),
        resume_url=application.get("resume_url"),
        status=application["status"],
        created_at=application["created_at"],
        job_title=job["title"] if job else None,
        company_name=company["name"] if company else None,
        candidate_name=current_user["full_name"],
        candidate_email=current_user["email"],
    )


# ============================================
# Interview Endpoints
# ============================================

@router.post(
    "/interviews",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule an interview",
)
async def schedule_interview_slot(
    request: InterviewScheduleRequest,
    current_user: CurrentCandidateUser
):
    """
    Schedule an interview for an application.
    
    Can only schedule one interview per application.
    """
    try:
        interview = await schedule_interview(current_user["_id"], request)
        
        job = await get_job_by_id(interview["job_id"])
        company = await get_company_by_id(job["company_id"]) if job else None
        
        return InterviewResponse(
            id=str(interview["_id"]),
            application_id=interview["application_id"],
            candidate_id=interview["candidate_id"],
            job_id=interview["job_id"],
            scheduled_time=interview["scheduled_time"],
            duration_minutes=interview["duration_minutes"],
            status=interview["status"],
            notes=interview.get("notes"),
            created_at=interview["created_at"],
            completed_at=interview.get("completed_at"),
            job_title=job["title"] if job else None,
            company_name=company["name"] if company else None,
            candidate_name=current_user["full_name"],
            candidate_email=current_user["email"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/interviews",
    summary="Get my interviews",
)
async def get_my_interviews(
    current_user: CurrentCandidateUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """Get all interviews for the current candidate."""
    interviews, total = await get_interviews_by_candidate(
        current_user["_id"], page, page_size
    )
    
    interview_list = []
    for interview in interviews:
        job = await get_job_by_id(interview["job_id"])
        company = await get_company_by_id(job["company_id"]) if job else None
        
        interview_list.append(
            InterviewListResponse(
                id=str(interview["_id"]),
                scheduled_time=interview["scheduled_time"],
                duration_minutes=interview["duration_minutes"],
                status=interview["status"],
                job_title=job["title"] if job else None,
                company_name=company["name"] if company else None,
                candidate_name=current_user["full_name"],
            )
        )
    
    return pagination_response(
        data=[i.model_dump() for i in interview_list],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/interviews/{interview_id}",
    response_model=InterviewResponse,
    summary="Get interview details",
)
async def get_interview_detail(
    interview_id: str,
    current_user: CurrentCandidateUser
):
    """Get details of a specific interview."""
    interview = await get_interview_by_id(interview_id)
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    if interview["candidate_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this interview"
        )
    
    job = await get_job_by_id(interview["job_id"])
    company = await get_company_by_id(job["company_id"]) if job else None
    
    return InterviewResponse(
        id=str(interview["_id"]),
        application_id=interview["application_id"],
        candidate_id=interview["candidate_id"],
        job_id=interview["job_id"],
        scheduled_time=interview["scheduled_time"],
        duration_minutes=interview["duration_minutes"],
        status=interview["status"],
        notes=interview.get("notes"),
        created_at=interview["created_at"],
        completed_at=interview.get("completed_at"),
        job_title=job["title"] if job else None,
        company_name=company["name"] if company else None,
        candidate_name=current_user["full_name"],
        candidate_email=current_user["email"],
    )

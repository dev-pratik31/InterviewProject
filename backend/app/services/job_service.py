"""
Job Service

Business logic for jobs, companies, and applications.
Handles CRUD operations and business rules.
"""

from datetime import datetime
from typing import Optional

from bson import ObjectId

from app.database.mongodb import get_database
from app.schemas.job import (
    CompanyCreateRequest,
    CompanyUpdateRequest,
    JobCreateRequest,
    JobUpdateRequest,
    ApplicationCreateRequest,
)
from app.utils.enums import JobStatus, ApplicationStatus
from app.utils.resume_parser import parse_resume_content
from app.services.ai_service_placeholder import get_ai_client
import os


# ============================================
# Company Operations
# ============================================


async def create_company(hr_id: str, request: CompanyCreateRequest) -> dict:
    """
    Create a company for an HR user.

    Args:
        hr_id: HR user's ObjectId
        request: Company creation data

    Returns:
        Created company document

    Raises:
        ValueError: If HR already has a company
    """
    db = await get_database()

    # Check if HR already has a company
    existing = await db.companies.find_one({"hr_id": hr_id})
    if existing:
        raise ValueError("You already have a company profile")

    company_doc = {
        "name": request.name,
        "industry": request.industry,
        "size": request.size.value,
        "description": request.description,
        "website": request.website,
        "logo_url": request.logo_url,
        "location": request.location,
        "hr_id": hr_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.companies.insert_one(company_doc)
    company_doc["_id"] = result.inserted_id

    # Update HR user with company_id
    await db.users.update_one(
        {"_id": ObjectId(hr_id)}, {"$set": {"company_id": str(result.inserted_id)}}
    )

    return company_doc


async def get_company_by_hr(hr_id: str) -> Optional[dict]:
    """Get company by HR user ID."""
    db = await get_database()
    return await db.companies.find_one({"hr_id": hr_id})


async def get_company_by_id(company_id: str) -> Optional[dict]:
    """Get company by ID."""
    db = await get_database()
    try:
        return await db.companies.find_one({"_id": ObjectId(company_id)})
    except Exception:
        return None


async def update_company(
    company_id: str, request: CompanyUpdateRequest
) -> Optional[dict]:
    """Update company profile."""
    db = await get_database()

    updates = request.model_dump(exclude_unset=True)
    updates = {
        k: v.value if hasattr(v, "value") else v
        for k, v in updates.items()
        if v is not None
    }

    if not updates:
        return await get_company_by_id(company_id)

    updates["updated_at"] = datetime.utcnow()

    result = await db.companies.find_one_and_update(
        {"_id": ObjectId(company_id)}, {"$set": updates}, return_document=True
    )

    return result


# ============================================
# Job Operations
# ============================================


async def create_job(hr_id: str, company_id: str, request: JobCreateRequest) -> dict:
    """
    Create a job posting.

    Args:
        hr_id: HR user's ObjectId
        company_id: Company's ObjectId
        request: Job creation data

    Returns:
        Created job document
    """
    db = await get_database()

    job_doc = {
        "title": request.title,
        "description": request.description,
        "experience_required": request.experience_required,
        "skills_required": request.skills_required,
        "education": request.education,
        "salary_min": request.salary_min,
        "salary_max": request.salary_max,
        "salary_currency": request.salary_currency,
        "location": request.location,
        "remote_type": request.remote_type,
        "employment_type": request.employment_type,
        "status": request.status.value,
        "company_id": company_id,
        "hr_id": hr_id,
        "views_count": 0,
        "applications_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "published_at": datetime.utcnow()
        if request.status == JobStatus.PUBLISHED
        else None,
    }

    result = await db.jobs.insert_one(job_doc)
    job_doc["_id"] = result.inserted_id

    return job_doc


async def get_job_by_id(job_id: str) -> Optional[dict]:
    """Get job by ID."""
    db = await get_database()
    try:
        return await db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return None


async def get_jobs_by_hr(
    hr_id: str, page: int = 1, page_size: int = 10
) -> tuple[list, int]:
    """
    Get jobs created by an HR user.

    Returns:
        Tuple of (jobs list, total count)
    """
    db = await get_database()

    query = {"hr_id": hr_id}

    total = await db.jobs.count_documents(query)

    cursor = (
        db.jobs.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    jobs = await cursor.to_list(length=page_size)

    return jobs, total


async def get_published_jobs(
    page: int = 1, page_size: int = 10, search: Optional[str] = None
) -> tuple[list, int]:
    """
    Get published jobs for candidate browsing.

    Returns:
        Tuple of (jobs list, total count)
    """
    db = await get_database()

    query = {"status": JobStatus.PUBLISHED.value}

    if search:
        query["$text"] = {"$search": search}

    total = await db.jobs.count_documents(query)

    cursor = (
        db.jobs.find(query)
        .sort("published_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    jobs = await cursor.to_list(length=page_size)

    return jobs, total


async def update_job(job_id: str, request: JobUpdateRequest) -> Optional[dict]:
    """Update a job posting."""
    db = await get_database()

    updates = request.model_dump(exclude_unset=True)
    updates = {
        k: v.value if hasattr(v, "value") else v
        for k, v in updates.items()
        if v is not None
    }

    if not updates:
        return await get_job_by_id(job_id)

    updates["updated_at"] = datetime.utcnow()

    # Set published_at if publishing
    if updates.get("status") == JobStatus.PUBLISHED.value:
        job = await get_job_by_id(job_id)
        if job and not job.get("published_at"):
            updates["published_at"] = datetime.utcnow()

    result = await db.jobs.find_one_and_update(
        {"_id": ObjectId(job_id)}, {"$set": updates}, return_document=True
    )

    return result


async def increment_job_views(job_id: str) -> None:
    """Increment job view count."""
    db = await get_database()
    await db.jobs.update_one({"_id": ObjectId(job_id)}, {"$inc": {"views_count": 1}})


# ============================================
# Application Operations
# ============================================


async def create_application(candidate_id: ObjectId, request: ApplicationCreateRequest):
    """
    Create a new application with AI resume screening.

    Args:
        candidate_id: The candidate's user ID
        request: Application data including resume URL

    Returns:
        The created application document
    """
    from app.database.mongodb import MongoDB
    from datetime import datetime
    from app.utils.resume_parser import parse_resume_content

    db = MongoDB.get_database()

    # Check if already applied
    existing = await db.applications.find_one(
        {
            "candidate_id": candidate_id,
            "job_id": ObjectId(request.job_id),
        }
    )

    if existing:
        raise ValueError("You have already applied to this job")

    # Verify job exists and is published
    job = await db.jobs.find_one({"_id": ObjectId(request.job_id)})
    if not job:
        raise ValueError("Job not found")

    if job["status"] != "published":
        raise ValueError("This job is not accepting applications")

    # Get candidate info
    from app.services.auth_service import get_user_by_id

    candidate = await get_user_by_id(candidate_id)

    # Create application document
    application_data = {
        "_id": ObjectId(),
        "candidate_id": candidate_id,
        "job_id": ObjectId(request.job_id),
        "cover_letter": request.cover_letter,
        "resume_url": request.resume_url,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }

    # AI Resume Screening (if resume provided)
    if request.resume_url and job.get("description"):
        try:
            print(
                f"🔍 Starting resume analysis for application {application_data['_id']}..."
            )

            # Parse resume content
            resume_data = parse_resume_content(request.resume_url)

            if resume_data["success"] and resume_data["text"]:
                # Call AI screening
                from app.llm.provider import get_provider
                from app.api.ai_routes import ResumeScreeningRequest, SYSTEM_PROMPT

                provider = get_provider()

                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"""
JOB DESCRIPTION:
{job["description"]}

RESUME CONTENT:
{resume_data["text"]}

Analyze the resume and provide the structured report.
""",
                    },
                ]

                # Import the response model
                from pydantic import BaseModel, Field
                from typing import List

                class ResumeScreeningResponse(BaseModel):
                    score: int = Field(..., description="Match score from 0 to 100")
                    strengths: List[str] = Field(
                        ..., description="List of matching strengths"
                    )
                    gaps: List[str] = Field(
                        ..., description="List of missing skills or gaps"
                    )
                    transferable_skills: List[str] = Field(
                        ..., description="Skills that transfer well"
                    )
                    summary: str = Field(..., description="Recruiter-friendly summary")

                result = await provider.generate_structured(
                    messages=messages,
                    response_model=ResumeScreeningResponse,
                    temperature=0.1,
                )

                # Save analysis to application
                application_data["resume_screening_analysis"] = {
                    "score": result.score,
                    "strengths": result.strengths,
                    "gaps": result.gaps,
                    "transferable_skills": result.transferable_skills,
                    "summary": result.summary,
                }
                application_data["resume_match_score"] = result.score / 100.0

                print(f"✅ Resume analysis complete. Score: {result.score}/100")

            else:
                print(
                    f"⚠️ Could not extract text from resume: {resume_data.get('error')}"
                )
                application_data["resume_screening_analysis"] = None
                application_data["resume_match_score"] = None

        except Exception as e:
            print(f"❌ Resume screening failed: {e}")
            import traceback

            traceback.print_exc()
            # Don't fail the application - continue without analysis
            application_data["resume_screening_analysis"] = None
            application_data["resume_match_score"] = None
    else:
        print(
            f"ℹ️ Skipping resume analysis - resume_url: {bool(request.resume_url)}, job_description: {bool(job.get('description'))}"
        )

    # Insert application
    await db.applications.insert_one(application_data)

    # Increment application count
    await db.jobs.update_one(
        {"_id": ObjectId(request.job_id)}, {"$inc": {"applications_count": 1}}
    )

    print(f"✅ Application created: {application_data['_id']}")

    return application_data


async def get_applications_by_candidate(
    candidate_id: str, page: int = 1, page_size: int = 10
) -> tuple[list, int]:
    """Get applications by candidate."""
    db = await get_database()

    query = {"candidate_id": candidate_id}

    total = await db.applications.count_documents(query)

    cursor = (
        db.applications.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    applications = await cursor.to_list(length=page_size)

    return applications, total


async def get_applications_by_job(
    job_id: str, page: int = 1, page_size: int = 10
) -> tuple[list, int]:
    """Get applications for a specific job."""
    db = await get_database()

    query = {"job_id": ObjectId(job_id)}  # ✅ FIXED - Convert to ObjectId

    total = await db.applications.count_documents(query)

    cursor = (
        db.applications.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    applications = await cursor.to_list(length=page_size)

    return applications, total


async def get_application_by_id(application_id: str) -> Optional[dict]:
    """Get application by ID."""
    db = await get_database()
    try:
        return await db.applications.find_one({"_id": ObjectId(application_id)})
    except Exception:
        return None


async def update_application_status(
    application_id: str, status: ApplicationStatus, hr_notes: Optional[str] = None
) -> Optional[dict]:
    """Update application status (HR action)."""
    db = await get_database()

    updates = {
        "status": status.value,
        "updated_at": datetime.utcnow(),
        "reviewed_at": datetime.utcnow(),
    }

    if hr_notes:
        updates["hr_notes"] = hr_notes

    result = await db.applications.find_one_and_update(
        {"_id": ObjectId(application_id)}, {"$set": updates}, return_document=True
    )

    return result

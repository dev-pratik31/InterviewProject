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
        {"_id": ObjectId(hr_id)},
        {"$set": {"company_id": str(result.inserted_id)}}
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


async def update_company(company_id: str, request: CompanyUpdateRequest) -> Optional[dict]:
    """Update company profile."""
    db = await get_database()
    
    updates = request.model_dump(exclude_unset=True)
    updates = {k: v.value if hasattr(v, 'value') else v for k, v in updates.items() if v is not None}
    
    if not updates:
        return await get_company_by_id(company_id)
    
    updates["updated_at"] = datetime.utcnow()
    
    result = await db.companies.find_one_and_update(
        {"_id": ObjectId(company_id)},
        {"$set": updates},
        return_document=True
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
        "published_at": datetime.utcnow() if request.status == JobStatus.PUBLISHED else None,
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


async def get_jobs_by_hr(hr_id: str, page: int = 1, page_size: int = 10) -> tuple[list, int]:
    """
    Get jobs created by an HR user.
    
    Returns:
        Tuple of (jobs list, total count)
    """
    db = await get_database()
    
    query = {"hr_id": hr_id}
    
    total = await db.jobs.count_documents(query)
    
    cursor = db.jobs.find(query).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
    jobs = await cursor.to_list(length=page_size)
    
    return jobs, total


async def get_published_jobs(
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None
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
    
    cursor = db.jobs.find(query).sort("published_at", -1).skip((page - 1) * page_size).limit(page_size)
    jobs = await cursor.to_list(length=page_size)
    
    return jobs, total


async def update_job(job_id: str, request: JobUpdateRequest) -> Optional[dict]:
    """Update a job posting."""
    db = await get_database()
    
    updates = request.model_dump(exclude_unset=True)
    updates = {k: v.value if hasattr(v, 'value') else v for k, v in updates.items() if v is not None}
    
    if not updates:
        return await get_job_by_id(job_id)
    
    updates["updated_at"] = datetime.utcnow()
    
    # Set published_at if publishing
    if updates.get("status") == JobStatus.PUBLISHED.value:
        job = await get_job_by_id(job_id)
        if job and not job.get("published_at"):
            updates["published_at"] = datetime.utcnow()
    
    result = await db.jobs.find_one_and_update(
        {"_id": ObjectId(job_id)},
        {"$set": updates},
        return_document=True
    )
    
    return result


async def increment_job_views(job_id: str) -> None:
    """Increment job view count."""
    db = await get_database()
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$inc": {"views_count": 1}}
    )


# ============================================
# Application Operations
# ============================================

async def create_application(candidate_id: str, request: ApplicationCreateRequest) -> dict:
    """
    Create a job application.
    
    Args:
        candidate_id: Candidate user's ObjectId
        request: Application data
        
    Returns:
        Created application document
        
    Raises:
        ValueError: If already applied or job not found
    """
    db = await get_database()
    
    # Check if job exists and is published
    job = await get_job_by_id(request.job_id)
    if not job:
        raise ValueError("Job not found")
    if job["status"] != JobStatus.PUBLISHED.value:
        raise ValueError("Job is not accepting applications")
    
    # Check for duplicate application
    existing = await db.applications.find_one({
        "candidate_id": candidate_id,
        "job_id": request.job_id
    })
    if existing:
        raise ValueError("You have already applied to this job")
    
    application_doc = {
        "candidate_id": candidate_id,
        "job_id": request.job_id,
        "cover_letter": request.cover_letter,
        "resume_url": request.resume_url,
        "status": ApplicationStatus.PENDING.value,
        "hr_notes": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "reviewed_at": None,
    }
    
    result = await db.applications.insert_one(application_doc)
    application_doc["_id"] = result.inserted_id
    
    # Increment job application count
    await db.jobs.update_one(
        {"_id": ObjectId(request.job_id)},
        {"$inc": {"applications_count": 1}}
    )
    
    return application_doc


async def get_applications_by_candidate(
    candidate_id: str,
    page: int = 1,
    page_size: int = 10
) -> tuple[list, int]:
    """Get applications by candidate."""
    db = await get_database()
    
    query = {"candidate_id": candidate_id}
    
    total = await db.applications.count_documents(query)
    
    cursor = db.applications.find(query).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
    applications = await cursor.to_list(length=page_size)
    
    return applications, total


async def get_applications_by_job(
    job_id: str,
    page: int = 1,
    page_size: int = 10
) -> tuple[list, int]:
    """Get applications for a specific job."""
    db = await get_database()
    
    query = {"job_id": job_id}
    
    total = await db.applications.count_documents(query)
    
    cursor = db.applications.find(query).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
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
    application_id: str,
    status: ApplicationStatus,
    hr_notes: Optional[str] = None
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
        {"_id": ObjectId(application_id)},
        {"$set": updates},
        return_document=True
    )
    
    return result

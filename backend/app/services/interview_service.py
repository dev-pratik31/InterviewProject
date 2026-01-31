"""
Interview Service

Business logic for interview scheduling and management.

Phase 1: Basic scheduling
Phase 2: AI interview orchestration via LangGraph
"""

from datetime import datetime
from typing import Optional

from bson import ObjectId

from app.database.mongodb import get_database
from app.schemas.interview import InterviewScheduleRequest, InterviewUpdateRequest
from app.utils.enums import InterviewStatus, ApplicationStatus
from app.services.job_service import get_application_by_id, update_application_status


async def schedule_interview(
    candidate_id: str,
    request: InterviewScheduleRequest
) -> dict:
    """
    Schedule a new interview.
    
    Args:
        candidate_id: Candidate user's ObjectId
        request: Interview scheduling data
        
    Returns:
        Created interview document
        
    Raises:
        ValueError: If application not found or already has interview
    """
    db = await get_database()
    
    # Verify application exists and belongs to candidate
    application = await get_application_by_id(request.application_id)
    if not application:
        raise ValueError("Application not found")
    
    if application["candidate_id"] != candidate_id:
        raise ValueError("This application does not belong to you")
    
    # Check if interview already exists for this application
    existing = await db.interviews.find_one({
        "application_id": request.application_id,
        "status": {"$nin": [InterviewStatus.CANCELLED.value]}
    })
    if existing:
        raise ValueError("Interview already scheduled for this application")
    
    interview_doc = {
        "application_id": request.application_id,
        "candidate_id": candidate_id,
        "job_id": application["job_id"],
        "scheduled_time": request.scheduled_time,
        "duration_minutes": request.duration_minutes,
        "status": InterviewStatus.SCHEDULED.value,
        "notes": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "completed_at": None,
    }
    
    result = await db.interviews.insert_one(interview_doc)
    interview_doc["_id"] = result.inserted_id
    
    # Update application status
    await update_application_status(
        request.application_id,
        ApplicationStatus.INTERVIEW_SCHEDULED
    )
    
    return interview_doc


async def get_interview_by_id(interview_id: str) -> Optional[dict]:
    """Get interview by ID."""
    db = await get_database()
    try:
        return await db.interviews.find_one({"_id": ObjectId(interview_id)})
    except Exception:
        return None


async def get_interviews_by_candidate(
    candidate_id: str,
    page: int = 1,
    page_size: int = 10
) -> tuple[list, int]:
    """Get interviews for a candidate."""
    db = await get_database()
    
    query = {"candidate_id": candidate_id}
    
    total = await db.interviews.count_documents(query)
    
    cursor = (
        db.interviews.find(query)
        .sort("scheduled_time", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    interviews = await cursor.to_list(length=page_size)
    
    return interviews, total


async def get_interviews_by_job(
    job_id: str,
    page: int = 1,
    page_size: int = 10
) -> tuple[list, int]:
    """Get interviews for a specific job (HR view)."""
    db = await get_database()
    
    query = {"job_id": job_id}
    
    total = await db.interviews.count_documents(query)
    
    cursor = (
        db.interviews.find(query)
        .sort("scheduled_time", 1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    interviews = await cursor.to_list(length=page_size)
    
    return interviews, total


async def get_interviews_by_hr(
    hr_id: str,
    page: int = 1,
    page_size: int = 10
) -> tuple[list, int]:
    """
    Get all interviews for jobs managed by an HR user.
    
    This requires aggregation across jobs and interviews.
    """
    db = await get_database()
    
    # Get all job IDs for this HR
    job_cursor = db.jobs.find({"hr_id": hr_id}, {"_id": 1})
    job_ids = [str(job["_id"]) async for job in job_cursor]
    
    if not job_ids:
        return [], 0
    
    query = {"job_id": {"$in": job_ids}}
    
    total = await db.interviews.count_documents(query)
    
    cursor = (
        db.interviews.find(query)
        .sort("scheduled_time", 1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    interviews = await cursor.to_list(length=page_size)
    
    return interviews, total


async def update_interview(
    interview_id: str,
    request: InterviewUpdateRequest
) -> Optional[dict]:
    """Update an interview (reschedule, status change, notes)."""
    db = await get_database()
    
    updates = request.model_dump(exclude_unset=True)
    updates = {k: v.value if hasattr(v, 'value') else v for k, v in updates.items() if v is not None}
    
    if not updates:
        return await get_interview_by_id(interview_id)
    
    updates["updated_at"] = datetime.utcnow()
    
    # Set completed_at if completing
    if updates.get("status") == InterviewStatus.COMPLETED.value:
        updates["completed_at"] = datetime.utcnow()
    
    result = await db.interviews.find_one_and_update(
        {"_id": ObjectId(interview_id)},
        {"$set": updates},
        return_document=True
    )
    
    return result


async def cancel_interview(interview_id: str) -> Optional[dict]:
    """Cancel an interview."""
    return await update_interview(
        interview_id,
        InterviewUpdateRequest(status=InterviewStatus.CANCELLED)
    )


# ============================================
# Phase 2: AI Interview Methods (Stubs)
# ============================================

async def start_ai_interview(interview_id: str) -> dict:
    """
    Start an AI-led interview session.
    
    Phase 2: Will initialize LangGraph state machine and
    prepare interview context from Qdrant.
    """
    raise NotImplementedError(
        "AI interviews will be implemented in Phase 2 using LangGraph"
    )


async def process_candidate_response(
    interview_id: str,
    response: str
) -> dict:
    """
    Process candidate's response during AI interview.
    
    Phase 2: Will update LangGraph state and generate
    next AI question/prompt.
    """
    raise NotImplementedError(
        "AI interview responses will be processed by LangGraph in Phase 2"
    )


async def generate_interview_summary(interview_id: str) -> dict:
    """
    Generate AI summary and feedback after interview completion.
    
    Phase 2: Will use LLM to analyze transcript and
    provide structured feedback.
    """
    raise NotImplementedError(
        "AI feedback generation will be implemented in Phase 2"
    )

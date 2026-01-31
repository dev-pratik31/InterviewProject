"""
Enumerations Module

Centralized enum definitions for consistent status and role values.
Using enums ensures type safety and prevents invalid values.
"""

from enum import Enum


class UserRole(str, Enum):
    """
    User role enumeration.
    
    HR: Recruiter users who can create companies and job postings
    CANDIDATE: Job seekers who can apply and schedule interviews
    """
    HR = "hr"
    CANDIDATE = "candidate"


class JobStatus(str, Enum):
    """
    Job posting status enumeration.
    
    DRAFT: Job is being prepared, not visible to candidates
    PUBLISHED: Job is active and visible to candidates
    CLOSED: Job is no longer accepting applications
    """
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class ApplicationStatus(str, Enum):
    """
    Application status enumeration.
    
    PENDING: Application submitted, awaiting review
    REVIEWING: HR is actively reviewing the application
    INTERVIEW_SCHEDULED: Interview has been scheduled
    REJECTED: Candidate was rejected
    HIRED: Candidate was hired
    """
    PENDING = "pending"
    REVIEWING = "reviewing"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    REJECTED = "rejected"
    HIRED = "hired"


class InterviewStatus(str, Enum):
    """
    Interview status enumeration.
    
    SCHEDULED: Interview is scheduled but not started
    IN_PROGRESS: Interview is currently happening (Phase 2: AI interview)
    COMPLETED: Interview finished successfully
    CANCELLED: Interview was cancelled
    FEEDBACK_PENDING: Interview completed, awaiting feedback (Phase 2)
    """
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FEEDBACK_PENDING = "feedback_pending"


class CompanySize(str, Enum):
    """
    Company size enumeration.
    
    Standardized company size categories for filtering.
    """
    STARTUP = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-1000"
    ENTERPRISE = "1000+"

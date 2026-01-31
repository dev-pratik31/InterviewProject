# Models module exports
from app.models.user import UserModel, UserInDB
from app.models.company import CompanyModel, CompanyInDB
from app.models.job import JobModel, JobInDB
from app.models.application import ApplicationModel, ApplicationInDB
from app.models.interview import InterviewModel, InterviewInDB

__all__ = [
    "UserModel",
    "UserInDB",
    "CompanyModel",
    "CompanyInDB",
    "JobModel",
    "JobInDB",
    "ApplicationModel",
    "ApplicationInDB",
    "InterviewModel",
    "InterviewInDB",
]

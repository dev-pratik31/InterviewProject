# API module exports
from app.api.jd_generator import router as jd_router
from app.api.interview import router as interview_router
from app.api.resume_screener import router as resume_router

__all__ = ["jd_router", "interview_router", "resume_router"]

# API module exports
from app.api.auth import router as auth_router
from app.api.hr import router as hr_router
from app.api.candidate import router as candidate_router
from app.api.ai_proxy import router as ai_router

__all__ = [
    "auth_router",
    "hr_router",
    "candidate_router",
    "ai_router",
]

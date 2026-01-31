"""
Interview Platform API - Main Application Entry

FastAPI application with MongoDB connection management,
CORS configuration, and route registration.

Phase 1: Authentication, Jobs, Applications, Interview Scheduling
Phase 2: AI-powered interviews, LangGraph orchestration, Qdrant vectors
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.mongodb import MongoDB
from app.database.collections import create_indexes
from app.api import auth_router, hr_router, candidate_router, ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events:
    - Startup: Connect to MongoDB, create indexes
    - Shutdown: Close MongoDB connection
    """
    # Startup
    print("🚀 Starting Interview Platform API...")
    await MongoDB.connect()
    await create_indexes()
    print("✓ Application ready")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    await MongoDB.disconnect()
    print("✓ Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## AI-First Hiring & Interview Platform API
    
    Enterprise-grade platform for end-to-end hiring workflow.
    
    ### Features (Phase 1)
    - 🔐 JWT Authentication with role-based access
    - 🏢 Company profile management for HR
    - 📋 Job posting creation and management
    - 📝 Candidate applications
    - 📅 Interview scheduling
    
    ### Coming in Phase 2
    - 🤖 AI-generated job descriptions
    - 🎙️ AI-led technical interviews (LangGraph)
    - 🔍 Semantic search (Qdrant vectors)
    - 📊 AI-powered candidate feedback
    
    ### Roles
    - **HR**: Create companies, post jobs, review applications
    - **Candidate**: Browse jobs, apply, schedule interviews
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(hr_router, prefix=settings.API_V1_PREFIX)
app.include_router(candidate_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "phase": 1,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Detailed health check.
    
    Verifies MongoDB connection is active.
    """
    try:
        db = MongoDB.get_database()
        # Ping database
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "phase": 1,
    }

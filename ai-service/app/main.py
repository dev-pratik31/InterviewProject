"""
AI Service - Main Application

FastAPI entry point for the AI interview service.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import jd_router, interview_router
from app.vectorstore import get_qdrant_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    Startup:
    - Initialize Qdrant collections
    - Seed default questions if empty
    
    Shutdown:
    - Close connections
    """
    # Startup
    print("🚀 Starting AI Interview Service...")
    
    try:
        manager = get_qdrant_manager()
        
        # Check Qdrant health
        is_healthy = await manager.health_check()
        if is_healthy:
            print("✅ Qdrant connection successful")
            await manager.ensure_collections()
        else:
            print("⚠️ Qdrant not available - some features disabled")
            
    except Exception as e:
        print(f"⚠️ Qdrant initialization failed: {e}")
    
    print(f"🎯 AI Service ready on port {settings.ai_service_port}")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down AI Service...")
    try:
        manager = get_qdrant_manager()
        await manager.close()
    except Exception:
        pass


# Create FastAPI app
app = FastAPI(
    title="AI Interview Service",
    description="""
    AI-powered interview engine for enterprise hiring.
    
    ## Features
    
    - **Job Description Generation**: AI-generated JDs with structured output
    - **AI Interview Engine**: LangGraph-based adaptive interviews
    - **Confidence Evaluation**: Linguistic analysis of responses
    - **Vector Search**: Semantic question and context retrieval
    
    ## Architecture
    
    - LangGraph for interview state machine
    - Qdrant for vector storage
    - OpenAI/Anthropic for LLM
    """,
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(jd_router)
app.include_router(interview_router)


@app.get("/")
async def root():
    """Service health check."""
    return {
        "service": "AI Interview Service",
        "version": "2.0.0",
        "status": "healthy",
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    manager = get_qdrant_manager()
    qdrant_ok = await manager.health_check()
    
    return {
        "status": "healthy" if qdrant_ok else "degraded",
        "components": {
            "qdrant": "ok" if qdrant_ok else "unavailable",
            "llm": "configured" if settings.openai_api_key else "not_configured",
        },
    }

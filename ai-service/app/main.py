"""
AI Service - Main Application

FastAPI entry point for the AI interview service.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api import jd_router, interview_router, resume_router
from app.vectorstore import get_qdrant_manager


# Ensure audio output directory exists
AUDIO_DIR = Path("./audio_output")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


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
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(jd_router)
app.include_router(interview_router)
app.include_router(resume_router)

# Mount static files for audio serving
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")


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


@app.get("/tts/test")
async def test_tts(text: str = "Hello, I am Aria, your AI interviewer."):
    """Test TTS synthesis."""
    try:
        from app.tts import generate_speech

        print(f"Testing TTS with text: {text}")
        result = await generate_speech(text, session_id="test")
        print(f"TTS result: {result}")

        return {"tts_available": True, **result}
    except Exception as e:
        import traceback

        traceback.print_exc()
        return {
            "tts_available": False,
            "error": str(e),
        }

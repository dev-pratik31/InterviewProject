"""
AI Service Configuration

Centralized settings using Pydantic for type validation.
"""

from typing import Literal, Optional
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """AI Service configuration settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # LLM Provider
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    llm_provider: Literal["openai", "anthropic"] = "openai"
    llm_model: str = "gpt-4-turbo-preview"
    
    # Embeddings
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    
    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017/interview_platform"
    
    # Service
    ai_service_port: int = 8001
    debug: bool = False
    
    # Evaluation Thresholds
    confidence_threshold_advance: float = 0.6
    confidence_threshold_simplify: float = 0.4
    technical_threshold_deep_dive: float = 0.7
    clarity_threshold_advance: float = 0.6
    
    # Interview Limits
    max_questions_per_stage: int = 5
    max_total_questions: int = 15
    max_interview_duration_minutes: int = 60
    
    # Qdrant Collections
    collection_job_embeddings: str = "job_embeddings"
    collection_interview_questions: str = "interview_questions"
    collection_candidate_responses: str = "candidate_responses"
    
    @property
    def api_key(self) -> str:
        """Get the API key for the configured provider."""
        if self.llm_provider == "openai":
            if not self.openai_api_key:
                raise ValueError("OPENAI_API_KEY not configured")
            return self.openai_api_key
        else:
            if not self.anthropic_api_key:
                raise ValueError("ANTHROPIC_API_KEY not configured")
            return self.anthropic_api_key


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Export singleton
settings = get_settings()

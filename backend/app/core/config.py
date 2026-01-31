"""
Application Configuration Module

Centralized configuration management using Pydantic Settings.
All configuration is loaded from environment variables for security.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    For Phase 2 AI integration, additional settings will be added:
    - OPENAI_API_KEY: For LLM access
    - QDRANT_URL: Vector database connection
    - QDRANT_API_KEY: Vector database authentication
    """
    
    # Application
    APP_NAME: str = "Interview Platform API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # MongoDB Configuration
    MONGODB_URL: str
    DATABASE_NAME: str = "interview_platform"
    
    # JWT Authentication
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Origins (comma-separated in env)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # Phase 2: AI Service Configuration (placeholders)
    # OPENAI_API_KEY: str = ""
    # QDRANT_URL: str = "http://localhost:6333"
    # QDRANT_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.
    
    Using lru_cache ensures we only read environment variables once
    and reuse the same Settings instance throughout the application.
    """
    return Settings()


# Export singleton for convenience
settings = get_settings()

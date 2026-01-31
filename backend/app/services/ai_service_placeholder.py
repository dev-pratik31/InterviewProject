"""
AI Service Client

HTTP client for communicating with the AI service.
"""

import httpx
from typing import Optional, List

from app.core.config import settings


AI_SERVICE_URL = "http://localhost:8001"


class AIServiceClient:
    """Client for AI service API calls."""
    
    def __init__(self):
        self.base_url = AI_SERVICE_URL
        self.timeout = httpx.Timeout(60.0)  # AI calls can be slow
    
    async def generate_job_description(
        self,
        job_title: str,
        experience_required: int,
        industry: str = "Technology",
        tech_stack: Optional[List[str]] = None,
        company_name: Optional[str] = None,
    ) -> dict:
        """Generate AI job description."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/ai/generate-jd",
                json={
                    "job_title": job_title,
                    "experience_required": experience_required,
                    "industry": industry,
                    "tech_stack": tech_stack,
                    "company_name": company_name,
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def start_interview(
        self,
        job_id: str,
        candidate_id: str,
        candidate_name: Optional[str] = None,
    ) -> dict:
        """Start AI interview session."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/ai/interview/start",
                json={
                    "job_id": job_id,
                    "candidate_id": candidate_id,
                    "candidate_name": candidate_name,
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def submit_response(
        self,
        interview_id: str,
        response_text: str,
    ) -> dict:
        """Submit candidate response."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/ai/interview/respond",
                json={
                    "interview_id": interview_id,
                    "response": response_text,
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_interview_state(self, interview_id: str) -> dict:
        """Get current interview state."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/ai/interview/{interview_id}/state"
            )
            response.raise_for_status()
            return response.json()
    
    async def complete_interview(self, interview_id: str) -> dict:
        """Complete interview and get feedback."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/ai/interview/{interview_id}/complete"
            )
            response.raise_for_status()
            return response.json()
    
    async def health_check(self) -> bool:
        """Check if AI service is available."""
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False


# Singleton
_ai_client: Optional[AIServiceClient] = None


def get_ai_client() -> AIServiceClient:
    """Get AI service client singleton."""
    global _ai_client
    if _ai_client is None:
        _ai_client = AIServiceClient()
    return _ai_client

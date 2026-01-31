"""
Job Description Generator API

Endpoint for AI-generated job descriptions.
"""

from typing import Optional, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.llm import get_provider
from app.vectorstore import store_job_embedding
from app.utils.prompts import JD_GENERATION_PROMPT


router = APIRouter(prefix="/ai", tags=["AI Services"])


class JDGenerationRequest(BaseModel):
    """Request for job description generation."""
    job_title: str = Field(..., min_length=3, max_length=200)
    experience_required: int = Field(..., ge=0, le=30)
    industry: str = Field(default="Technology")
    tech_stack: Optional[List[str]] = None
    company_name: Optional[str] = None
    team_size: Optional[str] = None
    additional_context: Optional[str] = None


class JDGenerationResponse(BaseModel):
    """Generated job description."""
    overview: str
    responsibilities: List[str]
    requirements: List[str]
    nice_to_have: List[str]
    
    # Metadata
    generated_embedding_id: Optional[str] = None


class StructuredJD(BaseModel):
    """Schema for LLM structured output."""
    overview: str
    responsibilities: List[str]
    requirements: List[str]
    nice_to_have: List[str]


@router.post(
    "/generate-jd",
    response_model=JDGenerationResponse,
    summary="Generate AI job description",
    description="Generate a compelling job description using AI.",
)
async def generate_job_description(request: JDGenerationRequest):
    """
    Generate an AI-powered job description.
    
    Process:
    1. Generate JD using LLM with structured output
    2. Store embedding in Qdrant for semantic search
    3. Return structured JD
    """
    provider = get_provider()
    
    # Build context for generation
    tech_context = ""
    if request.tech_stack:
        tech_context = f"\nTechnical stack: {', '.join(request.tech_stack)}"
    
    additional = ""
    if request.additional_context:
        additional = f"\nAdditional context: {request.additional_context}"
    
    messages = [
        {"role": "system", "content": JD_GENERATION_PROMPT},
        {"role": "user", "content": f"""
Generate a job description for:

Job Title: {request.job_title}
Experience Required: {request.experience_required}+ years
Industry: {request.industry}
{f"Company: {request.company_name}" if request.company_name else ""}
{f"Team Size: {request.team_size}" if request.team_size else ""}
{tech_context}
{additional}

Create a compelling, accurate job description that will attract top talent.
Output valid JSON with keys: overview, responsibilities, requirements, nice_to_have
"""}
    ]
    
    try:
        # Generate structured JD
        jd = await provider.generate_structured(
            messages=messages,
            response_model=StructuredJD,
            temperature=0.7,
        )
        
        # Store embedding for future retrieval
        embedding_id = None
        try:
            # Create combined text for embedding
            combined_text = f"""
{jd.overview}

Responsibilities:
{chr(10).join(jd.responsibilities)}

Requirements:
{chr(10).join(jd.requirements)}
"""
            embedding_id = await store_job_embedding(
                job_id=f"generated_{request.job_title.lower().replace(' ', '_')}",
                title=request.job_title,
                description=combined_text,
                skills=request.tech_stack or [],
                experience_required=request.experience_required,
                company_name=request.company_name or "Company",
                industry=request.industry,
            )
        except Exception as e:
            # Non-fatal: embedding storage failed
            print(f"Warning: Could not store embedding: {e}")
        
        return JDGenerationResponse(
            overview=jd.overview,
            responsibilities=jd.responsibilities,
            requirements=jd.requirements,
            nice_to_have=jd.nice_to_have,
            generated_embedding_id=embedding_id,
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"JD generation failed: {str(e)}"
        )

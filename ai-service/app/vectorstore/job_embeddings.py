"""
Job Embeddings Store

Vector storage for job descriptions.
Enables semantic search and context retrieval.
"""

from typing import Optional, List
from uuid import uuid4

from qdrant_client.http import models as rest

from app.vectorstore.qdrant_client import get_qdrant_client
from app.llm import get_embedding_service
from app.config import settings


async def store_job_embedding(
    job_id: str,
    title: str,
    description: str,
    skills: List[str],
    experience_required: int,
    company_name: str,
    industry: Optional[str] = None,
) -> str:
    """
    Store job description embedding in Qdrant.
    
    Args:
        job_id: Unique job identifier
        title: Job title
        description: Full job description
        skills: Required skills list
        experience_required: Years of experience
        company_name: Company name
        industry: Optional industry classification
        
    Returns:
        Point ID in Qdrant
    """
    client = await get_qdrant_client()
    embedding_service = get_embedding_service()
    
    # Create text for embedding
    embed_text = f"""
Job Title: {title}
Company: {company_name}
Industry: {industry or 'Technology'}
Required Experience: {experience_required}+ years
Required Skills: {', '.join(skills)}

Description:
{description}
"""
    
    # Generate embedding
    embedding = await embedding_service.embed(embed_text)
    
    # Store in Qdrant
    point_id = str(uuid4())
    
    await client.upsert(
        collection_name=settings.collection_job_embeddings,
        points=[
            rest.PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "job_id": job_id,
                    "title": title,
                    "company_name": company_name,
                    "skills": skills,
                    "experience_required": experience_required,
                    "industry": industry,
                    "description_preview": description[:500],
                },
            )
        ],
    )
    
    return point_id


async def search_similar_jobs(
    query: str,
    limit: int = 5,
    skills_filter: Optional[List[str]] = None,
) -> List[dict]:
    """
    Search for similar jobs by text query.
    
    Args:
        query: Search query text
        limit: Maximum results
        skills_filter: Optional skills to filter by
        
    Returns:
        List of matching job payloads with scores
    """
    client = await get_qdrant_client()
    embedding_service = get_embedding_service()
    
    # Generate query embedding
    query_embedding = await embedding_service.embed(query)
    
    # Build filter if skills provided
    filter_conditions = None
    if skills_filter:
        filter_conditions = rest.Filter(
            should=[
                rest.FieldCondition(
                    key="skills",
                    match=rest.MatchAny(any=skills_filter),
                )
            ]
        )
    
    # Search
    results = await client.search(
        collection_name=settings.collection_job_embeddings,
        query_vector=query_embedding,
        limit=limit,
        query_filter=filter_conditions,
    )
    
    return [
        {
            "id": r.id,
            "score": r.score,
            **r.payload,
        }
        for r in results
    ]


async def get_job_context(job_id: str) -> Optional[dict]:
    """
    Retrieve job context by job ID.
    
    Args:
        job_id: Job identifier
        
    Returns:
        Job context dict or None
    """
    client = await get_qdrant_client()
    
    # Search by job_id in payload
    results = await client.scroll(
        collection_name=settings.collection_job_embeddings,
        scroll_filter=rest.Filter(
            must=[
                rest.FieldCondition(
                    key="job_id",
                    match=rest.MatchValue(value=job_id),
                )
            ]
        ),
        limit=1,
    )
    
    points, _ = results
    if points:
        payload = points[0].payload
        return {
            "job_id": payload.get("job_id"),
            "title": payload.get("title"),
            "company_name": payload.get("company_name"),
            "skills_required": payload.get("skills", []),
            "experience_required": payload.get("experience_required", 0),
            "description": payload.get("description_preview", ""),
        }
    
    return None


async def delete_job_embedding(job_id: str) -> bool:
    """Delete job embedding by job ID."""
    client = await get_qdrant_client()
    
    await client.delete(
        collection_name=settings.collection_job_embeddings,
        points_selector=rest.FilterSelector(
            filter=rest.Filter(
                must=[
                    rest.FieldCondition(
                        key="job_id",
                        match=rest.MatchValue(value=job_id),
                    )
                ]
            )
        ),
    )
    
    return True

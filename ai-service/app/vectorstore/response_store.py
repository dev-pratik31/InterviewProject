"""
Candidate Response Store

Vector storage for candidate responses.
Enables comparison with high-quality answers.
"""

from typing import Optional, List
from uuid import uuid4

from qdrant_client.http import models as rest

from app.vectorstore.qdrant_client import get_qdrant_client
from app.llm import get_embedding_service
from app.config import settings


async def store_response(
    interview_id: str,
    question_id: str,
    response_text: str,
    confidence_score: float,
    technical_score: float,
    is_high_quality: bool,
) -> str:
    """
    Store a candidate response embedding.
    
    Args:
        interview_id: Interview session ID
        question_id: Question that was asked
        response_text: Candidate's response
        confidence_score: Evaluated confidence
        technical_score: Evaluated technical accuracy
        is_high_quality: Whether this is a good example answer
        
    Returns:
        Point ID
    """
    client = await get_qdrant_client()
    embedding_service = get_embedding_service()
    
    embedding = await embedding_service.embed(response_text)
    
    point_id = str(uuid4())
    
    await client.upsert(
        collection_name=settings.collection_candidate_responses,
        points=[
            rest.PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "response_id": point_id,
                    "interview_id": interview_id,
                    "question_id": question_id,
                    "response_preview": response_text[:500],
                    "confidence_score": confidence_score,
                    "technical_score": technical_score,
                    "is_high_quality": is_high_quality,
                },
            )
        ],
    )
    
    return point_id


async def find_similar_responses(
    question_id: str,
    limit: int = 3,
    high_quality_only: bool = True,
) -> List[dict]:
    """
    Find similar high-quality responses for comparison.
    
    Used to understand what good answers look like.
    
    Args:
        question_id: Question to find similar responses for
        limit: Maximum responses
        high_quality_only: Only return high-quality examples
        
    Returns:
        List of response dicts
    """
    client = await get_qdrant_client()
    
    filter_conditions = [
        rest.FieldCondition(
            key="question_id",
            match=rest.MatchValue(value=question_id),
        ),
    ]
    
    if high_quality_only:
        filter_conditions.append(
            rest.FieldCondition(
                key="is_high_quality",
                match=rest.MatchValue(value=True),
            )
        )
    
    results = await client.scroll(
        collection_name=settings.collection_candidate_responses,
        scroll_filter=rest.Filter(must=filter_conditions),
        limit=limit,
        order_by=rest.OrderBy(
            key="technical_score",
            direction=rest.Direction.DESC,
        ),
    )
    
    points, _ = results
    return [
        {
            "response": p.payload.get("response_preview"),
            "confidence": p.payload.get("confidence_score"),
            "technical": p.payload.get("technical_score"),
        }
        for p in points
    ]


async def get_interview_responses(interview_id: str) -> List[dict]:
    """
    Get all responses from an interview.
    
    Args:
        interview_id: Interview session ID
        
    Returns:
        List of responses with scores
    """
    client = await get_qdrant_client()
    
    results = await client.scroll(
        collection_name=settings.collection_candidate_responses,
        scroll_filter=rest.Filter(
            must=[
                rest.FieldCondition(
                    key="interview_id",
                    match=rest.MatchValue(value=interview_id),
                )
            ]
        ),
        limit=100,
    )
    
    points, _ = results
    return [
        {
            "question_id": p.payload.get("question_id"),
            "response": p.payload.get("response_preview"),
            "confidence": p.payload.get("confidence_score"),
            "technical": p.payload.get("technical_score"),
        }
        for p in points
    ]


async def calculate_semantic_similarity(
    response: str,
    reference_responses: List[str],
) -> float:
    """
    Calculate semantic similarity between response and references.
    
    Returns average cosine similarity to reference good answers.
    """
    if not reference_responses:
        return 0.5
    
    embedding_service = get_embedding_service()
    
    # Embed response and references
    all_texts = [response] + reference_responses
    embeddings = await embedding_service.embed_batch(all_texts)
    
    response_embedding = embeddings[0]
    reference_embeddings = embeddings[1:]
    
    # Calculate cosine similarities
    import numpy as np
    
    response_vec = np.array(response_embedding)
    similarities = []
    
    for ref_vec in reference_embeddings:
        ref_vec = np.array(ref_vec)
        similarity = np.dot(response_vec, ref_vec) / (
            np.linalg.norm(response_vec) * np.linalg.norm(ref_vec)
        )
        similarities.append(similarity)
    
    return float(np.mean(similarities))

"""
Qdrant Client

Connection management and utilities for Qdrant vector store.
"""

from typing import Optional, List
from contextlib import asynccontextmanager

from qdrant_client import QdrantClient, AsyncQdrantClient
from qdrant_client.http import models as rest

from app.config import settings


class QdrantManager:
    """Manages Qdrant connections and collection setup."""
    
    def __init__(self):
        self._client: Optional[AsyncQdrantClient] = None
        self._sync_client: Optional[QdrantClient] = None
    
    async def get_client(self) -> AsyncQdrantClient:
        """Get or create async Qdrant client."""
        if self._client is None:
            if settings.qdrant_api_key:
                self._client = AsyncQdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key,
                )
            else:
                self._client = AsyncQdrantClient(url=settings.qdrant_url)
        return self._client
    
    def get_sync_client(self) -> QdrantClient:
        """Get or create sync Qdrant client for setup operations."""
        if self._sync_client is None:
            if settings.qdrant_api_key:
                self._sync_client = QdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key,
                )
            else:
                self._sync_client = QdrantClient(url=settings.qdrant_url)
        return self._sync_client
    
    async def close(self):
        """Close connections."""
        if self._client:
            await self._client.close()
            self._client = None
    
    async def ensure_collections(self):
        """
        Ensure all required collections exist.
        Creates them if they don't exist.
        """
        client = await self.get_client()
        
        collections = [
            {
                "name": settings.collection_job_embeddings,
                "description": "Job description embeddings for context retrieval",
            },
            {
                "name": settings.collection_interview_questions,
                "description": "Interview question bank with embeddings",
            },
            {
                "name": settings.collection_candidate_responses,
                "description": "Candidate response embeddings for quality matching",
            },
        ]
        
        existing = await client.get_collections()
        existing_names = {c.name for c in existing.collections}
        
        for coll in collections:
            if coll["name"] not in existing_names:
                await client.create_collection(
                    collection_name=coll["name"],
                    vectors_config=rest.VectorParams(
                        size=settings.embedding_dimensions,
                        distance=rest.Distance.COSINE,
                    ),
                )
                print(f"Created collection: {coll['name']}")
    
    async def health_check(self) -> bool:
        """Check if Qdrant is reachable."""
        try:
            client = await self.get_client()
            await client.get_collections()
            return True
        except Exception:
            return False


# Singleton instance
_qdrant_manager: Optional[QdrantManager] = None


def get_qdrant_manager() -> QdrantManager:
    """Get or create Qdrant manager singleton."""
    global _qdrant_manager
    if _qdrant_manager is None:
        _qdrant_manager = QdrantManager()
    return _qdrant_manager


async def get_qdrant_client() -> AsyncQdrantClient:
    """Convenience function to get Qdrant client."""
    manager = get_qdrant_manager()
    return await manager.get_client()

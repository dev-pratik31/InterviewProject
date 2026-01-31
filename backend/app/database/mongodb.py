"""
MongoDB Connection Module

Provides async MongoDB connection using Motor driver.
Implements connection pooling and lazy initialization.
"""

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings


class MongoDB:
    """
    MongoDB connection manager.
    
    Implements singleton pattern for connection reuse.
    Connection is lazily initialized on first use.
    """
    
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None
    
    @classmethod
    async def connect(cls) -> None:
        """
        Initialize MongoDB connection.
        
        Should be called during application startup.
        Uses connection pooling with sensible defaults.
        """
        if cls.client is None:
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                maxPoolSize=50,
                minPoolSize=10,
                serverSelectionTimeoutMS=5000,
            )
            cls.database = cls.client[settings.DATABASE_NAME]
            
            # Verify connection
            await cls.client.admin.command('ping')
            print(f"✓ Connected to MongoDB: {settings.DATABASE_NAME}")
    
    @classmethod
    async def disconnect(cls) -> None:
        """
        Close MongoDB connection.
        
        Should be called during application shutdown.
        """
        if cls.client is not None:
            cls.client.close()
            cls.client = None
            cls.database = None
            print("✓ Disconnected from MongoDB")
    
    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase:
        """
        Get the database instance.
        
        Returns:
            AsyncIOMotorDatabase instance
            
        Raises:
            RuntimeError: If database is not connected
        """
        if cls.database is None:
            raise RuntimeError(
                "Database not connected. Call MongoDB.connect() first."
            )
        return cls.database


async def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency function to get database instance.
    
    Returns:
        AsyncIOMotorDatabase: The connected database
    """
    return MongoDB.get_database()

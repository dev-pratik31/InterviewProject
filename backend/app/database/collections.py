"""
Database Collections Module

Provides typed collection accessors and index definitions.
Centralizes all MongoDB collection access for maintainability.
"""

from motor.motor_asyncio import AsyncIOMotorCollection

from app.database.mongodb import MongoDB


class Collections:
    """
    Collection accessor class.
    
    Provides typed access to MongoDB collections.
    All collection names are centralized here.
    """
    
    @staticmethod
    def users() -> AsyncIOMotorCollection:
        """
        Users collection.
        
        Stores both HR and Candidate users with role differentiation.
        """
        return MongoDB.get_database().users
    
    @staticmethod
    def companies() -> AsyncIOMotorCollection:
        """
        Companies collection.
        
        Stores company profiles created by HR users.
        """
        return MongoDB.get_database().companies
    
    @staticmethod
    def jobs() -> AsyncIOMotorCollection:
        """
        Jobs collection.
        
        Stores job postings with references to companies.
        
        Phase 2: Will include vector embeddings of job descriptions
        stored in Qdrant for semantic search.
        """
        return MongoDB.get_database().jobs
    
    @staticmethod
    def applications() -> AsyncIOMotorCollection:
        """
        Applications collection.
        
        Stores candidate applications for jobs.
        Links candidates to jobs with application metadata.
        """
        return MongoDB.get_database().applications
    
    @staticmethod
    def interviews() -> AsyncIOMotorCollection:
        """
        Interviews collection.
        
        Stores interview scheduling and status.
        
        Phase 2: Will store interview transcripts and AI feedback.
        Transcripts will be embedded in Qdrant for context retrieval.
        """
        return MongoDB.get_database().interviews


async def create_indexes() -> None:
    """
    Create database indexes for optimal query performance.
    
    Should be called during application startup after connection.
    Indexes are created idempotently (no error if already exists).
    """
    db = MongoDB.get_database()
    
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("role")
    
    # Companies collection indexes
    await db.companies.create_index("hr_id")
    await db.companies.create_index("name")
    
    # Jobs collection indexes
    await db.jobs.create_index("company_id")
    await db.jobs.create_index("status")
    await db.jobs.create_index([("title", "text"), ("description", "text")])
    
    # Applications collection indexes
    await db.applications.create_index("candidate_id")
    await db.applications.create_index("job_id")
    await db.applications.create_index([("candidate_id", 1), ("job_id", 1)], unique=True)
    
    # Interviews collection indexes
    await db.interviews.create_index("application_id")
    await db.interviews.create_index("scheduled_time")
    await db.interviews.create_index("status")
    
    print("✓ Database indexes created")

"""
Authentication Service

Business logic for user authentication and registration.
Separates concerns from API routes for testability.
"""

from datetime import timedelta
from typing import Optional

from bson import ObjectId

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.database.mongodb import get_database
from app.schemas.auth import UserRegisterRequest, UserResponse
from app.utils.enums import UserRole


async def register_user(request: UserRegisterRequest) -> dict:
    """
    Register a new user.
    
    Args:
        request: Registration request data
        
    Returns:
        Created user document
        
    Raises:
        ValueError: If email already exists
    """
    db = await get_database()
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise ValueError("Email already registered")
    
    # Create user document
    user_doc = {
        "email": request.email,
        "hashed_password": hash_password(request.password),
        "role": request.role.value,
        "full_name": request.full_name,
        "phone": request.phone,
        "skills": request.skills if request.role == UserRole.CANDIDATE else [],
        "experience_years": request.experience_years if request.role == UserRole.CANDIDATE else None,
        "resume_url": None,
        "company_id": None,
        "is_active": True,
    }
    
    # Insert into database
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    return user_doc


async def authenticate_user(email: str, password: str) -> Optional[dict]:
    """
    Authenticate a user by email and password.
    
    Args:
        email: User email
        password: Plain text password
        
    Returns:
        User document if authenticated, None otherwise
    """
    db = await get_database()
    
    user = await db.users.find_one({"email": email})
    if not user:
        return None
    
    if not verify_password(password, user["hashed_password"]):
        return None
    
    if not user.get("is_active", True):
        return None
    
    return user


def create_user_token(user_id: str) -> str:
    """
    Create JWT token for a user.
    
    Args:
        user_id: User's ObjectId as string
        
    Returns:
        JWT token string
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    return create_access_token(
        data={"sub": user_id},
        expires_delta=access_token_expires
    )


def format_user_response(user: dict) -> UserResponse:
    """
    Format user document for API response.
    
    Args:
        user: User document from database
        
    Returns:
        UserResponse schema
    """
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        phone=user.get("phone"),
        resume_url=user.get("resume_url"),
        skills=user.get("skills", []),
        experience_years=user.get("experience_years"),
        company_id=str(user["company_id"]) if user.get("company_id") else None,
        is_active=user.get("is_active", True),
    )


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """
    Fetch user by ID.
    
    Args:
        user_id: User's ObjectId as string
        
    Returns:
        User document if found, None otherwise
    """
    db = await get_database()
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user
    except Exception:
        return None


async def update_user_profile(user_id: str, updates: dict) -> Optional[dict]:
    """
    Update user profile.
    
    Args:
        user_id: User's ObjectId as string
        updates: Fields to update
        
    Returns:
        Updated user document
    """
    db = await get_database()
    
    # Remove None values
    updates = {k: v for k, v in updates.items() if v is not None}
    
    if not updates:
        return await get_user_by_id(user_id)
    
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": updates},
        return_document=True
    )
    
    return result

"""
FastAPI Dependencies Module

Provides reusable dependency injection functions for:
- Database session access
- Current user authentication
- Role-based authorization
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.database.mongodb import get_database
from app.utils.enums import UserRole


# OAuth2 scheme for token extraction from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)]
) -> dict:
    """
    Dependency to extract and validate current user from JWT token.
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        User document from database
        
    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Fetch user from database
    db = await get_database()
    from bson import ObjectId
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    
    # Convert ObjectId to string for easier handling
    user["_id"] = str(user["_id"])
    
    return user


async def get_current_hr_user(
    current_user: Annotated[dict, Depends(get_current_user)]
) -> dict:
    """
    Dependency to ensure current user has HR role.
    
    Args:
        current_user: User dict from get_current_user dependency
        
    Returns:
        User document if HR role
        
    Raises:
        HTTPException: 403 if user is not HR
    """
    if current_user.get("role") != UserRole.HR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR access required"
        )
    return current_user


async def get_current_candidate_user(
    current_user: Annotated[dict, Depends(get_current_user)]
) -> dict:
    """
    Dependency to ensure current user has Candidate role.
    
    Args:
        current_user: User dict from get_current_user dependency
        
    Returns:
        User document if Candidate role
        
    Raises:
        HTTPException: 403 if user is not a Candidate
    """
    if current_user.get("role") != UserRole.CANDIDATE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required"
        )
    return current_user


# Type aliases for cleaner endpoint signatures
CurrentUser = Annotated[dict, Depends(get_current_user)]
CurrentHRUser = Annotated[dict, Depends(get_current_hr_user)]
CurrentCandidateUser = Annotated[dict, Depends(get_current_candidate_user)]

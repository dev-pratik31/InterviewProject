"""
Authentication Schemas

Request and response schemas for authentication endpoints.
Separates API contracts from internal models for flexibility.
"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.utils.enums import UserRole


# ============================================
# Request Schemas
# ============================================

class UserRegisterRequest(BaseModel):
    """
    User registration request schema.
    
    Used for both HR and Candidate registration.
    """
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=100,
        description="Password (min 8 characters)"
    )
    full_name: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="Full name"
    )
    role: UserRole = Field(..., description="User role: hr or candidate")
    phone: Optional[str] = Field(None, max_length=20)
    
    # Candidate-specific optional fields
    skills: list[str] = Field(default_factory=list)
    experience_years: Optional[int] = Field(None, ge=0, le=50)


class UserLoginRequest(BaseModel):
    """
    User login request schema.
    """
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class PasswordChangeRequest(BaseModel):
    """
    Password change request schema.
    """
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(
        ..., 
        min_length=8, 
        max_length=100,
        description="New password (min 8 characters)"
    )


# ============================================
# Response Schemas
# ============================================

class TokenResponse(BaseModel):
    """
    JWT token response schema.
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer")


class UserResponse(BaseModel):
    """
    User profile response schema.
    
    Excludes sensitive fields like password.
    """
    id: str = Field(..., description="User ID")
    email: EmailStr
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    
    # Candidate fields
    resume_url: Optional[str] = None
    skills: list[str] = []
    experience_years: Optional[int] = None
    
    # HR fields
    company_id: Optional[str] = None
    
    # Metadata
    is_active: bool = True


class AuthResponse(BaseModel):
    """
    Combined auth response with token and user data.
    """
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

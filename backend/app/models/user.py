"""
User Model

Defines the User document structure for MongoDB.
Both HR and Candidate users share this model with role differentiation.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.utils.enums import UserRole


class UserModel(BaseModel):
    """
    User document model.
    
    Stores authentication credentials and profile information.
    Role field differentiates between HR and Candidate users.
    """
    
    email: EmailStr = Field(..., description="User email address (unique)")
    hashed_password: str = Field(..., description="Bcrypt hashed password")
    role: UserRole = Field(..., description="User role (hr or candidate)")
    
    # Profile information
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    
    # Candidate-specific fields
    resume_url: Optional[str] = Field(None, description="Resume file URL")
    skills: list[str] = Field(default_factory=list, description="Candidate skills")
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    
    # HR-specific fields
    company_id: Optional[str] = Field(None, description="Associated company ObjectId")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserInDB(UserModel):
    """
    User model with database ID.
    
    Used when retrieving users from database.
    """
    id: str = Field(..., alias="_id", description="MongoDB ObjectId as string")
    
    class Config:
        populate_by_name = True

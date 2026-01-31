"""
Company Model

Defines the Company document structure for MongoDB.
Companies are created and managed by HR users.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl

from app.utils.enums import CompanySize


class CompanyModel(BaseModel):
    """
    Company document model.
    
    Stores company profile information created by HR users.
    One HR user can manage one company.
    """
    
    # Basic information
    name: str = Field(..., min_length=2, max_length=200, description="Company name")
    industry: str = Field(..., min_length=2, max_length=100, description="Industry sector")
    size: CompanySize = Field(..., description="Company size category")
    
    # Optional details
    description: Optional[str] = Field(None, max_length=2000, description="Company description")
    website: Optional[str] = Field(None, description="Company website URL")
    logo_url: Optional[str] = Field(None, description="Company logo URL")
    location: Optional[str] = Field(None, max_length=200, description="Headquarters location")
    
    # Owner reference
    hr_id: str = Field(..., description="HR user ObjectId who owns this company")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class CompanyInDB(CompanyModel):
    """
    Company model with database ID.
    """
    id: str = Field(..., alias="_id", description="MongoDB ObjectId as string")
    
    class Config:
        populate_by_name = True

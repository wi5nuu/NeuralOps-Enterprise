from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class OrganizationResponse(BaseModel):
    id: str
    name: str
    plan: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime
    organization: OrganizationResponse

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_image_url: Optional[str] = None
    is_active: Optional[bool] = None

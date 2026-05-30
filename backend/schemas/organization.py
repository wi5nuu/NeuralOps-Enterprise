from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OrganizationResponse(BaseModel):
    id: str
    name: str
    plan: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationUpdateRequest(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    is_active: Optional[bool] = None

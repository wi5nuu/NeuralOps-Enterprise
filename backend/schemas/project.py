from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[str] = None


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None

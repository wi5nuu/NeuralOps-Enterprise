from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ModelRegistryResponse(BaseModel):
    id: str
    name: str
    provider: str
    model_id: str
    version: str
    parameters: Optional[dict] = None
    use_case: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ModelRegistryCreateRequest(BaseModel):
    name: str
    provider: str
    model_id: str
    version: str = "1.0.0"
    parameters: Optional[dict] = None
    use_case: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    project_id: Optional[str] = None


class ModelRegistryUpdateRequest(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    parameters: Optional[dict] = None
    use_case: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None

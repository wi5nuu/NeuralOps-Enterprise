from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PromptTemplateResponse(BaseModel):
    id: str
    name: str
    content: str
    description: Optional[str] = None
    model_id: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    tags: Optional[str] = None
    version: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PromptTemplateCreateRequest(BaseModel):
    name: str
    content: str
    description: Optional[str] = None
    model_id: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    tags: Optional[str] = None


class PromptTemplateUpdateRequest(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    model_id: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    tags: Optional[str] = None
    is_active: Optional[bool] = None

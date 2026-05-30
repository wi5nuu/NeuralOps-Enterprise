from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TaskResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    assignee_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    tags: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class TaskCreateRequest(BaseModel):
    project_id: Optional[str] = None
    assignee_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    tags: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None


class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignee_id: Optional[str] = None
    tags: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    sort_order: Optional[int] = None


class TaskBatchUpdateRequest(BaseModel):
    task_ids: list[str]
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None

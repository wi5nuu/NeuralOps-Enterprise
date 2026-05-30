from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCreateRequest(BaseModel):
    title: str
    message: str
    notification_type: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None

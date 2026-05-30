from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    tokens: Optional[int] = None
    latency_ms: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    title: str
    model_id: str
    messages: List[MessageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationCreateRequest(BaseModel):
    title: str = "New Conversation"
    model_id: str = "claude-3-opus-20240229"
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    prompt_template_id: Optional[str] = None


class SendMessageRequest(BaseModel):
    content: str
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class MessageStreamResponse(BaseModel):
    id: str
    type: str  # chunk | done | error
    content: Optional[str] = None
    tokens: Optional[int] = None
    latency_ms: Optional[float] = None

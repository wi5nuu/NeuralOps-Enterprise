from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ServiceLogResponse(BaseModel):
    id: str
    service_id: str
    endpoint: Optional[str] = None
    latency_ms: Optional[float] = None
    status_code: Optional[int] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    error_message: Optional[str] = None
    is_error: bool
    timestamp: datetime

    class Config:
        from_attributes = True


class AIServiceResponse(BaseModel):
    id: str
    name: str
    service_type: str
    environment: str
    cloud: str
    endpoint_url: Optional[str] = None
    description: Optional[str] = None
    sla_target_ms: Optional[int] = None
    is_active: bool
    is_healthy: bool
    avg_latency_ms: float
    error_rate: float
    health_score: float
    uptime: float
    logs: List[ServiceLogResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class AIServiceCreateRequest(BaseModel):
    name: str
    service_type: str = "llm"
    environment: str = "development"
    cloud: str = "azure"
    project_id: Optional[str] = None
    endpoint_url: Optional[str] = None
    description: Optional[str] = None
    sla_target_ms: Optional[int] = None


class AIServiceUpdateRequest(BaseModel):
    name: Optional[str] = None
    endpoint_url: Optional[str] = None
    description: Optional[str] = None
    sla_target_ms: Optional[int] = None
    is_active: Optional[bool] = None

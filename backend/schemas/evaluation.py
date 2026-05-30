from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class EvaluationResponse(BaseModel):
    id: str
    eval_name: str
    eval_type: str
    model_output: str
    context: Optional[str] = None
    ground_truth: Optional[str] = None
    score: Optional[float] = None
    passed: Optional[bool] = None
    threshold: float
    issues: Optional[dict] = None
    explanation: Optional[str] = None
    suggestions: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EvaluationCreateRequest(BaseModel):
    eval_name: str
    eval_type: str = "relevance"
    model_output: str
    context: Optional[str] = None
    ground_truth: Optional[str] = None
    custom_criteria: Optional[str] = None
    threshold: float = 70.0

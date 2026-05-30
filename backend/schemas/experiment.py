from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MetricResponse(BaseModel):
    id: str
    run_id: str
    epoch: Optional[int] = None
    train_loss: Optional[float] = None
    val_loss: Optional[float] = None
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    auc: Optional[float] = None
    custom_metrics: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RunResponse(BaseModel):
    id: str
    experiment_id: str
    model_name: str
    framework: Optional[str] = None
    hyperparameters: Optional[dict] = None
    dataset_id: Optional[str] = None
    notes: Optional[str] = None
    status: str
    is_best: bool
    duration_seconds: Optional[float] = None
    artifact_path: Optional[str] = None
    mlflow_run_id: Optional[str] = None
    metrics: List[MetricResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ExperimentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    status: str
    tags: Optional[str] = None
    runs: List[RunResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ExperimentCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    tags: Optional[str] = None


class ExperimentUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[str] = None


class RunCreateRequest(BaseModel):
    model_name: str
    framework: Optional[str] = None
    hyperparameters: Optional[dict] = None
    dataset_id: Optional[str] = None
    notes: Optional[str] = None


class MetricCreateRequest(BaseModel):
    epoch: Optional[int] = None
    train_loss: Optional[float] = None
    val_loss: Optional[float] = None
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    auc: Optional[float] = None
    custom_metrics: Optional[dict] = None

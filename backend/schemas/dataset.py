from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DatasetVersionResponse(BaseModel):
    id: str
    dataset_id: str
    version: int
    changelog: str
    row_count: Optional[int] = None
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DatasetResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    source_url: Optional[str] = None
    format: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    size_mb: Optional[float] = None
    version: int
    tags: Optional[str] = None
    split_type: str
    preview_data: Optional[dict] = None
    column_schema: Optional[dict] = None
    profile_data: Optional[dict] = None
    file_path: Optional[str] = None
    versions: List[DatasetVersionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class DatasetCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    source_url: Optional[str] = None
    format: str = "csv"
    tags: Optional[str] = None
    split_type: str = "raw"


class DatasetUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    source_url: Optional[str] = None
    tags: Optional[str] = None
    split_type: Optional[str] = None

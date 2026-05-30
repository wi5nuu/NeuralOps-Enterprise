from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RAGCollectionResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    document_count: int
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class RAGCollectionCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    chunk_size: int = 500
    chunk_overlap: int = 50


class RAGCollectionUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    status: str
    chunk_count: int
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChunkResponse(BaseModel):
    id: str
    content: str
    chunk_index: int
    score: Optional[float] = None

    class Config:
        from_attributes = True


class QueryRequest(BaseModel):
    collection_id: str
    query: str
    top_k: int = 5
    threshold: float = 0.0


class QueryResponse(BaseModel):
    answer: str
    sources: List[ChunkResponse] = []
    tokens_used: int = 0

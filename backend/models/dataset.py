import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


class SplitTypeEnum(str, enum.Enum):
    TRAIN = "train"
    TEST = "test"
    EVAL = "eval"
    RAW = "raw"
    PROCESSED = "processed"


class DatasetFormatEnum(str, enum.Enum):
    CSV = "csv"
    JSON = "json"
    PARQUET = "parquet"


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    project_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("projects.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    format: Mapped[DatasetFormatEnum] = mapped_column(Enum(DatasetFormatEnum), default=DatasetFormatEnum.CSV, nullable=False)
    row_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    column_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    size_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    tags: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    split_type: Mapped[SplitTypeEnum] = mapped_column(Enum(SplitTypeEnum), default=SplitTypeEnum.RAW, nullable=False)
    preview_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    column_schema: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    profile_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    versions = relationship("DatasetVersion", back_populates="dataset", lazy="selectin", cascade="all, delete-orphan", order_by="DatasetVersion.version.desc()")

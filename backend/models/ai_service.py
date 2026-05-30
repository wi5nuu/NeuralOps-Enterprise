import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


class ServiceTypeEnum(str, enum.Enum):
    LLM = "llm"
    RAG = "rag"
    CLASSIFIER = "classifier"
    ML_MODEL = "ml_model"


class ServiceEnvironmentEnum(str, enum.Enum):
    PRODUCTION = "production"
    STAGING = "staging"
    DEVELOPMENT = "development"


class ServiceCloudEnum(str, enum.Enum):
    AZURE = "azure"
    AWS = "aws"
    GCP = "gcp"
    ON_PREMISE = "on_premise"


class AIService(Base):
    __tablename__ = "ai_services"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    project_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("projects.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    service_type: Mapped[ServiceTypeEnum] = mapped_column(Enum(ServiceTypeEnum), nullable=False)
    environment: Mapped[ServiceEnvironmentEnum] = mapped_column(Enum(ServiceEnvironmentEnum), default=ServiceEnvironmentEnum.PRODUCTION, nullable=False)
    cloud: Mapped[ServiceCloudEnum] = mapped_column(Enum(ServiceCloudEnum), default=ServiceCloudEnum.AZURE, nullable=False)
    endpoint_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sla_target_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_healthy: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avg_latency_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    error_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    health_score: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    uptime: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    logs = relationship("ServiceLog", back_populates="service", lazy="selectin", cascade="all, delete-orphan", order_by="ServiceLog.timestamp.desc()")

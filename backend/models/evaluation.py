import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import enum


class EvalTypeEnum(str, enum.Enum):
    HALLUCINATION = "hallucination"
    RELEVANCE = "relevance"
    SAFETY = "safety"
    BIAS = "bias"
    FAITHFULNESS = "faithfulness"
    CUSTOM = "custom"


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    eval_name: Mapped[str] = mapped_column(String(255), nullable=False)
    eval_type: Mapped[EvalTypeEnum] = mapped_column(Enum(EvalTypeEnum), nullable=False)
    model_output: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ground_truth: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_criteria: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    passed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    threshold: Mapped[float] = mapped_column(Float, default=70.0, nullable=False)
    issues: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    suggestions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

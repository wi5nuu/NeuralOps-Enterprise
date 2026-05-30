import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
import enum


class APIKeyProviderEnum(str, enum.Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    AZURE = "azure"


class APIKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[APIKeyProviderEnum] = mapped_column(Enum(APIKeyProviderEnum), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    masked_key: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

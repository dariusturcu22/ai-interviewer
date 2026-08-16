import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic: Mapped[str] = mapped_column(String, nullable=False)

    # {"strategy": str, "focus_areas": [str, ...]}
    plan: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # [{"question": str, "answer": str, "focus_area": str}, ...]
    transcript: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # "in_progress" | "completed" | "declined"
    status: Mapped[str] = mapped_column(String, nullable=False, default="in_progress")

    summary: Mapped[str | None] = mapped_column(String, nullable=True)
    # "positive" | "neutral" | "negative" | "mixed"
    sentiment: Mapped[str | None] = mapped_column(String, nullable=True)
    sentiment_note: Mapped[str | None] = mapped_column(String, nullable=True)

    key_points: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    keywords: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

"""Camp Connect - Event-specific Bunk Configuration."""
from __future__ import annotations
import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, TenantMixin


class EventBunkConfig(Base, TimestampMixin, TenantMixin):
    """Per-event configuration for a bunk (active status, capacity override, counselors)."""
    __tablename__ = "event_bunk_configs"
    __table_args__ = (
        UniqueConstraint("event_id", "bunk_id", name="uq_event_bunk_config"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("events.id"), index=True, nullable=False)
    bunk_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bunks.id"), index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    event_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Override default bunk capacity
    counselor_user_ids: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # Array of user UUIDs
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    event = relationship("Event", lazy="selectin")
    bunk = relationship("Bunk", lazy="selectin")

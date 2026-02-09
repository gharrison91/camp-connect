"""Camp Connect - Notification Configuration Model."""
from __future__ import annotations
import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, TenantMixin


class NotificationConfig(Base, TimestampMixin, TenantMixin):
    """Configuration for automated notifications triggered by system events."""
    __tablename__ = "notification_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trigger_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # registration_confirmed, health_form_reminder, payment_received, waitlist_promoted, event_reminder
    channel: Mapped[str] = mapped_column(String(20), default="email", nullable=False)  # email, sms, both
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    template_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("message_templates.id"), nullable=True)
    config: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # e.g., {"days_before": 7}

    # Relationships
    template = relationship("MessageTemplate", lazy="selectin")

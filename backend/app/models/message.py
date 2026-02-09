"""
Camp Connect - Message Model
Tracks all sent and received SMS and email messages.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Message(Base, TimestampMixin, SoftDeleteMixin):
    """
    Message model - tracks all sent/received SMS and email communications.
    Scoped by organization_id for multi-tenant isolation.
    """

    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
        nullable=False,
    )

    # Message metadata
    channel: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # "sms" | "email"
    direction: Mapped[str] = mapped_column(
        String(20), nullable=False, default="outbound"
    )  # "outbound" | "inbound"
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="queued"
    )  # "queued" | "sent" | "delivered" | "failed" | "bounced"

    # Addressing
    from_address: Mapped[str] = mapped_column(String(255), nullable=False)
    to_address: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Content
    subject: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    html_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Template reference
    template_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # SendGrid template ID or internal template name

    # Recipient tracking
    recipient_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # "contact" | "staff" | "manual"
    recipient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )  # contact_id or user_id of recipient

    # Related entity tracking
    related_entity_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # "registration" | "event" | "camper"
    related_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # External provider tracking
    external_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )  # Twilio SID or SendGrid message ID
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Extra data
    metadata_: Mapped[Optional[dict]] = mapped_column(
        "metadata", JSONB, nullable=True
    )

    # Timestamps for delivery tracking
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization = relationship("Organization", backref="messages")

    def __repr__(self) -> str:
        return (
            f"<Message(id={self.id}, channel='{self.channel}', "
            f"to='{self.to_address}', status='{self.status}')>"
        )

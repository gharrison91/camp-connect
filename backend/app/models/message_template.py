"""
Camp Connect - Message Template Model
Reusable message templates for SMS and email communications.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class MessageTemplate(Base, TimestampMixin, SoftDeleteMixin):
    """
    MessageTemplate model - reusable templates for SMS and email.
    Supports {{variable}} placeholders for dynamic content.
    Scoped by organization_id for multi-tenant isolation.
    """

    __tablename__ = "message_templates"

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

    # Template identity
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # "sms" | "email" | "both"

    # Content
    subject: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )  # For email templates
    body: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # Template body with {{variable}} placeholders
    html_body: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # HTML version for emails

    # Categorization
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, default="general"
    )  # "registration" | "waitlist" | "reminder" | "emergency" | "general"

    # Available variables for this template
    variables: Mapped[Optional[list]] = mapped_column(
        JSONB, nullable=True, default=list
    )  # e.g. ["camper_name", "event_name", "parent_name"]

    # Flags
    is_system: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )  # System templates can't be deleted
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # Relationships
    organization = relationship("Organization", backref="message_templates")

    def __repr__(self) -> str:
        return (
            f"<MessageTemplate(id={self.id}, name=\'{self.name}\', "
            f"channel=\'{self.channel}\')>"
        )

"""
Camp Connect - Registration Model
Tracks camper registrations for events.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Registration(Base, TimestampMixin, SoftDeleteMixin):
    """
    Registration model - tracks a camper's enrollment in an event.
    Includes payment status and special requests.
    """

    __tablename__ = "registrations"

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

    # Core references
    camper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campers.id"),
        index=True,
        nullable=False,
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id"),
        index=True,
        nullable=False,
    )
    registered_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id"),
        nullable=True,
    )

    # Status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, confirmed, cancelled, waitlisted
    payment_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="unpaid"
    )  # unpaid, deposit_paid, paid, refunded

    # Requests
    activity_requests: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    special_requests: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    organization = relationship("Organization", backref="registrations")
    camper = relationship("Camper", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
    registered_by_contact = relationship("Contact", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<Registration(id={self.id}, camper_id={self.camper_id}, "
            f"event_id={self.event_id}, status='{self.status}')>"
        )

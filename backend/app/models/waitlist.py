"""
Camp Connect - Waitlist Model
Tracks campers waiting for a spot in a full event/session.
Enhanced with priority, offer workflow, and expiry tracking.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Waitlist(Base, TimestampMixin):
    """
    Waitlist model - tracks campers waiting for a spot when an event is full.
    Ordered by position; supports offer/accept/decline workflow with expiry.
    """

    __tablename__ = "waitlist"

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
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id"),
        index=True,
        nullable=False,
    )
    camper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campers.id"),
        index=True,
        nullable=False,
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id"),
        nullable=True,
    )

    # Position and status
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="waiting"
    )  # waiting, offered, accepted, declined, expired

    # Priority level
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="normal"
    )  # normal, high, vip

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Offer workflow tracking
    offered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Legacy field kept for backwards compatibility
    notified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization = relationship("Organization", backref="waitlist_entries")
    event = relationship("Event", back_populates="waitlist_entries")
    camper = relationship("Camper", lazy="selectin")
    contact = relationship("Contact", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<Waitlist(id={self.id}, event_id={self.event_id}, "
            f"camper_id={self.camper_id}, position={self.position}, "
            f"status={self.status}, priority={self.priority})>"
        )

"""
Camp Connect - Bunk Buddy Request Model
Camper-to-camper bunk buddy requests with approval workflow.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class BunkBuddyRequest(Base, TimestampMixin):
    """
    Bunk buddy request: one camper requests to bunk with another.
    Status: pending → approved/denied. Mutual requests are flagged.
    """

    __tablename__ = "bunk_buddy_requests"

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
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id"),
        index=True,
        nullable=False,
    )
    requester_camper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campers.id"),
        index=True,
        nullable=False,
    )
    requested_camper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campers.id"),
        index=True,
        nullable=False,
    )

    # Status: pending, approved, denied
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )

    # Who submitted this (contact/parent)
    submitted_by_contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id"),
        nullable=True,
    )

    # Admin review
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Unique: one request per direction per event
    __table_args__ = (
        UniqueConstraint(
            "requester_camper_id",
            "requested_camper_id",
            "event_id",
            name="uq_buddy_request_per_event",
        ),
    )

    # Relationships
    organization = relationship("Organization")
    event = relationship("Event")
    requester = relationship("Camper", foreign_keys=[requester_camper_id])
    requested = relationship("Camper", foreign_keys=[requested_camper_id])
    submitted_by = relationship("Contact", foreign_keys=[submitted_by_contact_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])

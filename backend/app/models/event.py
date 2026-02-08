"""
Camp Connect - Event Model
Camp sessions/weeks that campers register for.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Event(Base, TimestampMixin, SoftDeleteMixin):
    """
    Event model - camp sessions/weeks that campers register for.
    Scoped to an organization via organization_id.
    """

    __tablename__ = "events"

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
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("locations.id"),
        index=True,
        nullable=True,
    )

    # Basic info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Schedule
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)

    # Capacity
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    enrolled_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    waitlist_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Age & Gender restrictions
    min_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender_restriction: Mapped[str] = mapped_column(
        String(20), nullable=False, default="all"
    )  # all, male, female

    # Pricing
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=0
    )
    deposit_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    deposit_required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    tax_rate: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 4), nullable=True
    )

    # Status & lifecycle
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft"
    )  # draft, published, full, archived

    # Registration windows
    registration_open_date: Mapped[Optional[datetime]] = mapped_column(
        Date, nullable=True
    )
    registration_close_date: Mapped[Optional[datetime]] = mapped_column(
        Date, nullable=True
    )

    # Cloning
    cloned_from_event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Relationships
    organization = relationship("Organization", backref="events")
    location = relationship("Location", lazy="selectin")
    registrations = relationship(
        "Registration", back_populates="event", lazy="selectin"
    )
    waitlist_entries = relationship(
        "Waitlist", back_populates="event", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Event(id={self.id}, name='{self.name}', status='{self.status}')>"

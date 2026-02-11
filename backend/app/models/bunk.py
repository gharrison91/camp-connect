"""
Camp Connect - Cabin, Bunk & Bunk Assignment Models
Cabin = house/building, Bunk = room within a cabin.
Camper-to-bunk assignments.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Cabin(Base, TimestampMixin, SoftDeleteMixin):
    """
    Cabin model - a physical building/house that contains multiple bunks (rooms).
    Scoped to an organization.
    """

    __tablename__ = "cabins"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    total_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    gender_restriction: Mapped[str] = mapped_column(
        String(20), nullable=False, default="all"
    )  # all, male, female
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    organization = relationship("Organization", backref="cabins")
    bunks = relationship("Bunk", back_populates="cabin", lazy="selectin")


class Bunk(Base, TimestampMixin, SoftDeleteMixin):
    """
    Bunk model - a room within a cabin where campers sleep.
    Scoped to an organization via organization_id.
    """

    __tablename__ = "bunks"

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

    # Cabin hierarchy — cabin_id is optional for backward compatibility
    cabin_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cabins.id"),
        index=True,
        nullable=True,
    )

    # Basic info
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Restrictions
    gender_restriction: Mapped[str] = mapped_column(
        String(20), nullable=False, default="all"
    )  # all, male, female
    min_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Location
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Counselor
    counselor_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        index=True,
        nullable=True,
    )

    # Relationships
    organization = relationship("Organization", backref="bunks")
    cabin = relationship("Cabin", back_populates="bunks")
    counselor = relationship("User", foreign_keys=[counselor_user_id])
    assignments = relationship(
        "BunkAssignment", back_populates="bunk", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Bunk(id={self.id}, name='{self.name}', capacity={self.capacity})>"


class BunkAssignment(Base, TimestampMixin):
    """
    BunkAssignment model - assigns a camper to a bunk for a specific event.
    One camper can only be assigned to one bunk per event (unique constraint).
    """

    __tablename__ = "bunk_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    bunk_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bunks.id"),
        index=True,
        nullable=False,
    )
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

    # Details
    bed_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Unique constraint: one assignment per camper per event
    __table_args__ = (
        UniqueConstraint(
            "camper_id", "event_id", name="uq_bunk_assignment_camper_event"
        ),
    )

    # Relationships
    bunk = relationship("Bunk", back_populates="assignments")
    camper = relationship("Camper")
    event = relationship("Event")

    def __repr__(self) -> str:
        return (
            f"<BunkAssignment(id={self.id}, bunk_id={self.bunk_id}, "
            f"camper_id={self.camper_id}, event_id={self.event_id})>"
        )

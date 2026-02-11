"""
Camp Connect - Resource Booking Models
Bookable resources (facilities, equipment, vehicles) and their bookings.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Resource(Base, TimestampMixin, SoftDeleteMixin):
    """
    A bookable resource (facility, equipment, vehicle, etc.).
    Scoped to an organization via organization_id.
    """

    __tablename__ = "resources"

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

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="facility"
    )  # facility, equipment, vehicle, other
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    organization = relationship("Organization", backref="resources")
    bookings = relationship(
        "ResourceBooking", back_populates="resource", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Resource(id={self.id}, name='{self.name}', type='{self.resource_type}')>"


class ResourceBooking(Base, TimestampMixin, SoftDeleteMixin):
    """
    A booking/reservation for a resource.
    """

    __tablename__ = "resource_bookings"

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
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resources.id"),
        index=True,
        nullable=False,
    )
    booked_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    start_time: Mapped["datetime"] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped["datetime"] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending"
    )  # pending, confirmed, cancelled

    # Relationships
    organization = relationship("Organization", backref="resource_bookings")
    resource = relationship("Resource", back_populates="bookings")
    user = relationship("User", backref="resource_bookings")

    def __repr__(self) -> str:
        return f"<ResourceBooking(id={self.id}, resource_id={self.resource_id}, title='{self.title}')>"

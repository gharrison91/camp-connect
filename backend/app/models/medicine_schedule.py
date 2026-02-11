"""
Camp Connect - Medicine Schedule & Administration Models
Nurse schedule for medication tracking and parent notification.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, time
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class MedicineSchedule(Base, TimestampMixin):
    """
    A camper's medication schedule for a camp session.
    Created by parent or admin with dosage, frequency, and times.
    """

    __tablename__ = "medicine_schedules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
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

    medicine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(
        String(50), nullable=False, default="daily"
    )  # daily, twice_daily, three_times, as_needed, specific_times
    scheduled_times: Mapped[Optional[list]] = mapped_column(
        JSONB, nullable=True
    )  # ["08:00", "12:00", "20:00"]
    special_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prescribed_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    submitted_by_contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    camper = relationship("Camper", backref="medicine_schedules")
    event = relationship("Event", backref="medicine_schedules")
    submitted_by_contact = relationship("Contact", backref="submitted_medicine_schedules")
    administrations = relationship(
        "MedicineAdministration", back_populates="schedule", lazy="selectin"
    )


class MedicineAdministration(Base):
    """
    A record of medicine being administered (or skipped/refused).
    Nurse marks when medicine is given → parent notified with timestamp.
    """

    __tablename__ = "medicine_administrations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    schedule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("medicine_schedules.id"),
        index=True,
        nullable=False,
    )
    administered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    administered_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    scheduled_time: Mapped[Optional[str]] = mapped_column(
        String(10), nullable=True
    )  # "08:00" — which slot this covers
    administration_date: Mapped[date] = mapped_column(Date, nullable=False)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="given"
    )  # given, skipped, refused
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    parent_notified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    parent_notified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    schedule = relationship("MedicineSchedule", back_populates="administrations")
    nurse = relationship("User", backref="medicine_administrations")

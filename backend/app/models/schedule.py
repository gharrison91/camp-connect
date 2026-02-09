"""Camp Connect - Schedule Models for daily activity scheduling."""
from __future__ import annotations
import uuid
from datetime import date, time
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, Time, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, SoftDeleteMixin, TenantMixin


class Schedule(Base, TimestampMixin, SoftDeleteMixin, TenantMixin):
    """A scheduled activity session for a specific event, date, and time."""
    __tablename__ = "schedules"
    __table_args__ = (
        UniqueConstraint("event_id", "activity_id", "date", "start_time", name="uq_schedule_event_activity_date_time"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("events.id"), index=True, nullable=False)
    activity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("activities.id"), index=True, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    staff_user_ids: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # Array of user UUIDs
    max_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    event = relationship("Event", lazy="selectin")
    activity = relationship("Activity", lazy="selectin")
    assignments = relationship("ScheduleAssignment", back_populates="schedule", lazy="selectin")


class ScheduleAssignment(Base, TimestampMixin, TenantMixin):
    """Assigns a camper or bunk to a scheduled activity session."""
    __tablename__ = "schedule_assignments"
    __table_args__ = (
        UniqueConstraint("schedule_id", "camper_id", name="uq_schedule_assignment_camper"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schedules.id"), index=True, nullable=False)
    camper_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("campers.id"), index=True, nullable=True)
    bunk_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("bunks.id"), index=True, nullable=True)
    assigned_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    schedule = relationship("Schedule", back_populates="assignments")
    camper = relationship("Camper", lazy="selectin")
    bunk = relationship("Bunk", lazy="selectin")

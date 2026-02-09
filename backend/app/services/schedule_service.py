"""
Camp Connect - Schedule Service
Business logic for daily activity scheduling and camper/bunk assignments.
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.schedule import Schedule, ScheduleAssignment


# ---------------------------------------------------------------------------
# Schedule CRUD
# ---------------------------------------------------------------------------


async def list_schedules(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
    date: Optional[date] = None,
) -> List[Dict[str, Any]]:
    """List schedule sessions for an event, with optional date filter."""
    query = (
        select(Schedule)
        .options(
            selectinload(Schedule.activity),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.camper),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.bunk),
        )
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.event_id == event_id)
        .where(Schedule.deleted_at.is_(None))
    )

    if date is not None:
        query = query.where(Schedule.date == date)

    query = query.order_by(Schedule.date, Schedule.start_time)
    result = await db.execute(query)
    schedules = result.scalars().all()

    return [_schedule_to_dict(s) for s in schedules]


async def get_daily_view(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
    date: date,
) -> Dict[str, Any]:
    """Get all sessions for a date grouped by time slot."""
    query = (
        select(Schedule)
        .options(
            selectinload(Schedule.activity),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.camper),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.bunk),
        )
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.event_id == event_id)
        .where(Schedule.date == date)
        .where(Schedule.deleted_at.is_(None))
        .order_by(Schedule.start_time, Schedule.end_time)
    )
    result = await db.execute(query)
    schedules = result.scalars().all()

    # Group sessions by (start_time, end_time)
    slots: Dict[tuple, List[Dict[str, Any]]] = defaultdict(list)
    for s in schedules:
        key = (s.start_time, s.end_time)
        slots[key].append(_schedule_to_dict(s))

    time_slots = [
        {
            "start_time": start,
            "end_time": end,
            "sessions": sessions,
        }
        for (start, end), sessions in sorted(slots.items())
    ]

    return {
        "date": date,
        "event_id": event_id,
        "time_slots": time_slots,
    }


async def get_schedule(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    schedule_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single schedule session by ID with assignments."""
    result = await db.execute(
        select(Schedule)
        .options(
            selectinload(Schedule.activity),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.camper),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.bunk),
        )
        .where(Schedule.id == schedule_id)
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.deleted_at.is_(None))
    )
    schedule = result.scalar_one_or_none()
    if schedule is None:
        return None
    return _schedule_to_dict(schedule)


async def create_schedule(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Create a new schedule session.

    Checks for time conflicts: same event, same date, overlapping time
    with the same activity.
    """
    event_id = data["event_id"]
    activity_id = data["activity_id"]
    sched_date = data["date"]
    start_time = data["start_time"]
    end_time = data["end_time"]

    # Check for overlapping schedule with same activity on same date
    conflict_query = (
        select(Schedule)
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.event_id == event_id)
        .where(Schedule.activity_id == activity_id)
        .where(Schedule.date == sched_date)
        .where(Schedule.deleted_at.is_(None))
        .where(
            and_(
                Schedule.start_time < end_time,
                Schedule.end_time > start_time,
            )
        )
    )
    conflict_result = await db.execute(conflict_query)
    conflict = conflict_result.scalar_one_or_none()
    if conflict is not None:
        raise ValueError(
            "Schedule conflict: this activity already has a session "
            "overlapping this time slot on this date"
        )

    schedule = Schedule(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule, ["activity", "assignments"])
    return _schedule_to_dict(schedule)


async def update_schedule(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    schedule_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing schedule session."""
    result = await db.execute(
        select(Schedule)
        .options(
            selectinload(Schedule.activity),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.camper),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.bunk),
        )
        .where(Schedule.id == schedule_id)
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.deleted_at.is_(None))
    )
    schedule = result.scalar_one_or_none()
    if schedule is None:
        return None

    for key, value in data.items():
        setattr(schedule, key, value)

    await db.commit()
    await db.refresh(schedule, ["activity", "assignments"])
    return _schedule_to_dict(schedule)


async def delete_schedule(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    schedule_id: uuid.UUID,
) -> bool:
    """Soft-delete a schedule session."""
    result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id)
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.deleted_at.is_(None))
    )
    schedule = result.scalar_one_or_none()
    if schedule is None:
        return False

    schedule.is_deleted = True
    schedule.deleted_at = datetime.utcnow()
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Assignment logic
# ---------------------------------------------------------------------------


async def create_assignment(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Assign a camper or bunk to a schedule session.

    Validates:
    1. Schedule exists and belongs to organization
    2. Camper is not double-booked at the same time on the same date
    """
    schedule_id = data["schedule_id"]
    camper_id = data.get("camper_id")
    bunk_id = data.get("bunk_id")

    # 1. Verify schedule exists and belongs to org
    sched_result = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id)
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.deleted_at.is_(None))
    )
    schedule = sched_result.scalar_one_or_none()
    if schedule is None:
        raise ValueError("Schedule not found or does not belong to this organization")

    # 2. Check camper is not double-booked at the same time
    if camper_id is not None:
        # Find all schedules that overlap this time on the same date
        overlapping_schedules = (
            select(Schedule.id)
            .where(Schedule.organization_id == organization_id)
            .where(Schedule.event_id == schedule.event_id)
            .where(Schedule.date == schedule.date)
            .where(Schedule.deleted_at.is_(None))
            .where(Schedule.id != schedule_id)
            .where(
                and_(
                    Schedule.start_time < schedule.end_time,
                    Schedule.end_time > schedule.start_time,
                )
            )
        ).subquery()

        conflict_result = await db.execute(
            select(ScheduleAssignment)
            .where(ScheduleAssignment.camper_id == camper_id)
            .where(
                ScheduleAssignment.schedule_id.in_(
                    select(overlapping_schedules.c.id)
                )
            )
        )
        conflict = conflict_result.scalar_one_or_none()
        if conflict is not None:
            raise ValueError(
                "Camper is already assigned to another session at this time"
            )

    assignment = ScheduleAssignment(
        id=uuid.uuid4(),
        organization_id=organization_id,
        schedule_id=schedule_id,
        camper_id=camper_id,
        bunk_id=bunk_id,
        assigned_by=data.get("assigned_by"),
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment, ["camper", "bunk"])
    return _assignment_to_dict(assignment)


async def delete_assignment(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    assignment_id: uuid.UUID,
) -> bool:
    """Remove a schedule assignment."""
    result = await db.execute(
        select(ScheduleAssignment)
        .join(Schedule, ScheduleAssignment.schedule_id == Schedule.id)
        .where(ScheduleAssignment.id == assignment_id)
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.deleted_at.is_(None))
    )
    assignment = result.scalar_one_or_none()
    if assignment is None:
        return False

    await db.delete(assignment)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _schedule_to_dict(schedule: Schedule) -> Dict[str, Any]:
    """Convert a Schedule model to a response dict."""
    activity = schedule.activity
    return {
        "id": schedule.id,
        "event_id": schedule.event_id,
        "activity_id": schedule.activity_id,
        "activity_name": activity.name if activity else None,
        "date": schedule.date,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "location": schedule.location,
        "staff_user_ids": schedule.staff_user_ids,
        "max_capacity": schedule.max_capacity,
        "notes": schedule.notes,
        "is_cancelled": schedule.is_cancelled,
        "assignments": [_assignment_to_dict(a) for a in schedule.assignments],
        "created_at": schedule.created_at,
    }


def _assignment_to_dict(assignment: ScheduleAssignment) -> Dict[str, Any]:
    """Convert a ScheduleAssignment model to a response dict."""
    camper = assignment.camper
    bunk = assignment.bunk
    return {
        "id": assignment.id,
        "schedule_id": assignment.schedule_id,
        "camper_id": assignment.camper_id,
        "bunk_id": assignment.bunk_id,
        "assigned_by": assignment.assigned_by,
        "camper_name": (
            f"{camper.first_name} {camper.last_name}" if camper else None
        ),
        "bunk_name": bunk.name if bunk else None,
        "created_at": assignment.created_at,
    }

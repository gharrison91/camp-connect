"""
Camp Connect - Schedule Service
Business logic for daily activity scheduling and camper/bunk assignments.
"""

from __future__ import annotations

import calendar
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.schedule import Schedule, ScheduleAssignment
from app.models.user import User
from app.models.camper import Camper
from app.models.bunk import Bunk


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
# Month Overview & Week View
# ---------------------------------------------------------------------------


async def get_month_overview(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
    year: int,
    month: int,
) -> Dict[str, Any]:
    """
    Return session counts and activity names per day for a given month.
    """
    first_day = date(year, month, 1)
    last_day_num = calendar.monthrange(year, month)[1]
    last_day = date(year, month, last_day_num)

    query = (
        select(Schedule)
        .options(selectinload(Schedule.activity))
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.event_id == event_id)
        .where(Schedule.date >= first_day)
        .where(Schedule.date <= last_day)
        .where(Schedule.deleted_at.is_(None))
        .order_by(Schedule.date, Schedule.start_time)
    )
    result = await db.execute(query)
    schedules = result.scalars().all()

    days: Dict[str, Dict[str, Any]] = {}
    for s in schedules:
        date_str = s.date.isoformat()
        if date_str not in days:
            days[date_str] = {"count": 0, "activities": []}
        days[date_str]["count"] += 1
        activity_name = s.activity.name if s.activity else "Activity"
        if activity_name not in days[date_str]["activities"]:
            days[date_str]["activities"].append(activity_name)

    return {
        "year": year,
        "month": month,
        "days": days,
    }


async def get_week_view(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
    start_date: date,
) -> List[Dict[str, Any]]:
    """
    Return all sessions for a 7-day range starting from start_date.
    """
    end_date = start_date + timedelta(days=6)

    query = (
        select(Schedule)
        .options(
            selectinload(Schedule.activity),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.camper),
            selectinload(Schedule.assignments).selectinload(ScheduleAssignment.bunk),
        )
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.event_id == event_id)
        .where(Schedule.date >= start_date)
        .where(Schedule.date <= end_date)
        .where(Schedule.deleted_at.is_(None))
        .order_by(Schedule.date, Schedule.start_time)
    )
    result = await db.execute(query)
    schedules = result.scalars().all()

    sessions_by_date: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for s in schedules:
        date_str = s.date.isoformat()
        sessions_by_date[date_str].append(_schedule_to_dict(s))

    days = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        date_str = d.isoformat()
        days.append({
            "date": date_str,
            "sessions": sessions_by_date.get(date_str, []),
        })

    return days


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
        "activity_category": activity.category if activity else None,
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


# ---------------------------------------------------------------------------
# Staff Schedule View
# ---------------------------------------------------------------------------


async def get_staff_schedule_view(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
    date: date,
) -> List[Dict[str, Any]]:
    """
    Get a staff-centric view of the daily schedule.

    For each staff member who appears in staff_user_ids of any schedule
    on the given event/date, return their name and the list of sessions
    they are assigned to.
    """
    # 1. Get all schedules for this event + date
    query = (
        select(Schedule)
        .options(selectinload(Schedule.activity))
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.event_id == event_id)
        .where(Schedule.date == date)
        .where(Schedule.deleted_at.is_(None))
        .where(Schedule.is_cancelled.is_(False))
        .order_by(Schedule.start_time)
    )
    result = await db.execute(query)
    schedules = result.scalars().all()

    # 2. Collect all unique staff user_ids and map userId -> list of sessions
    staff_sessions: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    all_user_ids: set = set()

    for s in schedules:
        if not s.staff_user_ids:
            continue
        for uid_str in s.staff_user_ids:
            uid = str(uid_str)
            all_user_ids.add(uid)
            staff_sessions[uid].append({
                "schedule_id": str(s.id),
                "activity_name": s.activity.name if s.activity else "Activity",
                "start_time": s.start_time,
                "end_time": s.end_time,
                "location": s.location,
            })

    if not all_user_ids:
        return []

    # 3. Fetch user names for all staff user IDs
    user_uuids = [uuid.UUID(uid) for uid in all_user_ids]
    user_query = (
        select(User)
        .where(User.id.in_(user_uuids))
        .where(User.organization_id == organization_id)
    )
    user_result = await db.execute(user_query)
    users = user_result.scalars().all()
    user_map = {str(u.id): u for u in users}

    # 4. Build response
    entries = []
    for uid in sorted(all_user_ids):
        user = user_map.get(uid)
        if user is None:
            continue
        entries.append({
            "user_id": uid,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "sessions": staff_sessions[uid],
        })

    # Sort by last name, then first name
    entries.sort(key=lambda e: (e["last_name"], e["first_name"]))
    return entries


# Scheduling v2 -- Staff and Camper Assignment Service Methods


async def assign_staff_to_schedule(
    db: AsyncSession, *, organization_id: uuid.UUID,
    schedule_id: uuid.UUID, staff_user_id: uuid.UUID,
) -> Dict[str, Any]:
    result = await db.execute(
        select(Schedule).options(selectinload(Schedule.activity))
        .where(Schedule.id == schedule_id)
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.deleted_at.is_(None))
    )
    schedule = result.scalar_one_or_none()
    if schedule is None:
        raise ValueError("Schedule not found")
    user_result = await db.execute(
        select(User).where(User.id == staff_user_id).where(User.organization_id == organization_id)
    )
    user = user_result.scalar_one_or_none()
    if user is None:
        raise ValueError("Staff member not found")
    current_ids = schedule.staff_user_ids or []
    str_ids = [str(uid) for uid in current_ids]
    if str(staff_user_id) in str_ids:
        raise ValueError("Staff member is already assigned")
    new_ids = list(current_ids) + [str(staff_user_id)]
    schedule.staff_user_ids = new_ids
    await db.commit()
    activity = schedule.activity
    return {
        "schedule_id": schedule.id, "staff_user_id": staff_user_id,
        "activity_name": activity.name if activity else None,
        "date": schedule.date, "start_time": schedule.start_time,
        "end_time": schedule.end_time, "location": schedule.location,
        "message": "Staff assigned successfully",
    }

async def assign_camper_to_schedule(
    db: AsyncSession, *, organization_id: uuid.UUID,
    schedule_id: uuid.UUID, camper_id: uuid.UUID,
    bunk_id: uuid.UUID | None = None, assigned_by: uuid.UUID | None = None,
) -> Dict[str, Any]:
    data = {"schedule_id": schedule_id, "camper_id": camper_id, "bunk_id": bunk_id, "assigned_by": assigned_by}
    assignment_dict = await create_assignment(db, organization_id=organization_id, data=data)
    sched_result = await db.execute(
        select(Schedule).options(selectinload(Schedule.activity))
        .where(Schedule.id == schedule_id).where(Schedule.deleted_at.is_(None))
    )
    schedule = sched_result.scalar_one_or_none()
    activity_name = sched_date = start_time = end_time = None
    if schedule:
        activity_name = schedule.activity.name if schedule.activity else None
        sched_date = schedule.date
        start_time = schedule.start_time
        end_time = schedule.end_time
    return {
        "assignment_id": assignment_dict["id"], "schedule_id": schedule_id,
        "camper_id": camper_id, "bunk_id": bunk_id,
        "camper_name": assignment_dict.get("camper_name"),
        "activity_name": activity_name, "date": sched_date,
        "start_time": start_time, "end_time": end_time,
        "message": "Camper assigned successfully",
    }

async def get_staff_weekly_schedule(
    db: AsyncSession, *, organization_id: uuid.UUID,
    staff_user_id: uuid.UUID, event_id: uuid.UUID, start_date: date,
) -> Dict[str, Any] | None:
    end_date = start_date + timedelta(days=6)
    user_result = await db.execute(
        select(User).where(User.id == staff_user_id).where(User.organization_id == organization_id)
    )
    user = user_result.scalar_one_or_none()
    if user is None:
        return None
    query = (
        select(Schedule).options(selectinload(Schedule.activity))
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.event_id == event_id)
        .where(Schedule.date >= start_date).where(Schedule.date <= end_date)
        .where(Schedule.deleted_at.is_(None))
        .order_by(Schedule.date, Schedule.start_time)
    )
    result = await db.execute(query)
    all_schedules = result.scalars().all()
    staff_id_str = str(staff_user_id)
    slots = []
    total_minutes = 0.0
    for s in all_schedules:
        if not s.staff_user_ids:
            continue
        if staff_id_str not in [str(uid) for uid in s.staff_user_ids]:
            continue
        activity = s.activity
        slots.append({
            "schedule_id": s.id, "activity_id": s.activity_id,
            "activity_name": activity.name if activity else "Activity",
            "activity_category": activity.category if activity else None,
            "date": s.date, "start_time": s.start_time, "end_time": s.end_time,
            "location": s.location, "is_cancelled": s.is_cancelled,
        })
        start_mins = s.start_time.hour * 60 + s.start_time.minute
        end_mins = s.end_time.hour * 60 + s.end_time.minute
        if end_mins > start_mins:
            total_minutes += (end_mins - start_mins)
    total_hours = round(total_minutes / 60.0, 1)
    return {
        "staff_user_id": staff_user_id, "first_name": user.first_name,
        "last_name": user.last_name, "email": user.email,
        "department": getattr(user, "department", None),
        "week_start": start_date, "week_end": end_date,
        "slots": slots, "total_hours": total_hours,
    }

async def get_camper_weekly_schedule(
    db: AsyncSession, *, organization_id: uuid.UUID,
    camper_id: uuid.UUID, event_id: uuid.UUID, start_date: date,
) -> Dict[str, Any] | None:
    end_date = start_date + timedelta(days=6)
    cr = await db.execute(select(Camper).where(Camper.id == camper_id).where(Camper.organization_id == organization_id))
    camper = cr.scalar_one_or_none()
    if camper is None:
        return None
    query = (
        select(ScheduleAssignment)
        .join(Schedule, ScheduleAssignment.schedule_id == Schedule.id)
        .options(
            selectinload(ScheduleAssignment.schedule).selectinload(Schedule.activity),
            selectinload(ScheduleAssignment.bunk),
        )
        .where(Schedule.organization_id == organization_id)
        .where(Schedule.event_id == event_id)
        .where(Schedule.date >= start_date).where(Schedule.date <= end_date)
        .where(Schedule.deleted_at.is_(None))
        .where(ScheduleAssignment.camper_id == camper_id)
    )
    result = await db.execute(query)
    assignments = result.scalars().all()
    slots = []
    bunk_name = None
    for a in assignments:
        s = a.schedule
        if s is None: continue
        activity = s.activity
        slots.append({"schedule_id": s.id, "activity_id": s.activity_id, "activity_name": activity.name if activity else "Activity", "activity_category": activity.category if activity else None, "date": s.date, "start_time": s.start_time, "end_time": s.end_time, "location": s.location, "is_cancelled": s.is_cancelled})
        if a.bunk and bunk_name is None: bunk_name = a.bunk.name
    slots.sort(key=lambda x: (x[chr(34)+chr(100)+chr(97)+chr(116)+chr(101)+chr(34)], x[chr(34)+chr(115)+chr(116)+chr(97)+chr(114)+chr(116)+chr(95)+chr(116)+chr(105)+chr(109)+chr(101)+chr(34)]))

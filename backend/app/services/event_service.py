"""
Camp Connect - Event Service
Business logic for event (camp session/week) management.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event import Event


async def list_events(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List events for an organization with optional filters."""
    query = (
        select(Event)
        .options(selectinload(Event.location))
        .where(Event.organization_id == organization_id)
        .where(Event.deleted_at.is_(None))
    )

    if status_filter:
        query = query.where(Event.status == status_filter)

    if search:
        query = query.where(Event.name.ilike(f"%{search}%"))

    query = query.order_by(Event.start_date.desc(), Event.name)
    result = await db.execute(query)
    events = result.scalars().all()

    return [_event_to_dict(e) for e in events]


async def get_event(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single event by ID."""
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.location))
        .where(Event.id == event_id)
        .where(Event.organization_id == organization_id)
        .where(Event.deleted_at.is_(None))
    )
    event = result.scalar_one_or_none()
    if event is None:
        return None
    return _event_to_dict(event)


async def create_event(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new event."""
    # Validate dates
    if data["end_date"] < data["start_date"]:
        raise ValueError("End date must be after start date")

    event = Event(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event, ["location"])
    return _event_to_dict(event)


async def update_event(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing event."""
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.location))
        .where(Event.id == event_id)
        .where(Event.organization_id == organization_id)
        .where(Event.deleted_at.is_(None))
    )
    event = result.scalar_one_or_none()
    if event is None:
        return None

    for key, value in data.items():
        setattr(event, key, value)

    await db.commit()
    await db.refresh(event, ["location"])
    return _event_to_dict(event)


async def delete_event(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
) -> bool:
    """Soft-delete an event."""
    result = await db.execute(
        select(Event)
        .where(Event.id == event_id)
        .where(Event.organization_id == organization_id)
        .where(Event.deleted_at.is_(None))
    )
    event = result.scalar_one_or_none()
    if event is None:
        return False

    event.is_deleted = True
    event.deleted_at = datetime.utcnow()
    await db.commit()
    return True


async def clone_event(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
    new_name: Optional[str] = None,
    new_start_date=None,
    new_end_date=None,
) -> Optional[Dict[str, Any]]:
    """Clone an event with new dates."""
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.location))
        .where(Event.id == event_id)
        .where(Event.organization_id == organization_id)
        .where(Event.deleted_at.is_(None))
    )
    original = result.scalar_one_or_none()
    if original is None:
        return None

    cloned = Event(
        id=uuid.uuid4(),
        organization_id=organization_id,
        name=new_name or f"{original.name} (Copy)",
        description=original.description,
        location_id=original.location_id,
        start_date=new_start_date,
        end_date=new_end_date,
        start_time=original.start_time,
        end_time=original.end_time,
        capacity=original.capacity,
        enrolled_count=0,
        waitlist_count=0,
        min_age=original.min_age,
        max_age=original.max_age,
        gender_restriction=original.gender_restriction,
        price=original.price,
        deposit_amount=original.deposit_amount,
        deposit_required=original.deposit_required,
        tax_rate=original.tax_rate,
        status="draft",
        cloned_from_event_id=original.id,
    )
    db.add(cloned)
    await db.commit()
    await db.refresh(cloned, ["location"])
    return _event_to_dict(cloned)


def _event_to_dict(event: Event) -> Dict[str, Any]:
    """Convert an Event model to a response dict."""
    return {
        "id": event.id,
        "name": event.name,
        "description": event.description,
        "location_id": event.location_id,
        "location_name": event.location.name if event.location else None,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "capacity": event.capacity,
        "enrolled_count": event.enrolled_count,
        "waitlist_count": event.waitlist_count,
        "min_age": event.min_age,
        "max_age": event.max_age,
        "gender_restriction": event.gender_restriction,
        "price": event.price,
        "deposit_amount": event.deposit_amount,
        "deposit_required": event.deposit_required,
        "tax_rate": event.tax_rate,
        "status": event.status,
        "registration_open_date": event.registration_open_date,
        "registration_close_date": event.registration_close_date,
        "cloned_from_event_id": event.cloned_from_event_id,
        "created_at": event.created_at,
    }

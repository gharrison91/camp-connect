"""
Camp Connect - Registration Service
Business logic for registering campers to events and managing waitlists.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camper import Camper
from app.models.contact import Contact
from app.models.event import Event
from app.models.registration import Registration
from app.models.waitlist import Waitlist


async def register_camper(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
    event_id: uuid.UUID,
    registered_by: Optional[uuid.UUID] = None,
    activity_requests: Optional[list] = None,
    special_requests: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Register a camper for an event.
    If the event is full, adds to waitlist instead.
    """
    # Verify event exists and belongs to org
    event_result = await db.execute(
        select(Event)
        .where(Event.id == event_id)
        .where(Event.organization_id == organization_id)
        .where(Event.deleted_at.is_(None))
    )
    event = event_result.scalar_one_or_none()
    if event is None:
        raise ValueError("Event not found")

    if event.status == "archived":
        raise ValueError("Cannot register for an archived event")

    # Verify camper exists and belongs to org
    camper_result = await db.execute(
        select(Camper)
        .where(Camper.id == camper_id)
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
    )
    camper = camper_result.scalar_one_or_none()
    if camper is None:
        raise ValueError("Camper not found")

    # Check for duplicate registration
    dup_result = await db.execute(
        select(Registration)
        .where(Registration.camper_id == camper_id)
        .where(Registration.event_id == event_id)
        .where(Registration.status != "cancelled")
        .where(Registration.deleted_at.is_(None))
    )
    if dup_result.scalar_one_or_none():
        raise ValueError("Camper is already registered for this event")

    # Check capacity
    if event.capacity > 0 and event.enrolled_count >= event.capacity:
        # Event is full — add to waitlist
        waitlist_entry = await _add_to_waitlist(
            db,
            organization_id=organization_id,
            event=event,
            camper_id=camper_id,
            contact_id=registered_by,
        )
        return {
            "status": "waitlisted",
            "waitlist_entry": waitlist_entry,
            "message": "Event is full. Added to waitlist.",
        }

    # Create registration
    registration = Registration(
        id=uuid.uuid4(),
        organization_id=organization_id,
        camper_id=camper_id,
        event_id=event_id,
        registered_by=registered_by,
        status="confirmed",
        payment_status="unpaid",
        activity_requests=activity_requests,
        special_requests=special_requests,
    )
    db.add(registration)

    # Update enrolled count
    event.enrolled_count += 1
    if event.capacity > 0 and event.enrolled_count >= event.capacity:
        event.status = "full"

    await db.commit()
    await db.refresh(registration)

    return {
        "status": "registered",
        "registration": _registration_to_dict(registration, camper, event),
    }


async def list_registrations(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: Optional[uuid.UUID] = None,
    camper_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List registrations with optional filters."""
    query = (
        select(Registration)
        .options(
            selectinload(Registration.camper),
            selectinload(Registration.event),
        )
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
    )

    if event_id:
        query = query.where(Registration.event_id == event_id)
    if camper_id:
        query = query.where(Registration.camper_id == camper_id)
    if status_filter:
        query = query.where(Registration.status == status_filter)

    query = query.order_by(Registration.registered_at.desc())
    result = await db.execute(query)
    registrations = result.scalars().all()

    return [
        _registration_to_dict(r, r.camper, r.event)
        for r in registrations
    ]


async def get_registration(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    registration_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single registration."""
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.camper),
            selectinload(Registration.event),
        )
        .where(Registration.id == registration_id)
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
    )
    reg = result.scalar_one_or_none()
    if reg is None:
        return None
    return _registration_to_dict(reg, reg.camper, reg.event)


async def update_registration(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    registration_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update a registration."""
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.camper),
            selectinload(Registration.event),
        )
        .where(Registration.id == registration_id)
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
    )
    reg = result.scalar_one_or_none()
    if reg is None:
        return None

    for key, value in data.items():
        setattr(reg, key, value)

    await db.commit()
    await db.refresh(reg)
    return _registration_to_dict(reg, reg.camper, reg.event)


async def cancel_registration(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    registration_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Cancel a registration, decrement enrolled count, and promote from waitlist."""
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.camper),
            selectinload(Registration.event),
        )
        .where(Registration.id == registration_id)
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
    )
    reg = result.scalar_one_or_none()
    if reg is None:
        return None

    if reg.status == "cancelled":
        raise ValueError("Registration is already cancelled")

    # Cancel the registration
    reg.status = "cancelled"

    # Decrement enrolled count on event
    event = reg.event
    if event and event.enrolled_count > 0:
        event.enrolled_count -= 1
        # If event was full, revert to published
        if event.status == "full":
            event.status = "published"

    await db.commit()

    # Promote next from waitlist
    await _promote_next_from_waitlist(db, organization_id=organization_id, event=event)

    return _registration_to_dict(reg, reg.camper, event)


async def get_waitlist(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Get the waitlist for an event, ordered by position."""
    result = await db.execute(
        select(Waitlist)
        .options(
            selectinload(Waitlist.camper),
            selectinload(Waitlist.contact),
        )
        .where(Waitlist.organization_id == organization_id)
        .where(Waitlist.event_id == event_id)
        .where(Waitlist.status == "waiting")
        .order_by(Waitlist.position)
    )
    entries = result.scalars().all()
    return [_waitlist_to_dict(w) for w in entries]


async def promote_from_waitlist(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    waitlist_id: uuid.UUID,
) -> Dict[str, Any]:
    """Manually promote a waitlist entry to registered."""
    result = await db.execute(
        select(Waitlist)
        .options(
            selectinload(Waitlist.camper),
            selectinload(Waitlist.contact),
        )
        .where(Waitlist.id == waitlist_id)
        .where(Waitlist.organization_id == organization_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        raise ValueError("Waitlist entry not found")

    if entry.status != "waiting":
        raise ValueError(f"Waitlist entry is not in 'waiting' status (current: {entry.status})")

    # Get event
    event_result = await db.execute(
        select(Event).where(Event.id == entry.event_id)
    )
    event = event_result.scalar_one()

    # Create registration
    registration = Registration(
        id=uuid.uuid4(),
        organization_id=organization_id,
        camper_id=entry.camper_id,
        event_id=entry.event_id,
        registered_by=entry.contact_id,
        status="confirmed",
        payment_status="unpaid",
    )
    db.add(registration)

    # Update waitlist entry
    entry.status = "enrolled"

    # Update event counts
    event.enrolled_count += 1
    event.waitlist_count = max(0, event.waitlist_count - 1)

    if event.capacity > 0 and event.enrolled_count >= event.capacity:
        event.status = "full"

    await db.commit()
    return {
        "status": "promoted",
        "registration_id": registration.id,
        "camper_name": f"{entry.camper.first_name} {entry.camper.last_name}" if entry.camper else None,
    }


# ─── Internal helpers ───────────────────────────────────────────


async def _add_to_waitlist(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event: Event,
    camper_id: uuid.UUID,
    contact_id: Optional[uuid.UUID] = None,
) -> Dict[str, Any]:
    """Add a camper to the event waitlist."""
    # Get next position
    max_pos_result = await db.execute(
        select(sqlfunc.max(Waitlist.position))
        .where(Waitlist.event_id == event.id)
        .where(Waitlist.organization_id == organization_id)
    )
    max_pos = max_pos_result.scalar() or 0

    entry = Waitlist(
        id=uuid.uuid4(),
        organization_id=organization_id,
        event_id=event.id,
        camper_id=camper_id,
        contact_id=contact_id,
        position=max_pos + 1,
        status="waiting",
    )
    db.add(entry)

    # Update waitlist count
    event.waitlist_count += 1

    await db.commit()
    await db.refresh(entry)
    return _waitlist_to_dict(entry)


async def _promote_next_from_waitlist(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event: Event,
) -> None:
    """Auto-promote the next person on the waitlist after a cancellation."""
    if event is None:
        return

    # Find next waiting entry
    result = await db.execute(
        select(Waitlist)
        .where(Waitlist.event_id == event.id)
        .where(Waitlist.organization_id == organization_id)
        .where(Waitlist.status == "waiting")
        .order_by(Waitlist.position)
        .limit(1)
    )
    next_entry = result.scalar_one_or_none()
    if next_entry is None:
        return

    # Create registration for the promoted entry
    registration = Registration(
        id=uuid.uuid4(),
        organization_id=organization_id,
        camper_id=next_entry.camper_id,
        event_id=event.id,
        registered_by=next_entry.contact_id,
        status="confirmed",
        payment_status="unpaid",
    )
    db.add(registration)

    # Update waitlist entry
    next_entry.status = "enrolled"

    # Update event counts
    event.enrolled_count += 1
    event.waitlist_count = max(0, event.waitlist_count - 1)

    if event.capacity > 0 and event.enrolled_count >= event.capacity:
        event.status = "full"

    await db.commit()


def _registration_to_dict(
    reg: Registration,
    camper: Optional[Camper] = None,
    event: Optional[Event] = None,
) -> Dict[str, Any]:
    """Convert a Registration model to a response dict."""
    return {
        "id": reg.id,
        "camper_id": reg.camper_id,
        "event_id": reg.event_id,
        "registered_by": reg.registered_by,
        "camper_name": (
            f"{camper.first_name} {camper.last_name}" if camper else None
        ),
        "event_name": event.name if event else None,
        "status": reg.status,
        "payment_status": reg.payment_status,
        "activity_requests": reg.activity_requests,
        "special_requests": reg.special_requests,
        "registered_at": reg.registered_at,
        "created_at": reg.created_at,
    }


def _waitlist_to_dict(entry: Waitlist) -> Dict[str, Any]:
    """Convert a Waitlist model to a response dict."""
    return {
        "id": entry.id,
        "event_id": entry.event_id,
        "camper_id": entry.camper_id,
        "contact_id": entry.contact_id,
        "camper_name": (
            f"{entry.camper.first_name} {entry.camper.last_name}"
            if entry.camper else None
        ),
        "contact_name": (
            f"{entry.contact.first_name} {entry.contact.last_name}"
            if entry.contact else None
        ),
        "position": entry.position,
        "status": entry.status,
        "notified_at": entry.notified_at,
        "created_at": entry.created_at,
    }

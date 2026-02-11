"""
Camp Connect - Waitlist Service
Business logic for waitlist management with offer/accept/decline workflow.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.waitlist import Waitlist
from app.models.event import Event


def _entry_to_dict(entry: Waitlist) -> Dict[str, Any]:
    """Convert a Waitlist model to a response dict."""
    camper_name = None
    if entry.camper:
        first = getattr(entry.camper, "first_name", "") or ""
        last = getattr(entry.camper, "last_name", "") or ""
        camper_name = f"{first} {last}".strip() or None

    contact_name = None
    if entry.contact:
        first = getattr(entry.contact, "first_name", "") or ""
        last = getattr(entry.contact, "last_name", "") or ""
        contact_name = f"{first} {last}".strip() or None

    event_name = None
    if entry.event:
        event_name = entry.event.name

    return {
        "id": entry.id,
        "event_id": entry.event_id,
        "camper_id": entry.camper_id,
        "contact_id": entry.contact_id,
        "camper_name": camper_name,
        "contact_name": contact_name,
        "event_name": event_name,
        "position": entry.position,
        "status": entry.status,
        "priority": entry.priority,
        "notes": entry.notes,
        "offered_at": entry.offered_at,
        "expires_at": entry.expires_at,
        "created_at": entry.created_at,
    }


async def get_waitlist(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Get the full waitlist for an event, ordered by position."""
    result = await db.execute(
        select(Waitlist)
        .options(
            selectinload(Waitlist.camper),
            selectinload(Waitlist.contact),
            selectinload(Waitlist.event),
        )
        .where(Waitlist.organization_id == organization_id)
        .where(Waitlist.event_id == event_id)
        .order_by(Waitlist.position.asc())
    )
    entries = result.scalars().all()
    return [_entry_to_dict(e) for e in entries]


async def get_entry(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single waitlist entry by ID."""
    result = await db.execute(
        select(Waitlist)
        .options(
            selectinload(Waitlist.camper),
            selectinload(Waitlist.contact),
            selectinload(Waitlist.event),
        )
        .where(Waitlist.id == entry_id)
        .where(Waitlist.organization_id == organization_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        return None
    return _entry_to_dict(entry)


async def add_to_waitlist(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Add a camper to an event waitlist at the end of the queue."""
    event_id = data["event_id"]

    # Determine next position
    result = await db.execute(
        select(func.coalesce(func.max(Waitlist.position), 0))
        .where(Waitlist.organization_id == organization_id)
        .where(Waitlist.event_id == event_id)
    )
    max_position = result.scalar() or 0

    entry = Waitlist(
        id=uuid.uuid4(),
        organization_id=organization_id,
        event_id=event_id,
        camper_id=data["camper_id"],
        contact_id=data.get("contact_id"),
        position=max_position + 1,
        status="waiting",
        priority=data.get("priority", "normal"),
        notes=data.get("notes"),
    )
    db.add(entry)

    # Update event waitlist count
    await _update_event_waitlist_count(db, organization_id, event_id)

    await db.commit()
    await db.refresh(entry, ["camper", "contact", "event"])
    return _entry_to_dict(entry)


async def update_entry(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update a waitlist entry (priority, notes, contact)."""
    result = await db.execute(
        select(Waitlist)
        .options(
            selectinload(Waitlist.camper),
            selectinload(Waitlist.contact),
            selectinload(Waitlist.event),
        )
        .where(Waitlist.id == entry_id)
        .where(Waitlist.organization_id == organization_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        return None

    for key, value in data.items():
        setattr(entry, key, value)

    await db.commit()
    await db.refresh(entry, ["camper", "contact", "event"])
    return _entry_to_dict(entry)


async def remove_from_waitlist(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
) -> bool:
    """Remove an entry from the waitlist entirely."""
    result = await db.execute(
        select(Waitlist)
        .where(Waitlist.id == entry_id)
        .where(Waitlist.organization_id == organization_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        return False

    event_id = entry.event_id
    removed_position = entry.position

    await db.delete(entry)

    # Shift positions down for entries after the removed one
    await db.execute(
        update(Waitlist)
        .where(Waitlist.organization_id == organization_id)
        .where(Waitlist.event_id == event_id)
        .where(Waitlist.position > removed_position)
        .values(position=Waitlist.position - 1)
    )

    await _update_event_waitlist_count(db, organization_id, event_id)
    await db.commit()
    return True


async def offer_spot(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
    expires_in_hours: int = 48,
) -> Optional[Dict[str, Any]]:
    """Offer a spot to a waitlisted camper with an expiry window."""
    result = await db.execute(
        select(Waitlist)
        .options(
            selectinload(Waitlist.camper),
            selectinload(Waitlist.contact),
            selectinload(Waitlist.event),
        )
        .where(Waitlist.id == entry_id)
        .where(Waitlist.organization_id == organization_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        return None

    if entry.status != "waiting":
        raise ValueError(
            f"Cannot offer spot: entry status is '{entry.status}', expected 'waiting'"
        )

    now = datetime.now(timezone.utc)
    entry.status = "offered"
    entry.offered_at = now
    entry.expires_at = now + timedelta(hours=expires_in_hours)
    entry.notified_at = now

    await db.commit()
    await db.refresh(entry, ["camper", "contact", "event"])
    return _entry_to_dict(entry)


async def accept_spot(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Accept an offered spot on the waitlist."""
    result = await db.execute(
        select(Waitlist)
        .options(
            selectinload(Waitlist.camper),
            selectinload(Waitlist.contact),
            selectinload(Waitlist.event),
        )
        .where(Waitlist.id == entry_id)
        .where(Waitlist.organization_id == organization_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        return None

    if entry.status != "offered":
        raise ValueError(
            f"Cannot accept: entry status is '{entry.status}', expected 'offered'"
        )

    # Check if offer has expired
    now = datetime.now(timezone.utc)
    if entry.expires_at and entry.expires_at < now:
        entry.status = "expired"
        await db.commit()
        raise ValueError("Offer has expired")

    entry.status = "accepted"

    await _update_event_waitlist_count(db, organization_id, entry.event_id)
    await db.commit()
    await db.refresh(entry, ["camper", "contact", "event"])
    return _entry_to_dict(entry)


async def decline_spot(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entry_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Decline an offered spot and auto-advance the next person in queue."""
    result = await db.execute(
        select(Waitlist)
        .options(
            selectinload(Waitlist.camper),
            selectinload(Waitlist.contact),
            selectinload(Waitlist.event),
        )
        .where(Waitlist.id == entry_id)
        .where(Waitlist.organization_id == organization_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        return None

    if entry.status != "offered":
        raise ValueError(
            f"Cannot decline: entry status is '{entry.status}', expected 'offered'"
        )

    entry.status = "declined"

    # Auto-advance: offer to next waiting person in queue
    await auto_advance(
        db, organization_id=organization_id, event_id=entry.event_id
    )

    await _update_event_waitlist_count(db, organization_id, entry.event_id)
    await db.commit()
    await db.refresh(entry, ["camper", "contact", "event"])
    return _entry_to_dict(entry)


async def auto_advance(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Automatically offer a spot to the next waiting person in the queue."""
    result = await db.execute(
        select(Waitlist)
        .options(
            selectinload(Waitlist.camper),
            selectinload(Waitlist.contact),
            selectinload(Waitlist.event),
        )
        .where(Waitlist.organization_id == organization_id)
        .where(Waitlist.event_id == event_id)
        .where(Waitlist.status == "waiting")
        .order_by(Waitlist.position.asc())
        .limit(1)
    )
    next_entry = result.scalar_one_or_none()
    if next_entry is None:
        return None

    now = datetime.now(timezone.utc)
    next_entry.status = "offered"
    next_entry.offered_at = now
    next_entry.expires_at = now + timedelta(hours=48)
    next_entry.notified_at = now

    # Don't commit here - let the caller commit
    return _entry_to_dict(next_entry)


async def reorder(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Manually reorder waitlist entries by setting new positions."""
    if not items:
        return []

    # Get the event_id from the first item to return the full list after
    first_result = await db.execute(
        select(Waitlist)
        .where(Waitlist.id == items[0]["id"])
        .where(Waitlist.organization_id == organization_id)
    )
    first_entry = first_result.scalar_one_or_none()
    if first_entry is None:
        raise ValueError("Waitlist entry not found")

    event_id = first_entry.event_id

    # Update each position
    for item in items:
        await db.execute(
            update(Waitlist)
            .where(Waitlist.id == item["id"])
            .where(Waitlist.organization_id == organization_id)
            .values(position=item["position"])
        )

    await db.commit()

    # Return the updated full list
    return await get_waitlist(
        db, organization_id=organization_id, event_id=event_id
    )


async def _update_event_waitlist_count(
    db: AsyncSession,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
) -> None:
    """Update the waitlist_count on the Event model."""
    result = await db.execute(
        select(func.count())
        .select_from(Waitlist)
        .where(Waitlist.organization_id == organization_id)
        .where(Waitlist.event_id == event_id)
        .where(Waitlist.status.in_(["waiting", "offered"]))
    )
    count = result.scalar() or 0

    event_result = await db.execute(
        select(Event)
        .where(Event.id == event_id)
        .where(Event.organization_id == organization_id)
    )
    event = event_result.scalar_one_or_none()
    if event:
        event.waitlist_count = count

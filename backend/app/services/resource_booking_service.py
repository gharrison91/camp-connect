"""
Camp Connect - Resource Booking Service
Business logic for resource and booking management.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resource_booking import Resource, ResourceBooking
from app.models.user import User


# ========================================================================
# Resource CRUD
# ========================================================================

async def list_resources(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    resource_type: Optional[str] = None,
    available: Optional[bool] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List resources for an organization with optional filters."""
    query = (
        select(Resource)
        .where(Resource.organization_id == organization_id)
        .where(Resource.deleted_at.is_(None))
    )

    if resource_type:
        query = query.where(Resource.resource_type == resource_type)
    if available is not None:
        query = query.where(Resource.available == available)
    if search:
        query = query.where(Resource.name.ilike(f"%{search}%"))

    query = query.order_by(Resource.name)
    result = await db.execute(query)
    resources = result.scalars().all()

    out = []
    for r in resources:
        booking_count = await _count_bookings_for_resource(db, r.id)
        out.append(_resource_to_dict(r, booking_count))
    return out


async def get_resource(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    resource_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single resource by ID."""
    result = await db.execute(
        select(Resource)
        .where(Resource.id == resource_id)
        .where(Resource.organization_id == organization_id)
        .where(Resource.deleted_at.is_(None))
    )
    resource = result.scalar_one_or_none()
    if resource is None:
        return None
    booking_count = await _count_bookings_for_resource(db, resource.id)
    return _resource_to_dict(resource, booking_count)


async def create_resource(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new bookable resource."""
    resource = Resource(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return _resource_to_dict(resource, 0)


async def update_resource(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    resource_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing resource."""
    result = await db.execute(
        select(Resource)
        .where(Resource.id == resource_id)
        .where(Resource.organization_id == organization_id)
        .where(Resource.deleted_at.is_(None))
    )
    resource = result.scalar_one_or_none()
    if resource is None:
        return None

    for key, value in data.items():
        setattr(resource, key, value)

    await db.commit()
    await db.refresh(resource)
    booking_count = await _count_bookings_for_resource(db, resource.id)
    return _resource_to_dict(resource, booking_count)


async def delete_resource(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    resource_id: uuid.UUID,
) -> bool:
    """Soft-delete a resource."""
    result = await db.execute(
        select(Resource)
        .where(Resource.id == resource_id)
        .where(Resource.organization_id == organization_id)
        .where(Resource.deleted_at.is_(None))
    )
    resource = result.scalar_one_or_none()
    if resource is None:
        return False

    resource.is_deleted = True
    resource.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return True


# ========================================================================
# Booking CRUD
# ========================================================================

async def list_bookings(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    resource_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    """List bookings for an organization with optional filters."""
    query = (
        select(ResourceBooking)
        .where(ResourceBooking.organization_id == organization_id)
        .where(ResourceBooking.deleted_at.is_(None))
    )

    if resource_id:
        query = query.where(ResourceBooking.resource_id == resource_id)
    if status:
        query = query.where(ResourceBooking.status == status)
    if date_from:
        query = query.where(ResourceBooking.start_time >= date_from)
    if date_to:
        query = query.where(ResourceBooking.end_time <= date_to)

    query = query.order_by(ResourceBooking.start_time.desc())
    result = await db.execute(query)
    bookings = result.scalars().all()

    out = []
    for b in bookings:
        resource_name = await _get_resource_name(db, b.resource_id)
        booked_by_name = await _get_user_name(db, b.booked_by)
        out.append(_booking_to_dict(b, resource_name, booked_by_name))
    return out


async def get_booking(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    booking_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single booking by ID."""
    result = await db.execute(
        select(ResourceBooking)
        .where(ResourceBooking.id == booking_id)
        .where(ResourceBooking.organization_id == organization_id)
        .where(ResourceBooking.deleted_at.is_(None))
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        return None
    resource_name = await _get_resource_name(db, booking.resource_id)
    booked_by_name = await _get_user_name(db, booking.booked_by)
    return _booking_to_dict(booking, resource_name, booked_by_name)


async def create_booking(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    booked_by: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Create a new booking after checking for conflicts.
    Raises ValueError if the resource is double-booked.
    """
    resource_id = data["resource_id"]
    start_time = data["start_time"]
    end_time = data["end_time"]

    if end_time <= start_time:
        raise ValueError("End time must be after start time.")

    # Verify the resource exists and belongs to the org
    res_result = await db.execute(
        select(Resource)
        .where(Resource.id == resource_id)
        .where(Resource.organization_id == organization_id)
        .where(Resource.deleted_at.is_(None))
    )
    resource = res_result.scalar_one_or_none()
    if resource is None:
        raise ValueError("Resource not found.")
    if not resource.available:
        raise ValueError("Resource is currently unavailable.")

    # Conflict detection: overlapping non-cancelled bookings
    conflict = await _check_booking_conflict(
        db,
        resource_id=resource_id,
        start_time=start_time,
        end_time=end_time,
        exclude_booking_id=None,
    )
    if conflict:
        raise ValueError(
            "Time conflict: this resource is already booked during the requested period."
        )

    booking = ResourceBooking(
        id=uuid.uuid4(),
        organization_id=organization_id,
        booked_by=booked_by,
        **data,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    resource_name = await _get_resource_name(db, booking.resource_id)
    booked_by_name = await _get_user_name(db, booking.booked_by)
    return _booking_to_dict(booking, resource_name, booked_by_name)


async def update_booking(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    booking_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing booking with conflict detection."""
    result = await db.execute(
        select(ResourceBooking)
        .where(ResourceBooking.id == booking_id)
        .where(ResourceBooking.organization_id == organization_id)
        .where(ResourceBooking.deleted_at.is_(None))
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        return None

    # If times are being updated, check for conflicts
    new_start = data.get("start_time", booking.start_time)
    new_end = data.get("end_time", booking.end_time)
    if new_end <= new_start:
        raise ValueError("End time must be after start time.")

    if "start_time" in data or "end_time" in data:
        conflict = await _check_booking_conflict(
            db,
            resource_id=booking.resource_id,
            start_time=new_start,
            end_time=new_end,
            exclude_booking_id=booking_id,
        )
        if conflict:
            raise ValueError(
                "Time conflict: this resource is already booked during the requested period."
            )

    for key, value in data.items():
        setattr(booking, key, value)

    await db.commit()
    await db.refresh(booking)

    resource_name = await _get_resource_name(db, booking.resource_id)
    booked_by_name = await _get_user_name(db, booking.booked_by)
    return _booking_to_dict(booking, resource_name, booked_by_name)


async def delete_booking(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    booking_id: uuid.UUID,
) -> bool:
    """Soft-delete a booking."""
    result = await db.execute(
        select(ResourceBooking)
        .where(ResourceBooking.id == booking_id)
        .where(ResourceBooking.organization_id == organization_id)
        .where(ResourceBooking.deleted_at.is_(None))
    )
    booking = result.scalar_one_or_none()
    if booking is None:
        return False

    booking.is_deleted = True
    booking.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return True


# ========================================================================
# Stats
# ========================================================================

async def get_stats(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> Dict[str, Any]:
    """Calculate aggregate resource booking stats."""
    now = datetime.now(timezone.utc)

    # Total resources
    res_count = await db.execute(
        select(func.count(Resource.id))
        .where(Resource.organization_id == organization_id)
        .where(Resource.deleted_at.is_(None))
    )
    total_resources = res_count.scalar() or 0

    # Total bookings (non-cancelled)
    bk_count = await db.execute(
        select(func.count(ResourceBooking.id))
        .where(ResourceBooking.organization_id == organization_id)
        .where(ResourceBooking.deleted_at.is_(None))
        .where(ResourceBooking.status != "cancelled")
    )
    total_bookings = bk_count.scalar() or 0

    # Upcoming bookings
    upcoming_count = await db.execute(
        select(func.count(ResourceBooking.id))
        .where(ResourceBooking.organization_id == organization_id)
        .where(ResourceBooking.deleted_at.is_(None))
        .where(ResourceBooking.status != "cancelled")
        .where(ResourceBooking.start_time > now)
    )
    upcoming_bookings = upcoming_count.scalar() or 0

    # Utilization rate: % of resources that have at least 1 upcoming booking
    if total_resources > 0:
        booked_resources = await db.execute(
            select(func.count(func.distinct(ResourceBooking.resource_id)))
            .where(ResourceBooking.organization_id == organization_id)
            .where(ResourceBooking.deleted_at.is_(None))
            .where(ResourceBooking.status != "cancelled")
            .where(ResourceBooking.start_time > now)
        )
        booked_count = booked_resources.scalar() or 0
        utilization_rate = round((booked_count / total_resources) * 100, 1)
    else:
        utilization_rate = 0.0

    return {
        "total_resources": total_resources,
        "total_bookings": total_bookings,
        "upcoming_bookings": upcoming_bookings,
        "utilization_rate": utilization_rate,
    }


# ========================================================================
# Helpers
# ========================================================================

async def _check_booking_conflict(
    db: AsyncSession,
    *,
    resource_id: uuid.UUID,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: Optional[uuid.UUID],
) -> bool:
    """Return True if there is an overlapping non-cancelled booking."""
    query = (
        select(func.count(ResourceBooking.id))
        .where(ResourceBooking.resource_id == resource_id)
        .where(ResourceBooking.deleted_at.is_(None))
        .where(ResourceBooking.status != "cancelled")
        .where(
            and_(
                ResourceBooking.start_time < end_time,
                ResourceBooking.end_time > start_time,
            )
        )
    )
    if exclude_booking_id:
        query = query.where(ResourceBooking.id != exclude_booking_id)

    result = await db.execute(query)
    count = result.scalar() or 0
    return count > 0


async def _count_bookings_for_resource(
    db: AsyncSession,
    resource_id: uuid.UUID,
) -> int:
    """Count non-cancelled bookings for a resource."""
    result = await db.execute(
        select(func.count(ResourceBooking.id))
        .where(ResourceBooking.resource_id == resource_id)
        .where(ResourceBooking.deleted_at.is_(None))
        .where(ResourceBooking.status != "cancelled")
    )
    return result.scalar() or 0


async def _get_resource_name(db: AsyncSession, resource_id: uuid.UUID) -> str:
    """Look up a resource name by ID."""
    result = await db.execute(
        select(Resource.name).where(Resource.id == resource_id)
    )
    name = result.scalar_one_or_none()
    return name or "Unknown Resource"


async def _get_user_name(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Look up a user display name by ID."""
    result = await db.execute(
        select(User.first_name, User.last_name).where(User.id == user_id)
    )
    row = result.one_or_none()
    if row is None:
        return "Unknown User"
    return f"{row[0] or ''} {row[1] or ''}".strip() or "Unknown User"


def _resource_to_dict(resource: Resource, booking_count: int) -> Dict[str, Any]:
    """Convert a Resource model to a response dict."""
    return {
        "id": resource.id,
        "organization_id": resource.organization_id,
        "name": resource.name,
        "resource_type": resource.resource_type,
        "description": resource.description,
        "location": resource.location,
        "capacity": resource.capacity,
        "available": resource.available,
        "booking_count": booking_count,
        "created_at": resource.created_at,
    }


def _booking_to_dict(
    booking: ResourceBooking,
    resource_name: str,
    booked_by_name: str,
) -> Dict[str, Any]:
    """Convert a ResourceBooking model to a response dict."""
    return {
        "id": booking.id,
        "resource_id": booking.resource_id,
        "resource_name": resource_name,
        "booked_by": booking.booked_by,
        "booked_by_name": booked_by_name,
        "title": booking.title,
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "notes": booking.notes,
        "status": booking.status,
        "created_at": booking.created_at,
    }

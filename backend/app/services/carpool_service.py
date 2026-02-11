"""
Camp Connect - Carpool Service
Business logic for carpool coordination (carpools, riders, stats).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.carpool import Carpool, CarpoolRider


# ---------------------------------------------------------------------------
# Carpool CRUD
# ---------------------------------------------------------------------------


async def list_carpools(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List all carpools for an organization."""
    query = (
        select(Carpool)
        .options(selectinload(Carpool.riders))
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )

    if search:
        like_pattern = f"%{search}%"
        query = query.where(
            Carpool.driver_name.ilike(like_pattern)
            | Carpool.pickup_location.ilike(like_pattern)
        )

    query = query.order_by(Carpool.created_at.desc())
    result = await db.execute(query)
    carpools = result.scalars().unique().all()

    return [_carpool_to_dict(c) for c in carpools]


async def get_carpool(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    carpool_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single carpool by ID."""
    result = await db.execute(
        select(Carpool)
        .options(selectinload(Carpool.riders))
        .where(Carpool.id == carpool_id)
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )
    carpool = result.scalar_one_or_none()
    if carpool is None:
        return None
    return _carpool_to_dict(carpool)


async def create_carpool(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new carpool."""
    carpool = Carpool(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(carpool)
    await db.commit()
    await db.refresh(carpool, attribute_names=["riders"])
    return _carpool_to_dict(carpool)


async def update_carpool(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    carpool_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing carpool."""
    result = await db.execute(
        select(Carpool)
        .options(selectinload(Carpool.riders))
        .where(Carpool.id == carpool_id)
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )
    carpool = result.scalar_one_or_none()
    if carpool is None:
        return None

    for key, value in data.items():
        setattr(carpool, key, value)

    await db.commit()
    await db.refresh(carpool, attribute_names=["riders"])
    return _carpool_to_dict(carpool)


async def delete_carpool(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    carpool_id: uuid.UUID,
) -> bool:
    """Soft-delete a carpool."""
    result = await db.execute(
        select(Carpool)
        .where(Carpool.id == carpool_id)
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )
    carpool = result.scalar_one_or_none()
    if carpool is None:
        return False

    carpool.is_deleted = True
    carpool.deleted_at = datetime.utcnow()
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Rider CRUD
# ---------------------------------------------------------------------------


async def list_riders(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    carpool_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List all riders for a carpool."""
    # Verify carpool belongs to org
    carpool_check = await db.execute(
        select(Carpool.id)
        .where(Carpool.id == carpool_id)
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )
    if carpool_check.scalar_one_or_none() is None:
        return []

    result = await db.execute(
        select(CarpoolRider)
        .where(CarpoolRider.carpool_id == carpool_id)
        .order_by(CarpoolRider.created_at.desc())
    )
    riders = result.scalars().all()
    return [_rider_to_dict(r) for r in riders]


async def add_rider(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    carpool_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Add a rider to a carpool."""
    # Verify carpool belongs to org and has capacity
    result = await db.execute(
        select(Carpool)
        .options(selectinload(Carpool.riders))
        .where(Carpool.id == carpool_id)
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )
    carpool = result.scalar_one_or_none()
    if carpool is None:
        return None

    # Check seat capacity
    current_riders = len(carpool.riders)
    if current_riders >= carpool.seats_available:
        return None  # No seats available

    rider = CarpoolRider(
        id=uuid.uuid4(),
        carpool_id=carpool_id,
        **data,
    )
    db.add(rider)
    await db.commit()
    await db.refresh(rider)
    return _rider_to_dict(rider)


async def update_rider(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    rider_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update a rider (e.g. confirm status)."""
    result = await db.execute(
        select(CarpoolRider)
        .join(Carpool, CarpoolRider.carpool_id == Carpool.id)
        .where(CarpoolRider.id == rider_id)
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )
    rider = result.scalar_one_or_none()
    if rider is None:
        return None

    for key, value in data.items():
        setattr(rider, key, value)

    await db.commit()
    await db.refresh(rider)
    return _rider_to_dict(rider)


async def remove_rider(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    rider_id: uuid.UUID,
) -> bool:
    """Remove a rider from a carpool (hard delete)."""
    result = await db.execute(
        select(CarpoolRider)
        .join(Carpool, CarpoolRider.carpool_id == Carpool.id)
        .where(CarpoolRider.id == rider_id)
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )
    rider = result.scalar_one_or_none()
    if rider is None:
        return False

    await db.delete(rider)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


async def get_stats(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> Dict[str, Any]:
    """Get aggregated carpool statistics for the organization."""
    # Count total carpools
    total_result = await db.execute(
        select(func.count(Carpool.id))
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )
    total = total_result.scalar() or 0

    # Load all carpools with riders to compute active and occupancy
    carpools_result = await db.execute(
        select(Carpool)
        .options(selectinload(Carpool.riders))
        .where(Carpool.organization_id == organization_id)
        .where(Carpool.deleted_at.is_(None))
    )
    carpools = carpools_result.scalars().unique().all()

    total_riders = 0
    active = 0
    total_occupancy = 0.0

    for cp in carpools:
        rider_count = len(cp.riders)
        total_riders += rider_count
        if rider_count > 0:
            active += 1
            total_occupancy += rider_count / cp.seats_available if cp.seats_available > 0 else 0

    avg_occupancy = (total_occupancy / active * 100) if active > 0 else 0.0

    return {
        "total": total,
        "active": active,
        "total_riders": total_riders,
        "avg_occupancy": round(avg_occupancy, 1),
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _carpool_to_dict(carpool: Carpool) -> Dict[str, Any]:
    """Convert a Carpool model to a response dict."""
    riders = [_rider_to_dict(r) for r in carpool.riders]
    return {
        "id": carpool.id,
        "org_id": carpool.organization_id,
        "driver_name": carpool.driver_name,
        "phone": carpool.phone,
        "email": carpool.email,
        "pickup_location": carpool.pickup_location,
        "dropoff_location": carpool.dropoff_location,
        "departure_time": carpool.departure_time,
        "seats_available": carpool.seats_available,
        "days": carpool.days or [],
        "notes": carpool.notes,
        "rider_count": len(riders),
        "riders": riders,
        "created_at": carpool.created_at,
    }


def _rider_to_dict(rider: CarpoolRider) -> Dict[str, Any]:
    """Convert a CarpoolRider model to a response dict."""
    return {
        "id": rider.id,
        "carpool_id": rider.carpool_id,
        "camper_name": rider.camper_name,
        "parent_name": rider.parent_name,
        "status": rider.status,
        "created_at": rider.created_at,
    }

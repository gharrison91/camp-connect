"""
Camp Connect - Cabin Service
Business logic for cabin CRUD and cabin-bunk relationships.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.bunk import Cabin, Bunk


async def list_cabins(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    include_inactive: bool = False,
) -> List[Dict[str, Any]]:
    """List cabins for an organization with bunk counts."""
    query = (
        select(Cabin)
        .options(selectinload(Cabin.bunks))
        .where(Cabin.organization_id == organization_id)
        .where(Cabin.deleted_at.is_(None))
    )
    if not include_inactive:
        query = query.where(Cabin.is_active.is_(True))
    query = query.order_by(Cabin.name)

    result = await db.execute(query)
    cabins = result.scalars().all()
    return [_cabin_to_dict(c) for c in cabins]


async def get_cabin(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    cabin_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single cabin by ID with its bunks."""
    result = await db.execute(
        select(Cabin)
        .options(
            selectinload(Cabin.bunks).selectinload(Bunk.counselor),
        )
        .where(Cabin.id == cabin_id)
        .where(Cabin.organization_id == organization_id)
        .where(Cabin.deleted_at.is_(None))
    )
    cabin = result.scalar_one_or_none()
    if cabin is None:
        return None
    return _cabin_with_bunks_to_dict(cabin)


async def create_cabin(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new cabin."""
    cabin = Cabin(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(cabin)
    await db.commit()
    await db.refresh(cabin, ["bunks"])
    return _cabin_to_dict(cabin)


async def update_cabin(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    cabin_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing cabin."""
    result = await db.execute(
        select(Cabin)
        .options(selectinload(Cabin.bunks))
        .where(Cabin.id == cabin_id)
        .where(Cabin.organization_id == organization_id)
        .where(Cabin.deleted_at.is_(None))
    )
    cabin = result.scalar_one_or_none()
    if cabin is None:
        return None

    for key, value in data.items():
        setattr(cabin, key, value)

    await db.commit()
    await db.refresh(cabin, ["bunks"])
    return _cabin_to_dict(cabin)


async def delete_cabin(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    cabin_id: uuid.UUID,
) -> bool:
    """Soft-delete a cabin. Bunks inside become unassigned (cabin_id=null)."""
    result = await db.execute(
        select(Cabin)
        .options(selectinload(Cabin.bunks))
        .where(Cabin.id == cabin_id)
        .where(Cabin.organization_id == organization_id)
        .where(Cabin.deleted_at.is_(None))
    )
    cabin = result.scalar_one_or_none()
    if cabin is None:
        return False

    # Detach bunks from the cabin before soft-deleting
    for bunk in cabin.bunks:
        if bunk.deleted_at is None:
            bunk.cabin_id = None

    cabin.is_deleted = True
    cabin.deleted_at = datetime.utcnow()
    await db.commit()
    return True


async def list_cabin_bunks(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    cabin_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List all bunks belonging to a specific cabin."""
    result = await db.execute(
        select(Bunk)
        .options(selectinload(Bunk.counselor))
        .where(Bunk.cabin_id == cabin_id)
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
        .order_by(Bunk.name)
    )
    bunks = result.scalars().all()
    return [_bunk_summary(b) for b in bunks]


async def assign_bunk_to_cabin(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    cabin_id: uuid.UUID,
    bunk_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Assign an existing bunk to a cabin."""
    # Verify cabin exists
    cabin_result = await db.execute(
        select(Cabin)
        .where(Cabin.id == cabin_id)
        .where(Cabin.organization_id == organization_id)
        .where(Cabin.deleted_at.is_(None))
    )
    if cabin_result.scalar_one_or_none() is None:
        raise ValueError("Cabin not found")

    # Load bunk
    bunk_result = await db.execute(
        select(Bunk)
        .options(selectinload(Bunk.counselor))
        .where(Bunk.id == bunk_id)
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
    )
    bunk = bunk_result.scalar_one_or_none()
    if bunk is None:
        raise ValueError("Bunk not found")

    bunk.cabin_id = cabin_id
    await db.commit()
    await db.refresh(bunk, ["counselor"])
    return _bunk_summary(bunk)


async def unassign_bunk_from_cabin(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    bunk_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Remove a bunk from its cabin (set cabin_id to null)."""
    bunk_result = await db.execute(
        select(Bunk)
        .options(selectinload(Bunk.counselor))
        .where(Bunk.id == bunk_id)
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
    )
    bunk = bunk_result.scalar_one_or_none()
    if bunk is None:
        return None

    bunk.cabin_id = None
    await db.commit()
    await db.refresh(bunk, ["counselor"])
    return _bunk_summary(bunk)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _bunk_summary(bunk: Bunk) -> Dict[str, Any]:
    """Convert bunk to a summary dict."""
    return {
        "id": bunk.id,
        "name": bunk.name,
        "capacity": bunk.capacity,
        "gender_restriction": bunk.gender_restriction,
        "min_age": bunk.min_age,
        "max_age": bunk.max_age,
        "location": bunk.location,
        "counselor_user_id": bunk.counselor_user_id,
        "counselor_name": (
            f"{bunk.counselor.first_name} {bunk.counselor.last_name}"
            if bunk.counselor
            else None
        ),
        "created_at": bunk.created_at,
    }


def _cabin_to_dict(cabin: Cabin) -> Dict[str, Any]:
    """Convert cabin to a response dict with bunk count."""
    active_bunks = [b for b in cabin.bunks if b.deleted_at is None]
    return {
        "id": cabin.id,
        "name": cabin.name,
        "description": cabin.description,
        "location": cabin.location,
        "total_capacity": cabin.total_capacity,
        "gender_restriction": cabin.gender_restriction,
        "is_active": cabin.is_active,
        "bunk_count": len(active_bunks),
        "created_at": cabin.created_at,
    }


def _cabin_with_bunks_to_dict(cabin: Cabin) -> Dict[str, Any]:
    """Convert cabin to a response dict with full bunk details."""
    active_bunks = [b for b in cabin.bunks if b.deleted_at is None]
    return {
        "id": cabin.id,
        "name": cabin.name,
        "description": cabin.description,
        "location": cabin.location,
        "total_capacity": cabin.total_capacity,
        "gender_restriction": cabin.gender_restriction,
        "is_active": cabin.is_active,
        "bunks": [_bunk_summary(b) for b in active_bunks],
        "created_at": cabin.created_at,
    }

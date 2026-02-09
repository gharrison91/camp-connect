"""
Camp Connect - Activity Service
Business logic for activity management.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity


async def list_activities(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List activities for an organization with optional filters."""
    query = (
        select(Activity)
        .where(Activity.organization_id == organization_id)
        .where(Activity.deleted_at.is_(None))
    )

    if category:
        query = query.where(Activity.category == category)

    if is_active is not None:
        query = query.where(Activity.is_active == is_active)

    if search:
        query = query.where(Activity.name.ilike(f"%{search}%"))

    query = query.order_by(Activity.name)
    result = await db.execute(query)
    activities = result.scalars().all()

    return [_activity_to_dict(a) for a in activities]


async def get_activity(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    activity_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single activity by ID."""
    result = await db.execute(
        select(Activity)
        .where(Activity.id == activity_id)
        .where(Activity.organization_id == organization_id)
        .where(Activity.deleted_at.is_(None))
    )
    activity = result.scalar_one_or_none()
    if activity is None:
        return None
    return _activity_to_dict(activity)


async def create_activity(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new activity."""
    activity = Activity(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return _activity_to_dict(activity)


async def update_activity(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    activity_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing activity."""
    result = await db.execute(
        select(Activity)
        .where(Activity.id == activity_id)
        .where(Activity.organization_id == organization_id)
        .where(Activity.deleted_at.is_(None))
    )
    activity = result.scalar_one_or_none()
    if activity is None:
        return None

    for key, value in data.items():
        setattr(activity, key, value)

    await db.commit()
    await db.refresh(activity)
    return _activity_to_dict(activity)


async def delete_activity(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    activity_id: uuid.UUID,
) -> bool:
    """Soft-delete an activity."""
    result = await db.execute(
        select(Activity)
        .where(Activity.id == activity_id)
        .where(Activity.organization_id == organization_id)
        .where(Activity.deleted_at.is_(None))
    )
    activity = result.scalar_one_or_none()
    if activity is None:
        return False

    activity.is_deleted = True
    activity.deleted_at = datetime.utcnow()
    await db.commit()
    return True


def _activity_to_dict(activity: Activity) -> Dict[str, Any]:
    """Convert an Activity model to a response dict."""
    return {
        "id": activity.id,
        "name": activity.name,
        "description": activity.description,
        "category": activity.category,
        "location": activity.location,
        "capacity": activity.capacity,
        "min_age": activity.min_age,
        "max_age": activity.max_age,
        "duration_minutes": activity.duration_minutes,
        "staff_required": activity.staff_required,
        "equipment_needed": activity.equipment_needed,
        "is_active": activity.is_active,
        "created_at": activity.created_at,
    }

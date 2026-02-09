"""
Camp Connect - Event Bunk Config Service
Business logic for per-event bunk configuration (active status, capacity, counselors).
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event_bunk_config import EventBunkConfig


# ---------------------------------------------------------------------------
# Event Bunk Config CRUD
# ---------------------------------------------------------------------------


async def list_event_bunk_configs(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List all bunk configurations for an event."""
    query = (
        select(EventBunkConfig)
        .options(selectinload(EventBunkConfig.bunk))
        .where(EventBunkConfig.organization_id == organization_id)
        .where(EventBunkConfig.event_id == event_id)
        .order_by(EventBunkConfig.created_at)
    )
    result = await db.execute(query)
    configs = result.scalars().all()

    return [_config_to_dict(c) for c in configs]


async def create_event_bunk_config(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new event-specific bunk configuration."""
    config = EventBunkConfig(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(config)
    await db.commit()
    await db.refresh(config, ["bunk"])
    return _config_to_dict(config)


async def update_event_bunk_config(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    config_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing event bunk configuration."""
    result = await db.execute(
        select(EventBunkConfig)
        .options(selectinload(EventBunkConfig.bunk))
        .where(EventBunkConfig.id == config_id)
        .where(EventBunkConfig.organization_id == organization_id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        return None

    for key, value in data.items():
        setattr(config, key, value)

    await db.commit()
    await db.refresh(config, ["bunk"])
    return _config_to_dict(config)


async def delete_event_bunk_config(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    config_id: uuid.UUID,
) -> bool:
    """Delete an event bunk configuration (hard delete)."""
    result = await db.execute(
        select(EventBunkConfig)
        .where(EventBunkConfig.id == config_id)
        .where(EventBunkConfig.organization_id == organization_id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        return False

    await db.delete(config)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _config_to_dict(config: EventBunkConfig) -> Dict[str, Any]:
    """Convert an EventBunkConfig model to a response dict."""
    bunk = config.bunk
    return {
        "id": config.id,
        "event_id": config.event_id,
        "bunk_id": config.bunk_id,
        "bunk_name": bunk.name if bunk else None,
        "is_active": config.is_active,
        "event_capacity": config.event_capacity,
        "counselor_user_ids": config.counselor_user_ids,
        "notes": config.notes,
        "created_at": config.created_at,
    }

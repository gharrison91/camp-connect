"""
Camp Connect - Organization Service
CRUD operations for organization (tenant) management.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization


async def get_organization(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> Optional[Organization]:
    """Get an organization by ID."""
    result = await db.execute(
        select(Organization).where(Organization.id == organization_id)
    )
    return result.scalar_one_or_none()


async def update_organization(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Organization:
    """
    Update organization details.
    Only updates fields that are provided (not None).
    """
    result = await db.execute(
        select(Organization).where(Organization.id == organization_id)
    )
    org = result.scalar_one_or_none()
    if org is None:
        raise ValueError("Organization not found")

    for key, value in data.items():
        if value is not None:
            setattr(org, key, value)

    await db.commit()
    await db.refresh(org)
    return org

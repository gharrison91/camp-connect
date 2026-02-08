"""
Camp Connect - Settings API Endpoints
Get and update organization settings (JSONB).
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.models.organization import Organization

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("")
async def get_settings(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current organization's settings.

    Returns the org settings JSONB which includes:
    - tax_rate, deposit config, notification defaults, etc.
    - Also returns enabled_modules and subscription_tier for context.
    """
    result = await db.execute(
        select(Organization)
        .where(Organization.id == current_user["organization_id"])
    )
    org = result.scalar_one_or_none()
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return {
        "settings": org.settings or {},
        "enabled_modules": org.enabled_modules or ["core"],
        "subscription_tier": org.subscription_tier or "free",
    }


@router.put("")
async def update_settings(
    body: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update the organization's settings.
    Requires core.settings.manage permission.

    Accepts a JSON body that will be merged into the existing settings.
    To update specific keys, pass only those keys.
    To remove a key, set it to null.
    """
    result = await db.execute(
        select(Organization)
        .where(Organization.id == current_user["organization_id"])
    )
    org = result.scalar_one_or_none()
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Handle specific top-level fields
    if "enabled_modules" in body:
        modules = body.pop("enabled_modules")
        if isinstance(modules, list):
            # Ensure "core" is always included
            if "core" not in modules:
                modules.insert(0, "core")
            org.enabled_modules = modules

    # Merge remaining fields into settings JSONB
    current_settings = org.settings or {}
    for key, value in body.items():
        if value is None:
            current_settings.pop(key, None)  # Remove key if null
        else:
            current_settings[key] = value

    org.settings = current_settings

    await db.commit()
    await db.refresh(org)

    return {
        "settings": org.settings or {},
        "enabled_modules": org.enabled_modules or ["core"],
        "subscription_tier": org.subscription_tier or "free",
    }

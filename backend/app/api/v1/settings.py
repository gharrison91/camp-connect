"""
Camp Connect - Settings API Endpoints
Get and update organization settings (JSONB).
"""

from __future__ import annotations

from typing import Any, Dict, List

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


@router.get("/developer-reference")
async def get_developer_reference(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get developer reference data for the organization.
    Returns all entity IDs and names for API integration reference.
    Requires core.settings.manage permission.
    """
    from app.models.activity import Activity
    from app.models.bunk import Bunk
    from app.models.event import Event
    from app.models.form_builder import FormTemplate
    from app.models.location import Location
    from app.models.role import Role

    org_id = current_user["organization_id"]

    # Helper to serialize rows with id, name, created_at
    def serialize(rows: List[Any]) -> List[Dict[str, Any]]:
        results = []
        for row in rows:
            item: Dict[str, Any] = {
                "id": str(row.id),
                "name": row.name or "",
            }
            if hasattr(row, "created_at") and row.created_at is not None:
                item["created_at"] = row.created_at.isoformat()
            else:
                item["created_at"] = None
            results.append(item)
        return results

    # Events (soft-deletable)
    events_result = await db.execute(
        select(Event)
        .where(Event.organization_id == org_id, Event.is_deleted == False)
        .order_by(Event.name)
    )
    events = serialize(events_result.scalars().all())

    # Activities (soft-deletable)
    activities_result = await db.execute(
        select(Activity)
        .where(Activity.organization_id == org_id, Activity.is_deleted == False)
        .order_by(Activity.name)
    )
    activities = serialize(activities_result.scalars().all())

    # Bunks (soft-deletable)
    bunks_result = await db.execute(
        select(Bunk)
        .where(Bunk.organization_id == org_id, Bunk.is_deleted == False)
        .order_by(Bunk.name)
    )
    bunks = serialize(bunks_result.scalars().all())

    # Locations (soft-deletable)
    locations_result = await db.execute(
        select(Location)
        .where(Location.organization_id == org_id, Location.is_deleted == False)
        .order_by(Location.name)
    )
    locations = serialize(locations_result.scalars().all())

    # Roles (no soft delete)
    roles_result = await db.execute(
        select(Role)
        .where(Role.organization_id == org_id)
        .order_by(Role.name)
    )
    roles = serialize(roles_result.scalars().all())

    # Form Templates (no soft delete)
    forms_result = await db.execute(
        select(FormTemplate)
        .where(FormTemplate.organization_id == org_id)
        .order_by(FormTemplate.name)
    )
    form_templates = serialize(forms_result.scalars().all())

    return {
        "organization_id": str(org_id),
        "api_base_url": "https://camp-connect-api.onrender.com/api/v1",
        "entities": {
            "events": events,
            "activities": activities,
            "bunks": bunks,
            "locations": locations,
            "roles": roles,
            "form_templates": form_templates,
        },
    }

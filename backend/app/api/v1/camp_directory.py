"""
Camp Connect - Camp Directory API Endpoints
Admin profile management + public directory browsing.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.camp_profile import CampProfileCreate, CampProfileUpdate
from app.services import camp_profile_service

router = APIRouter(tags=["camp-directory"])


# ─── Admin endpoints (auth required) ─────────────────────────


@router.get("/camp-profile")
async def get_own_camp_profile(
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get the current organization's camp directory profile."""
    profile = await camp_profile_service.get_own_profile(
        db, organization_id=current_user["organization_id"]
    )
    if profile is None:
        return {"profile": None}
    return profile


@router.put("/camp-profile")
async def update_camp_profile(
    body: CampProfileUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Create or update the organization's camp directory profile."""
    data = body.model_dump(exclude_unset=True)
    # If creating for first time and no name given, use org name
    if not data.get("name"):
        from app.models.organization import Organization
        from sqlalchemy import select

        org_result = await db.execute(
            select(Organization).where(Organization.id == current_user["organization_id"])
        )
        org = org_result.scalar_one_or_none()
        if org:
            data.setdefault("name", org.name)
        else:
            data.setdefault("name", "My Camp")

    return await camp_profile_service.upsert_profile(
        db,
        organization_id=current_user["organization_id"],
        data=data,
    )


@router.post("/camp-profile/publish")
async def publish_camp_profile(
    publish: bool = True,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Publish or unpublish the camp profile to the public directory."""
    result = await camp_profile_service.publish_profile(
        db,
        organization_id=current_user["organization_id"],
        publish=publish,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camp profile not found. Create one first.",
        )
    return result


# ─── Public endpoints (no auth) ──────────────────────────────


@router.get("/directory/featured")
async def get_featured_camps(
    limit: int = Query(default=6, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Get featured camps for the directory homepage."""
    return await camp_profile_service.get_featured_profiles(db, limit=limit)


@router.get("/directory/search")
async def search_camps(
    q: Optional[str] = Query(default=None),
    camp_type: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    age_min: Optional[int] = Query(default=None),
    age_max: Optional[int] = Query(default=None),
    price_min: Optional[float] = Query(default=None),
    price_max: Optional[float] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=24, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search camps in the public directory."""
    return await camp_profile_service.list_published_profiles(
        db,
        q=q,
        camp_type=camp_type,
        state=state,
        age_min=age_min,
        age_max=age_max,
        price_min=price_min,
        price_max=price_max,
        skip=skip,
        limit=limit,
    )


@router.get("/directory")
async def list_directory(
    q: Optional[str] = Query(default=None),
    camp_type: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    age_min: Optional[int] = Query(default=None),
    age_max: Optional[int] = Query(default=None),
    price_min: Optional[float] = Query(default=None),
    price_max: Optional[float] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=24, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List published camps in the directory with optional filters."""
    return await camp_profile_service.list_published_profiles(
        db,
        q=q,
        camp_type=camp_type,
        state=state,
        age_min=age_min,
        age_max=age_max,
        price_min=price_min,
        price_max=price_max,
        skip=skip,
        limit=limit,
    )


@router.get("/directory/{slug}")
async def get_camp_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a published camp profile by its URL slug."""
    profile = await camp_profile_service.get_profile_by_slug(db, slug=slug)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camp not found",
        )
    return profile

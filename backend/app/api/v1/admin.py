"""
Camp Connect - Super Admin API Endpoints
Platform-level admin endpoints for managing all organizations, users,
subscriptions, and platform analytics.
Only accessible by users with platform_role='platform_admin'.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select, case, literal_column
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_platform_admin
from app.database import get_db
from app.models.organization import Organization
from app.models.user import User
from app.models.camper import Camper
from app.models.event import Event
from app.models.registration import Registration
from app.models.location import Location

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Super Admin"])


# ─── Response Models ─────────────────────────────────────────────────

class OrgSummary(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    subscription_tier: str
    user_count: int
    camper_count: int
    event_count: int
    registration_count: int
    location: Optional[str] = None
    created_at: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class OrgListResponse(BaseModel):
    organizations: List[OrgSummary]
    total: int
    page: int
    page_size: int


class PlatformStatsResponse(BaseModel):
    total_organizations: int
    total_users: int
    total_campers: int
    total_events: int
    total_registrations: int
    active_organizations: int
    orgs_by_tier: Dict[str, int]
    recent_signups: int  # orgs in last 30 days
    growth_rate: float  # % change in orgs over last 30 days


class OrgDetailResponse(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    domain: Optional[str] = None
    subscription_tier: str
    enabled_modules: list
    settings: dict
    marketplace_visible: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    users: List[Dict[str, Any]]
    locations: List[Dict[str, Any]]
    stats: Dict[str, int]


class OrgUpdateRequest(BaseModel):
    subscription_tier: Optional[str] = None
    enabled_modules: Optional[list] = None
    marketplace_visible: Optional[bool] = None
    is_suspended: Optional[bool] = None


class OrgUserSummary(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role_name: str
    is_active: bool
    platform_role: Optional[str] = None
    created_at: Optional[str] = None


# ─── Platform Dashboard Stats ────────────────────────────────────────

@router.get(
    "/stats",
    response_model=PlatformStatsResponse,
)
async def get_platform_stats(
    current_user: Dict[str, Any] = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide statistics for the super admin dashboard."""
    try:
        # Total orgs
        org_count_result = await db.execute(
            select(func.count(Organization.id)).where(
                Organization.deleted_at.is_(None),
            )
        )
        total_organizations = org_count_result.scalar() or 0

        # Total users
        user_count_result = await db.execute(
            select(func.count(User.id)).where(User.deleted_at.is_(None))
        )
        total_users = user_count_result.scalar() or 0

        # Total campers
        camper_count_result = await db.execute(
            select(func.count(Camper.id)).where(Camper.deleted_at.is_(None))
        )
        total_campers = camper_count_result.scalar() or 0

        # Total events
        event_count_result = await db.execute(
            select(func.count(Event.id)).where(Event.deleted_at.is_(None))
        )
        total_events = event_count_result.scalar() or 0

        # Total registrations
        reg_count_result = await db.execute(
            select(func.count(Registration.id)).where(
                Registration.deleted_at.is_(None)
            )
        )
        total_registrations = reg_count_result.scalar() or 0

        # Active organizations (have at least 1 active user)
        active_orgs_result = await db.execute(
            select(func.count(func.distinct(User.organization_id))).where(
                User.is_active.is_(True),
                User.deleted_at.is_(None),
            )
        )
        active_organizations = active_orgs_result.scalar() or 0

        # Orgs by tier
        tier_result = await db.execute(
            select(
                Organization.subscription_tier,
                func.count(Organization.id),
            )
            .where(Organization.deleted_at.is_(None))
            .group_by(Organization.subscription_tier)
        )
        orgs_by_tier = {row[0]: row[1] for row in tier_result.all()}

        # Recent signups (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_result = await db.execute(
            select(func.count(Organization.id)).where(
                Organization.deleted_at.is_(None),
                Organization.created_at >= thirty_days_ago,
            )
        )
        recent_signups = recent_result.scalar() or 0

        # Growth rate
        sixty_days_ago = datetime.now(timezone.utc) - timedelta(days=60)
        prev_result = await db.execute(
            select(func.count(Organization.id)).where(
                Organization.deleted_at.is_(None),
                Organization.created_at >= sixty_days_ago,
                Organization.created_at < thirty_days_ago,
            )
        )
        prev_signups = prev_result.scalar() or 0
        growth_rate = 0.0
        if prev_signups > 0:
            growth_rate = round(((recent_signups - prev_signups) / prev_signups) * 100, 1)

        return PlatformStatsResponse(
            total_organizations=total_organizations,
            total_users=total_users,
            total_campers=total_campers,
            total_events=total_events,
            total_registrations=total_registrations,
            active_organizations=active_organizations,
            orgs_by_tier=orgs_by_tier,
            recent_signups=recent_signups,
            growth_rate=growth_rate,
        )

    except Exception as e:
        logger.error(f"Platform stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load platform stats: {e}")


# ─── Organization List ───────────────────────────────────────────────

@router.get(
    "/organizations",
    response_model=OrgListResponse,
)
async def list_organizations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    current_user: Dict[str, Any] = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all organizations with counts and filtering."""
    try:
        # Base query
        base_q = select(Organization).where(Organization.deleted_at.is_(None))

        if search:
            base_q = base_q.where(
                Organization.name.ilike(f"%{search}%")
                | Organization.slug.ilike(f"%{search}%")
            )
        if tier:
            base_q = base_q.where(Organization.subscription_tier == tier)

        # Count total
        count_q = select(func.count()).select_from(base_q.subquery())
        total = (await db.execute(count_q)).scalar() or 0

        # Sort
        sort_col = getattr(Organization, sort_by, Organization.created_at)
        if sort_dir == "asc":
            base_q = base_q.order_by(sort_col.asc())
        else:
            base_q = base_q.order_by(sort_col.desc())

        # Paginate
        offset = (page - 1) * page_size
        base_q = base_q.offset(offset).limit(page_size)

        result = await db.execute(base_q)
        orgs = result.scalars().all()

        # Build summaries with counts
        org_summaries: List[OrgSummary] = []
        for org in orgs:
            # User count
            user_ct = (
                await db.execute(
                    select(func.count(User.id)).where(
                        User.organization_id == org.id,
                        User.deleted_at.is_(None),
                    )
                )
            ).scalar() or 0

            # Camper count
            camper_ct = (
                await db.execute(
                    select(func.count(Camper.id)).where(
                        Camper.organization_id == org.id,
                        Camper.deleted_at.is_(None),
                    )
                )
            ).scalar() or 0

            # Event count
            event_ct = (
                await db.execute(
                    select(func.count(Event.id)).where(
                        Event.organization_id == org.id,
                        Event.deleted_at.is_(None),
                    )
                )
            ).scalar() or 0

            # Registration count
            reg_ct = (
                await db.execute(
                    select(func.count(Registration.id)).where(
                        Registration.organization_id == org.id,
                        Registration.deleted_at.is_(None),
                    )
                )
            ).scalar() or 0

            # Primary location
            loc_result = await db.execute(
                select(Location)
                .where(
                    Location.organization_id == org.id,
                    Location.deleted_at.is_(None),
                )
                .order_by(Location.is_primary.desc())
                .limit(1)
            )
            loc = loc_result.scalar_one_or_none()
            location_str = None
            if loc:
                parts = [loc.city, loc.state]
                location_str = ", ".join(p for p in parts if p)

            org_summaries.append(
                OrgSummary(
                    id=str(org.id),
                    name=org.name,
                    slug=org.slug,
                    logo_url=org.logo_url,
                    subscription_tier=org.subscription_tier,
                    user_count=user_ct,
                    camper_count=camper_ct,
                    event_count=event_ct,
                    registration_count=reg_ct,
                    location=location_str,
                    created_at=org.created_at.isoformat() if org.created_at else None,
                    is_active=org.deleted_at is None,
                )
            )

        return OrgListResponse(
            organizations=org_summaries,
            total=total,
            page=page,
            page_size=page_size,
        )

    except Exception as e:
        logger.error(f"List organizations error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list organizations: {e}")


# ─── Organization Detail ─────────────────────────────────────────────

@router.get(
    "/organizations/{org_id}",
    response_model=OrgDetailResponse,
)
async def get_organization_detail(
    org_id: str,
    current_user: Dict[str, Any] = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed info about a specific organization."""
    result = await db.execute(
        select(Organization).where(
            Organization.id == org_id,
            Organization.deleted_at.is_(None),
        )
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Users
    users_result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(
            User.organization_id == org.id,
            User.deleted_at.is_(None),
        )
        .order_by(User.created_at.desc())
    )
    users = users_result.scalars().all()
    user_list = [
        {
            "id": str(u.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role_name": u.role.name if u.role else "Unknown",
            "is_active": u.is_active,
            "platform_role": u.platform_role,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]

    # Locations
    loc_result = await db.execute(
        select(Location).where(
            Location.organization_id == org.id,
            Location.deleted_at.is_(None),
        )
    )
    locations = loc_result.scalars().all()
    location_list = [
        {
            "id": str(l.id),
            "name": l.name,
            "address": l.address,
            "city": l.city,
            "state": l.state,
            "zip_code": l.zip_code,
            "is_primary": l.is_primary,
        }
        for l in locations
    ]

    # Stats
    camper_ct = (
        await db.execute(
            select(func.count(Camper.id)).where(
                Camper.organization_id == org.id,
                Camper.deleted_at.is_(None),
            )
        )
    ).scalar() or 0

    event_ct = (
        await db.execute(
            select(func.count(Event.id)).where(
                Event.organization_id == org.id,
                Event.deleted_at.is_(None),
            )
        )
    ).scalar() or 0

    reg_ct = (
        await db.execute(
            select(func.count(Registration.id)).where(
                Registration.organization_id == org.id,
                Registration.deleted_at.is_(None),
            )
        )
    ).scalar() or 0

    return OrgDetailResponse(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        logo_url=org.logo_url,
        domain=org.domain,
        subscription_tier=org.subscription_tier,
        enabled_modules=org.enabled_modules or [],
        settings=org.settings or {},
        marketplace_visible=org.marketplace_visible,
        created_at=org.created_at.isoformat() if org.created_at else None,
        updated_at=org.updated_at.isoformat() if org.updated_at else None,
        users=user_list,
        locations=location_list,
        stats={
            "campers": camper_ct,
            "events": event_ct,
            "registrations": reg_ct,
            "users": len(users),
        },
    )


# ─── Update Organization ─────────────────────────────────────────────

@router.put(
    "/organizations/{org_id}",
)
async def update_organization(
    org_id: str,
    body: OrgUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an organization's subscription, modules, or status."""
    result = await db.execute(
        select(Organization).where(
            Organization.id == org_id,
            Organization.deleted_at.is_(None),
        )
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if body.subscription_tier is not None:
        org.subscription_tier = body.subscription_tier
    if body.enabled_modules is not None:
        org.enabled_modules = body.enabled_modules
    if body.marketplace_visible is not None:
        org.marketplace_visible = body.marketplace_visible
    if body.is_suspended is not None:
        # Suspend all users in the org
        users_result = await db.execute(
            select(User).where(
                User.organization_id == org.id,
                User.deleted_at.is_(None),
            )
        )
        users = users_result.scalars().all()
        for u in users:
            u.is_active = not body.is_suspended

    await db.commit()
    return {"message": "Organization updated successfully"}


# ─── Impersonate Organization ────────────────────────────────────────

@router.post(
    "/organizations/{org_id}/impersonate",
)
async def impersonate_organization(
    org_id: str,
    current_user: Dict[str, Any] = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get impersonation token/context for accessing an organization's data.
    Returns the org's details so the admin can view their system.
    """
    result = await db.execute(
        select(Organization).where(
            Organization.id == org_id,
            Organization.deleted_at.is_(None),
        )
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "organization_id": str(org.id),
        "organization_name": org.name,
        "organization_slug": org.slug,
        "message": f"Now viewing as {org.name}",
    }


# ─── Platform Users ──────────────────────────────────────────────────

@router.get(
    "/users",
)
async def list_platform_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users across all organizations."""
    base_q = (
        select(User)
        .options(selectinload(User.role), selectinload(User.organization))
        .where(User.deleted_at.is_(None))
    )

    if search:
        base_q = base_q.where(
            User.email.ilike(f"%{search}%")
            | User.first_name.ilike(f"%{search}%")
            | User.last_name.ilike(f"%{search}%")
        )

    # Count
    count_q = select(func.count()).select_from(base_q.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    base_q = base_q.order_by(User.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(base_q)
    users = result.scalars().all()

    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "role_name": u.role.name if u.role else "Unknown",
                "organization_name": u.organization.name if u.organization else "Unknown",
                "organization_id": str(u.organization_id),
                "is_active": u.is_active,
                "platform_role": u.platform_role,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ─── Activity Feed ───────────────────────────────────────────────────

@router.get(
    "/activity",
)
async def get_platform_activity(
    limit: int = Query(20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get recent platform activity (new orgs, registrations, etc.)."""
    activities = []

    # Recent organizations
    recent_orgs = await db.execute(
        select(Organization)
        .where(Organization.deleted_at.is_(None))
        .order_by(Organization.created_at.desc())
        .limit(limit)
    )
    for org in recent_orgs.scalars().all():
        activities.append({
            "type": "new_organization",
            "title": f"New organization: {org.name}",
            "subtitle": f"Tier: {org.subscription_tier}",
            "timestamp": org.created_at.isoformat() if org.created_at else None,
            "org_id": str(org.id),
            "org_name": org.name,
        })

    # Sort by timestamp
    activities.sort(key=lambda a: a.get("timestamp", "") or "", reverse=True)

    return {"activities": activities[:limit]}

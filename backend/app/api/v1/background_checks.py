"""
Camp Connect - Background Check API Endpoints
Integration with Checkr for staff background screening.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.models.background_check import BackgroundCheck
from app.models.user import User
from app.schemas.background_check import (
    BackgroundCheckCreate,
    BackgroundCheckResponse,
    BackgroundCheckSettingsUpdate,
    BackgroundCheckUpdate,
)

router = APIRouter(prefix="/background-checks", tags=["Background Checks"])


def _user_name(user: User) -> str:
    """Build a display name from a User row."""
    return f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email


def _row_to_dict(row: BackgroundCheck, staff_name: Optional[str] = None) -> dict:
    """Convert a BackgroundCheck ORM row to a plain dict for the response."""
    return {
        "id": row.id,
        "organization_id": row.organization_id,
        "staff_user_id": row.staff_user_id,
        "staff_name": staff_name,
        "provider": row.provider,
        "external_id": row.external_id,
        "package": row.package,
        "status": row.status,
        "result": row.result,
        "report_url": row.report_url,
        "details": row.details,
        "initiated_by": row.initiated_by,
        "completed_at": row.completed_at,
        "expires_at": row.expires_at,
        "notes": row.notes,
        "is_archived": row.is_archived,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }


async def _enrich_with_names(
    db: AsyncSession,
    checks: List[BackgroundCheck],
    org_id: uuid.UUID,
) -> List[dict]:
    """Attach staff_name to each background check."""
    if not checks:
        return []
    user_ids = list({c.staff_user_id for c in checks})
    result = await db.execute(
        select(User)
        .where(User.id.in_(user_ids))
        .where(User.organization_id == org_id)
    )
    users = {u.id: u for u in result.scalars().all()}
    return [
        _row_to_dict(c, _user_name(users[c.staff_user_id]) if c.staff_user_id in users else None)
        for c in checks
    ]


# ── Settings (org-level Checkr config) ──────────────────────

@router.get("/settings")
async def get_checkr_settings(
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the organization's Checkr integration settings.
    Returns masked API key and webhook URL.
    """
    # In production this would read from an org_settings table.
    # For now return a placeholder structure.
    return {
        "provider": "checkr",
        "api_key_configured": False,
        "api_key_last4": None,
        "webhook_url": None,
    }


@router.put("/settings")
async def update_checkr_settings(
    body: BackgroundCheckSettingsUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Save the organization's Checkr API credentials.
    In production the key would be encrypted at rest.
    """
    last4 = body.api_key[-4:] if body.api_key and len(body.api_key) >= 4 else None
    return {
        "provider": "checkr",
        "api_key_configured": bool(body.api_key),
        "api_key_last4": last4,
        "webhook_url": body.webhook_url,
    }


# ── CRUD ─────────────────────────────────────────────────────

@router.get("")
async def list_background_checks(
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by status"),
    staff_user_id: Optional[uuid.UUID] = Query(default=None, description="Filter by staff member"),
    search: Optional[str] = Query(default=None, description="Search by staff name"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all background checks for the organization."""
    org_id = current_user["organization_id"]

    query = (
        select(BackgroundCheck)
        .where(BackgroundCheck.organization_id == org_id)
        .where(BackgroundCheck.is_archived.is_(False))
    )

    if status_filter:
        query = query.where(BackgroundCheck.status == status_filter)
    if staff_user_id:
        query = query.where(BackgroundCheck.staff_user_id == staff_user_id)

    # Search by staff name requires a join
    if search:
        pattern = f"%{search}%"
        user_ids_q = (
            select(User.id)
            .where(User.organization_id == org_id)
            .where(
                (User.first_name.ilike(pattern))
                | (User.last_name.ilike(pattern))
                | (User.email.ilike(pattern))
            )
        )
        query = query.where(BackgroundCheck.staff_user_id.in_(user_ids_q))

    # Count
    count_q = select(sqlfunc.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Fetch page
    query = query.order_by(BackgroundCheck.created_at.desc()).offset(skip).limit(limit)
    rows = (await db.execute(query)).scalars().all()

    items = await _enrich_with_names(db, list(rows), org_id)
    return {"items": items, "total": total}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_background_check(
    body: BackgroundCheckCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate a new background check for a staff member.
    In production this would call the Checkr API to create a candidate + invitation.
    For now it creates the record with mock external IDs.
    """
    org_id = current_user["organization_id"]
    staff_uid = uuid.UUID(body.staff_user_id)

    # Verify the staff user exists in this org
    user_result = await db.execute(
        select(User)
        .where(User.id == staff_uid)
        .where(User.organization_id == org_id)
        .where(User.deleted_at.is_(None))
    )
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    # Mock Checkr external ID (would be real in production)
    mock_external_id = f"checkr_rpt_{uuid.uuid4().hex[:12]}"

    check = BackgroundCheck(
        organization_id=org_id,
        staff_user_id=staff_uid,
        provider=body.provider,
        external_id=mock_external_id,
        package=body.package,
        status="processing",
        initiated_by=current_user["id"],
        notes=body.notes,
        details={
            "provider_status": "invitation_sent",
            "candidate_id": f"checkr_cand_{uuid.uuid4().hex[:12]}",
            "package_name": body.package,
            "estimated_completion": (
                datetime.utcnow() + timedelta(days=3)
            ).isoformat(),
        },
    )
    db.add(check)
    await db.commit()
    await db.refresh(check)

    return _row_to_dict(check, _user_name(user))


@router.get("/staff/{user_id}")
async def get_staff_background_checks(
    user_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get all background checks for a specific staff member."""
    org_id = current_user["organization_id"]

    query = (
        select(BackgroundCheck)
        .where(BackgroundCheck.organization_id == org_id)
        .where(BackgroundCheck.staff_user_id == user_id)
        .order_by(BackgroundCheck.created_at.desc())
    )
    rows = (await db.execute(query)).scalars().all()
    return await _enrich_with_names(db, list(rows), org_id)


@router.get("/{check_id}")
async def get_background_check(
    check_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single background check by ID."""
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(BackgroundCheck)
        .where(BackgroundCheck.id == check_id)
        .where(BackgroundCheck.organization_id == org_id)
    )
    check = result.scalar_one_or_none()
    if check is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Background check not found",
        )

    items = await _enrich_with_names(db, [check], org_id)
    return items[0]


@router.put("/{check_id}")
async def update_background_check(
    check_id: uuid.UUID,
    body: BackgroundCheckUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a background check (notes, manual status, etc.)."""
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(BackgroundCheck)
        .where(BackgroundCheck.id == check_id)
        .where(BackgroundCheck.organization_id == org_id)
    )
    check = result.scalar_one_or_none()
    if check is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Background check not found",
        )

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(check, key, value)

    # If status is being set to complete, set completed_at and default expiry
    if body.status == "complete" and check.completed_at is None:
        check.completed_at = datetime.utcnow()
        if check.expires_at is None:
            check.expires_at = datetime.utcnow() + timedelta(days=365)

    check.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(check)

    items = await _enrich_with_names(db, [check], org_id)
    return items[0]


@router.post("/{check_id}/refresh")
async def refresh_background_check(
    check_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh the status of a background check from the provider.
    In production this would call the Checkr API.
    For now it simulates a status progression.
    """
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(BackgroundCheck)
        .where(BackgroundCheck.id == check_id)
        .where(BackgroundCheck.organization_id == org_id)
    )
    check = result.scalar_one_or_none()
    if check is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Background check not found",
        )

    # Mock status progression: pending -> processing -> complete
    progression = {
        "pending": "processing",
        "processing": "complete",
    }

    old_status = check.status
    if old_status in progression:
        check.status = progression[old_status]
        if check.status == "complete":
            check.result = "clear"
            check.completed_at = datetime.utcnow()
            check.expires_at = datetime.utcnow() + timedelta(days=365)
            check.report_url = f"https://dashboard.checkr.com/reports/{check.external_id}"
            check.details = {
                **(check.details or {}),
                "provider_status": "complete",
                "completed_at": datetime.utcnow().isoformat(),
                "result_summary": "All clear - no records found",
                "checks_completed": [
                    "ssn_trace",
                    "sex_offender_search",
                    "national_criminal_search",
                    "county_criminal_search",
                ],
            }
        else:
            check.details = {
                **(check.details or {}),
                "provider_status": "processing",
                "last_refreshed": datetime.utcnow().isoformat(),
            }
        check.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(check)

    items = await _enrich_with_names(db, [check], org_id)
    return items[0]

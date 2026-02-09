"""
Camp Connect - Staff Directory API Endpoints
Search, list, and view staff members with role/department filtering.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func as sqlfunc
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_permission
from app.database import get_db
from app.models.role import Role
from app.models.staff_onboarding import StaffCertification, StaffOnboarding
from app.models.user import User
from app.schemas.staff import StaffListResponse, StaffProfile

router = APIRouter(prefix="/staff", tags=["Staff Directory"])


@router.get(
    "",
    response_model=StaffListResponse,
)
async def list_staff(
    search: Optional[str] = Query(
        default=None, description="Search by name or email"
    ),
    role_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by role ID"
    ),
    department: Optional[str] = Query(
        default=None, description="Filter by department"
    ),
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        description="Filter by onboarding status",
    ),
    skip: int = Query(default=0, ge=0, description="Pagination offset"),
    limit: int = Query(default=50, ge=1, le=100, description="Page size"),
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    List staff members in the organization directory.

    Requires **staff.employees.read** permission.
    Supports search, role, department, and onboarding status filters.
    """
    org_id = current_user["organization_id"]

    # Build base query
    query = (
        select(User)
        .options(selectinload(User.role))
        .where(User.organization_id == org_id)
        .where(User.deleted_at.is_(None))
    )

    # Search filter
    if search:
        pattern = f"%{search}%"
        query = query.where(
            (User.first_name.ilike(pattern))
            | (User.last_name.ilike(pattern))
            | (User.email.ilike(pattern))
        )

    # Role filter
    if role_id:
        query = query.where(User.role_id == role_id)

    # Count total before pagination
    count_query = (
        select(sqlfunc.count())
        .select_from(User)
        .where(User.organization_id == org_id)
        .where(User.deleted_at.is_(None))
    )
    if search:
        pattern = f"%{search}%"
        count_query = count_query.where(
            (User.first_name.ilike(pattern))
            | (User.last_name.ilike(pattern))
            | (User.email.ilike(pattern))
        )
    if role_id:
        count_query = count_query.where(User.role_id == role_id)

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Apply ordering and pagination
    query = query.order_by(User.last_name, User.first_name)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    # Fetch onboarding statuses for these users
    user_ids = [u.id for u in users]
    onboarding_map: Dict[uuid.UUID, str] = {}
    if user_ids:
        ob_result = await db.execute(
            select(StaffOnboarding.user_id, StaffOnboarding.status)
            .where(StaffOnboarding.user_id.in_(user_ids))
            .where(StaffOnboarding.organization_id == org_id)
        )
        for row in ob_result:
            onboarding_map[row[0]] = row[1]

    # Build response items
    items = []
    for user in users:
        ob_status = onboarding_map.get(user.id)

        # Apply status_filter if provided
        if status_filter and ob_status != status_filter:
            total -= 1
            continue

        items.append({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "avatar_url": user.avatar_url,
            "role_name": user.role.name if user.role else None,
            "department": None,  # Department is an extension field
            "onboarding_status": ob_status,
            "is_active": user.is_active,
            "phone": user.phone,
            "created_at": user.created_at,
        })

    return {"items": items, "total": total}


@router.get(
    "/departments",
)
async def list_departments(
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    List unique departments in the organization.

    Requires **staff.employees.read** permission.
    Returns a list of distinct department strings.
    """
    # Departments are not yet a first-class field on User,
    # so return an empty list placeholder for future extension.
    return []


@router.get(
    "/{user_id}",
    response_model=StaffProfile,
)
async def get_staff_profile(
    user_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the full profile for a staff member.

    Requires **staff.employees.read** permission.
    Includes certifications, onboarding details, and seasonal access dates.
    """
    org_id = current_user["organization_id"]

    # Fetch user
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.id == user_id)
        .where(User.organization_id == org_id)
        .where(User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    # Fetch onboarding
    ob_result = await db.execute(
        select(StaffOnboarding)
        .options(
            selectinload(StaffOnboarding.certifications),
            selectinload(StaffOnboarding.documents),
            selectinload(StaffOnboarding.acknowledgments),
        )
        .where(StaffOnboarding.user_id == user_id)
        .where(StaffOnboarding.organization_id == org_id)
    )
    onboarding = ob_result.scalar_one_or_none()

    # Build certifications list
    certifications = []
    onboarding_dict = None
    if onboarding:
        for cert in (onboarding.certifications or []):
            certifications.append({
                "id": cert.id,
                "name": cert.name,
                "issuing_authority": cert.issuing_authority,
                "certificate_number": cert.certificate_number,
                "issued_date": cert.issued_date,
                "expiry_date": cert.expiry_date,
                "document_url": cert.document_url,
                "status": cert.status,
            })
        onboarding_dict = {
            "id": onboarding.id,
            "status": onboarding.status,
            "current_step": onboarding.current_step,
            "completed_at": onboarding.completed_at,
        }

    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "avatar_url": user.avatar_url,
        "role_name": user.role.name if user.role else None,
        "department": None,
        "onboarding_status": onboarding.status if onboarding else None,
        "is_active": user.is_active,
        "phone": user.phone,
        "created_at": user.created_at,
        "certifications": certifications,
        "onboarding": onboarding_dict,
        "seasonal_access_start": user.seasonal_access_start,
        "seasonal_access_end": user.seasonal_access_end,
    }

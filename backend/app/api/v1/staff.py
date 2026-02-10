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
from app.models.event import Event
from app.schemas.staff import (
    CounselorListItem,
    StaffCategoryUpdate,
    StaffFinancialUpdate,
    StaffListResponse,
    StaffProfile,
)

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
    staff_category: Optional[str] = Query(
        default=None,
        description="Filter by staff category (full_time, counselor, director)",
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

    # Staff category filter
    if staff_category:
        query = query.where(User.staff_category == staff_category)

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
    if staff_category:
        count_query = count_query.where(User.staff_category == staff_category)

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

            # Determine staff status
        staff_status = "active"
        if not user.is_active:
            staff_status = "inactive"
        elif ob_status and ob_status != "completed":
            staff_status = "onboarding"

        items.append({
            "id": user.id,
            "user_id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "avatar_url": user.avatar_url,
            "role_name": user.role.name if user.role else None,
            "department": None,  # Department is an extension field
            "staff_category": user.staff_category,
            "status": staff_status,
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
    "/counselors",
    response_model=List[CounselorListItem],
)
async def list_counselors(
    event_id: Optional[uuid.UUID] = Query(
        default=None, description="Event ID to filter by event date range"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    List staff members marked as counselors who are active.

    If event_id is provided, further filters to counselors whose
    seasonal access overlaps the event date range.
    Requires **staff.employees.read** permission.
    """
    org_id = current_user["organization_id"]

    query = (
        select(User)
        .where(User.organization_id == org_id)
        .where(User.deleted_at.is_(None))
        .where(User.is_active.is_(True))
        .where(User.staff_category == "counselor")
    )

    # If event_id provided, filter by event date overlap with seasonal access
    if event_id:
        event_result = await db.execute(
            select(Event)
            .where(Event.id == event_id)
            .where(Event.organization_id == org_id)
        )
        event = event_result.scalar_one_or_none()
        if event is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        # Only filter by seasonal access if the user has dates set
        # Users with no seasonal dates are considered always available
        query = query.where(
            (User.seasonal_access_start.is_(None))
            | (User.seasonal_access_start <= event.end_date)
        )
        query = query.where(
            (User.seasonal_access_end.is_(None))
            | (User.seasonal_access_end >= event.start_date)
        )

    query = query.order_by(User.last_name, User.first_name)
    result = await db.execute(query)
    users = result.scalars().all()

    return [
        {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "avatar_url": u.avatar_url,
        }
        for u in users
    ]


@router.put(
    "/{user_id}/category",
)
async def update_staff_category(
    user_id: uuid.UUID,
    body: StaffCategoryUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a staff member's category.

    Requires **staff.employees.update** permission.
    Valid categories: full_time, counselor, director, or null.
    """
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(User)
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

    # Validate category value
    valid_categories = {"full_time", "counselor", "director", None}
    if body.staff_category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid staff category. Must be one of: full_time, counselor, director, or null",
        )

    user.staff_category = body.staff_category
    await db.commit()

    return {"id": user.id, "staff_category": user.staff_category}


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
    emergency_contacts = []
    if onboarding:
        for cert in (onboarding.certifications or []):
            certifications.append({
                "id": cert.id,
                "name": cert.name,
                "issuing_authority": cert.issuing_authority,
                "certificate_number": cert.certificate_number,
                "issue_date": cert.issued_date,
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
        # Extract emergency contacts from onboarding data
        ec_data = onboarding.emergency_contacts_data
        if ec_data and isinstance(ec_data, list):
            emergency_contacts = ec_data

    # Determine staff status from onboarding + active flag
    staff_status = "active"
    if not user.is_active:
        staff_status = "inactive"
    elif onboarding and onboarding.status != "completed":
        staff_status = "onboarding"

    return {
        "id": user.id,
        "user_id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "avatar_url": user.avatar_url,
        "role_name": user.role.name if user.role else None,
        "department": None,
        "staff_category": user.staff_category,
        "status": staff_status,
        "hire_date": user.created_at,
        "is_active": user.is_active,
        "phone": user.phone,
        "created_at": user.created_at,
        "certifications": certifications,
        "emergency_contacts": emergency_contacts,
        "onboarding": onboarding_dict,
        "seasonal_access_start": user.seasonal_access_start,
        "seasonal_access_end": user.seasonal_access_end,
        "financial_info": user.financial_info,
    }


@router.put(
    "/{user_id}/financial",
)
async def update_staff_financial(
    user_id: uuid.UUID,
    body: StaffFinancialUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a staff member's financial information.

    Requires **staff.employees.update** permission.
    Stores pay rate, employment dates, and notes as JSONB.
    """
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(User)
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

    user.financial_info = body.financial_info
    await db.commit()

    return {"id": user.id, "financial_info": user.financial_info}

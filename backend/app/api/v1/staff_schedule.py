"""
Camp Connect - Staff Schedule API Endpoints
CRUD and stats for staff shift scheduling.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.staff_schedule import (
    ShiftCreate,
    ShiftResponse,
    ShiftUpdate,
    StaffScheduleStats,
)
from app.services import staff_schedule_service

router = APIRouter(prefix="/staff-schedule", tags=["Staff Schedule"])


# ---------------------------------------------------------------------------
# Stats (must be before /{id} to avoid route conflict)
# ---------------------------------------------------------------------------


@router.get(
    "/stats",
    response_model=StaffScheduleStats,
)
async def get_stats(
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get staff schedule statistics for the organization."""
    return await staff_schedule_service.get_stats(
        db, org_id=current_user["organization_id"],
    )


# ---------------------------------------------------------------------------
# List / Create
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[ShiftResponse],
)
async def list_shifts(
    day_of_week: Optional[str] = Query(default=None, description="Filter by day of week"),
    shift_type: Optional[str] = Query(default=None, description="Filter by shift type"),
    staff_name: Optional[str] = Query(default=None, description="Filter by staff name"),
    search: Optional[str] = Query(default=None, description="Search staff name, role, location"),
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all staff shifts for the current organization."""
    return await staff_schedule_service.list_shifts(
        db,
        org_id=current_user["organization_id"],
        day_of_week=day_of_week,
        shift_type=shift_type,
        staff_name=staff_name,
        search=search,
    )


@router.post(
    "",
    response_model=ShiftResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_shift(
    body: ShiftCreate,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new staff shift."""
    return await staff_schedule_service.create_shift(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Single item CRUD
# ---------------------------------------------------------------------------


@router.get(
    "/{shift_id}",
    response_model=ShiftResponse,
)
async def get_shift(
    shift_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single staff shift by ID."""
    item = await staff_schedule_service.get_shift(
        db, org_id=current_user["organization_id"], shift_id=shift_id,
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    return item


@router.put(
    "/{shift_id}",
    response_model=ShiftResponse,
)
async def update_shift(
    shift_id: uuid.UUID,
    body: ShiftUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update a staff shift."""
    item = await staff_schedule_service.update_shift(
        db,
        org_id=current_user["organization_id"],
        shift_id=shift_id,
        data=body.model_dump(exclude_unset=True),
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    return item


@router.delete(
    "/{shift_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_shift(
    shift_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a staff shift."""
    deleted = await staff_schedule_service.delete_shift(
        db, org_id=current_user["organization_id"], shift_id=shift_id,
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")

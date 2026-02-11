"""
Camp Connect - Volunteer API Endpoints
Full CRUD for volunteers, shifts, and stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import require_permission
from app.schemas.volunteer import (
    ShiftCreate,
    ShiftResponse,
    ShiftUpdate,
    VolunteerCreate,
    VolunteerResponse,
    VolunteerUpdate,
)
from app.services import volunteer_service

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


# ── Volunteer CRUD ─────────────────────────────────────────────────

@router.get("", response_model=List[VolunteerResponse])
async def list_volunteers(
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(default=None, description="Search by name or email"),
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.read")),
):
    return await volunteer_service.list_volunteers(
        current_user["organization_id"],
        status=status_filter,
        search=search,
    )


@router.get("/stats")
async def get_volunteer_stats(
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.read")),
):
    return await volunteer_service.get_volunteer_stats(current_user["organization_id"])


@router.get("/{volunteer_id}", response_model=VolunteerResponse)
async def get_volunteer(
    volunteer_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.read")),
):
    vol = await volunteer_service.get_volunteer(current_user["organization_id"], volunteer_id)
    if vol is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found")
    return vol


@router.post("", response_model=VolunteerResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer(
    body: VolunteerCreate,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
):
    return await volunteer_service.create_volunteer(
        current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put("/{volunteer_id}", response_model=VolunteerResponse)
async def update_volunteer(
    volunteer_id: uuid.UUID,
    body: VolunteerUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
):
    result = await volunteer_service.update_volunteer(
        current_user["organization_id"],
        volunteer_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found")
    return result


@router.delete("/{volunteer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_volunteer(
    volunteer_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
):
    deleted = await volunteer_service.delete_volunteer(current_user["organization_id"], volunteer_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found")


@router.post("/{volunteer_id}/log-hours", response_model=VolunteerResponse)
async def log_hours(
    volunteer_id: uuid.UUID,
    hours: float = Query(description="Hours to add"),
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
):
    result = await volunteer_service.log_hours(
        current_user["organization_id"], volunteer_id, hours,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found")
    return result


# ── Shift CRUD ─────────────────────────────────────────────────────

@router.get("/shifts/list", response_model=List[ShiftResponse])
async def list_shifts(
    volunteer_id: Optional[uuid.UUID] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    date_from: Optional[str] = Query(default=None),
    date_to: Optional[str] = Query(default=None),
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.read")),
):
    return await volunteer_service.list_shifts(
        current_user["organization_id"],
        volunteer_id=volunteer_id,
        status=status_filter,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/shifts/schedule")
async def get_shift_schedule(
    week_start: str = Query(description="YYYY-MM-DD"),
    week_end: str = Query(description="YYYY-MM-DD"),
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.read")),
):
    return await volunteer_service.get_shift_schedule(
        current_user["organization_id"], week_start, week_end,
    )


@router.post("/shifts", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def create_shift(
    body: ShiftCreate,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
):
    return await volunteer_service.create_shift(
        current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put("/shifts/{shift_id}", response_model=ShiftResponse)
async def update_shift(
    shift_id: uuid.UUID,
    body: ShiftUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
):
    result = await volunteer_service.update_shift(
        current_user["organization_id"],
        shift_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    return result


@router.delete("/shifts/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(
    shift_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("staff.employees.update")),
):
    deleted = await volunteer_service.delete_shift(current_user["organization_id"], shift_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")

"""
Camp Connect - Schedule API Endpoints
Schedule CRUD and camper/bunk assignment management.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.schedule import (
    ScheduleAssignmentCreate,
    ScheduleAssignmentResponse,
    ScheduleCreate,
    ScheduleResponse,
    ScheduleUpdate,
)
from app.services import schedule_service

router = APIRouter(prefix="/schedules", tags=["Schedules"])


# ---------------------------------------------------------------------------
# Static path endpoints MUST come before /{schedule_id} to avoid path conflicts
# ---------------------------------------------------------------------------


@router.get(
    "/daily-view",
    response_model=None,
)
async def get_daily_view(
    event_id: uuid.UUID = Query(..., description="Event ID (required)"),
    date: date = Query(..., description="Date for daily view (required)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.sessions.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get all sessions for a date grouped by time slot."""
    return await schedule_service.get_daily_view(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
        date=date,
    )




@router.get(
    "/month-overview",
    response_model=None,
)
async def get_month_overview(
    event_id: uuid.UUID = Query(..., description="Event ID (required)"),
    year: int = Query(..., description="Year (e.g. 2026)"),
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.sessions.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Return session counts per day for a given month."""
    return await schedule_service.get_month_overview(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
        year=year,
        month=month,
    )


@router.get(
    "/week-view",
    response_model=None,
)
async def get_week_view(
    event_id: uuid.UUID = Query(..., description="Event ID (required)"),
    start_date: date = Query(..., description="Start date (Monday of the week)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.sessions.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Return all sessions for a 7-day range."""
    return await schedule_service.get_week_view(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
        start_date=start_date,
    )


@router.get(
    "/staff-view",
    response_model=None,
)
async def get_staff_schedule_view(
    event_id: uuid.UUID = Query(..., description="Event ID (required)"),
    date: date = Query(..., description="Date for staff view (required)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.sessions.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get staff-centric view of the daily schedule."""
    return await schedule_service.get_staff_schedule_view(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
        date=date,
    )

@router.post(
    "/assignments",
    response_model=ScheduleAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    body: ScheduleAssignmentCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.assignments.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Assign a camper or bunk to a schedule session."""
    try:
        return await schedule_service.create_assignment(
            db,
            organization_id=current_user["organization_id"],
            data=body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_assignment(
    assignment_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.assignments.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Remove a schedule assignment."""
    deleted = await schedule_service.delete_assignment(
        db,
        organization_id=current_user["organization_id"],
        assignment_id=assignment_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )


# ---------------------------------------------------------------------------
# Schedule CRUD (dynamic /{schedule_id} paths come AFTER static paths)
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[ScheduleResponse],
)
async def list_schedules(
    event_id: uuid.UUID = Query(..., description="Event ID (required)"),
    date: Optional[date] = Query(default=None, description="Filter by date"),
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.sessions.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List schedule sessions for an event, optionally filtered by date."""
    return await schedule_service.list_schedules(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
        date=date,
    )


@router.get(
    "/{schedule_id}",
    response_model=ScheduleResponse,
)
async def get_schedule(
    schedule_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.sessions.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single schedule session by ID."""
    schedule = await schedule_service.get_schedule(
        db,
        organization_id=current_user["organization_id"],
        schedule_id=schedule_id,
    )
    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )
    return schedule


@router.post(
    "",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_schedule(
    body: ScheduleCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.sessions.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new schedule session."""
    try:
        return await schedule_service.create_schedule(
            db,
            organization_id=current_user["organization_id"],
            data=body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/{schedule_id}",
    response_model=ScheduleResponse,
)
async def update_schedule(
    schedule_id: uuid.UUID,
    body: ScheduleUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.sessions.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a schedule session."""
    result = await schedule_service.update_schedule(
        db,
        organization_id=current_user["organization_id"],
        schedule_id=schedule_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )
    return result


@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_schedule(
    schedule_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("scheduling.sessions.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) a schedule session."""
    deleted = await schedule_service.delete_schedule(
        db,
        organization_id=current_user["organization_id"],
        schedule_id=schedule_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )

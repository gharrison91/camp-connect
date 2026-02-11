"""
Camp Connect - Attendance API Endpoints
Record, query and report on camper attendance.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_permission
from app.schemas.attendance import (
    AttendanceBulkCreate,
    AttendanceRecordCreate,
    AttendanceRecordResponse,
    AttendanceSessionResponse,
    AttendanceStatsResponse,
)
from app.services import attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post(
    "/record",
    response_model=AttendanceRecordResponse,
    status_code=201,
)
async def record_attendance(
    body: AttendanceRecordCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.read")
    ),
):
    """Record a single attendance entry."""
    return await attendance_service.record_attendance(
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.post("/bulk", status_code=201)
async def bulk_attendance(
    body: AttendanceBulkCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.read")
    ),
):
    """Submit attendance for an entire activity session."""
    return await attendance_service.bulk_attendance(
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.get(
    "/sessions",
    response_model=List[AttendanceSessionResponse],
)
async def list_sessions(
    activity_id: Optional[uuid.UUID] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.read")
    ),
):
    """List attendance sessions with optional filters."""
    return await attendance_service.get_session_attendance(
        organization_id=current_user["organization_id"],
        activity_id=activity_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/camper/{camper_id}/history",
    response_model=List[AttendanceRecordResponse],
)
async def camper_history(
    camper_id: uuid.UUID,
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.read")
    ),
):
    """Get full attendance history for a camper."""
    return await attendance_service.get_camper_attendance_history(
        organization_id=current_user["organization_id"],
        camper_id=camper_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/stats",
    response_model=AttendanceStatsResponse,
)
async def attendance_stats(
    activity_id: Optional[uuid.UUID] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.read")
    ),
):
    """Get aggregate attendance statistics."""
    return await attendance_service.get_attendance_stats(
        organization_id=current_user["organization_id"],
        activity_id=activity_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/daily-report")
async def daily_report(
    report_date: date = Query(..., description="Date for the report"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.read")
    ),
):
    """Get a daily attendance summary across all activities."""
    return await attendance_service.get_daily_report(
        organization_id=current_user["organization_id"],
        report_date=report_date,
    )

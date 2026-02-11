"""
Camp Connect - Check-In / Check-Out API Endpoints
Daily camper check-in and check-out tracking.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_permission
from app.schemas.checkin import (
    CheckInCreate,
    CheckInRecord,
    CheckInStats,
    TodayResponse,
)
from app.services import checkin_service

router = APIRouter(prefix="/checkin", tags=["Check-In / Check-Out"])


@router.post(
    "",
    response_model=CheckInRecord,
    status_code=201,
)
async def create_checkin(
    body: CheckInCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.read")
    ),
):
    """Record a camper check-in or check-out event."""
    return await checkin_service.create_checkin(
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.get(
    "/today",
    response_model=TodayResponse,
)
async def today_status(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.read")
    ),
):
    """Get today's check-in/out status for all campers."""
    return await checkin_service.get_today_status(
        organization_id=current_user["organization_id"],
    )


@router.get(
    "/history",
    response_model=List[CheckInRecord],
)
async def checkin_history(
    camper_id: Optional[uuid.UUID] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    type: Optional[str] = Query(default=None, pattern="^(check_in|check_out)$"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.read")
    ),
):
    """Get check-in/out history with optional filters."""
    return await checkin_service.get_history(
        organization_id=current_user["organization_id"],
        camper_id=camper_id,
        start_date=start_date,
        end_date=end_date,
        record_type=type,
    )


@router.get(
    "/stats",
    response_model=CheckInStats,
)
async def checkin_stats(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.read")
    ),
):
    """Get aggregate check-in statistics for today."""
    return await checkin_service.get_stats(
        organization_id=current_user["organization_id"],
    )

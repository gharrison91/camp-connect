"""
Camp Connect - Analytics API Endpoints
Read-only endpoints for analytics dashboards.
"""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.analytics import (
    CamperDemographicsResponse,
    CommunicationStatsResponse,
    EnrollmentTrendsResponse,
    EventCapacityResponse,
    RegistrationStatusResponse,
    RevenueMetricsResponse,
)
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _parse_date(value: Optional[str]) -> Optional[date]:
    """Parse an ISO date string, or return None."""
    if value:
        return date.fromisoformat(value)
    return None


@router.get(
    "/enrollment-trends",
    response_model=EnrollmentTrendsResponse,
)
async def enrollment_trends(
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("analytics.dashboards.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get enrollment trends grouped by day."""
    return await analytics_service.get_enrollment_trends(
        db,
        organization_id=current_user["organization_id"],
        start_date=_parse_date(start_date),
        end_date=_parse_date(end_date),
    )


@router.get(
    "/revenue-metrics",
    response_model=RevenueMetricsResponse,
)
async def revenue_metrics(
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("analytics.dashboards.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get revenue metrics with monthly breakdown."""
    return await analytics_service.get_revenue_metrics(
        db,
        organization_id=current_user["organization_id"],
        start_date=_parse_date(start_date),
        end_date=_parse_date(end_date),
    )


@router.get(
    "/event-capacity",
    response_model=EventCapacityResponse,
)
async def event_capacity(
    current_user: Dict[str, Any] = Depends(
        require_permission("analytics.dashboards.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get capacity utilization for all events."""
    return await analytics_service.get_event_capacity_stats(
        db,
        organization_id=current_user["organization_id"],
    )


@router.get(
    "/registration-status",
    response_model=RegistrationStatusResponse,
)
async def registration_status(
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("analytics.dashboards.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get registration counts by status."""
    return await analytics_service.get_registration_status_breakdown(
        db,
        organization_id=current_user["organization_id"],
        start_date=_parse_date(start_date),
        end_date=_parse_date(end_date),
    )


@router.get(
    "/communication-stats",
    response_model=CommunicationStatsResponse,
)
async def communication_stats(
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("analytics.dashboards.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get communication delivery statistics."""
    return await analytics_service.get_communication_stats(
        db,
        organization_id=current_user["organization_id"],
        start_date=_parse_date(start_date),
        end_date=_parse_date(end_date),
    )


@router.get(
    "/camper-demographics",
    response_model=CamperDemographicsResponse,
)
async def camper_demographics(
    current_user: Dict[str, Any] = Depends(
        require_permission("analytics.dashboards.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get camper demographic breakdown (age, gender, location)."""
    return await analytics_service.get_camper_demographics(
        db,
        organization_id=current_user["organization_id"],
    )

"""
Camp Connect - Dashboard API Endpoints
Aggregated stats for the dashboard overview.
"""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.models.camper import Camper
from app.models.event import Event
from app.models.registration import Registration


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class RecentRegistration(BaseModel):
    id: str
    camper_name: str
    event_name: str
    status: str
    payment_status: str
    created_at: str

    class Config:
        from_attributes = True


class DashboardStatsResponse(BaseModel):
    total_campers: int
    total_events: int
    upcoming_events: int
    total_registrations: int
    recent_registrations: List[RecentRegistration]


@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
)
async def get_dashboard_stats(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated dashboard statistics for the current organization."""
    org_id = current_user["organization_id"]
    today = date.today()

    # Total campers (non-deleted)
    camper_count_result = await db.execute(
        select(func.count(Camper.id)).where(
            Camper.organization_id == org_id,
            Camper.deleted_at.is_(None),
        )
    )
    total_campers = camper_count_result.scalar() or 0

    # Total events (non-deleted)
    event_count_result = await db.execute(
        select(func.count(Event.id)).where(
            Event.organization_id == org_id,
            Event.deleted_at.is_(None),
        )
    )
    total_events = event_count_result.scalar() or 0

    # Upcoming events (start_date >= today, non-deleted)
    upcoming_count_result = await db.execute(
        select(func.count(Event.id)).where(
            Event.organization_id == org_id,
            Event.deleted_at.is_(None),
            Event.start_date >= today,
        )
    )
    upcoming_events = upcoming_count_result.scalar() or 0

    # Total registrations (non-deleted)
    reg_count_result = await db.execute(
        select(func.count(Registration.id)).where(
            Registration.organization_id == org_id,
            Registration.deleted_at.is_(None),
        )
    )
    total_registrations = reg_count_result.scalar() or 0

    # Recent 10 registrations with camper name and event name
    recent_result = await db.execute(
        select(
            Registration.id,
            (Camper.first_name + " " + Camper.last_name).label("camper_name"),
            Event.name.label("event_name"),
            Registration.status,
            Registration.payment_status,
            Registration.created_at,
        )
        .join(Camper, Registration.camper_id == Camper.id)
        .join(Event, Registration.event_id == Event.id)
        .where(
            Registration.organization_id == org_id,
            Registration.deleted_at.is_(None),
        )
        .order_by(Registration.created_at.desc())
        .limit(10)
    )
    recent_rows = recent_result.all()

    recent_registrations = [
        RecentRegistration(
            id=str(row.id),
            camper_name=row.camper_name,
            event_name=row.event_name,
            status=row.status,
            payment_status=row.payment_status,
            created_at=row.created_at.isoformat() if row.created_at else "",
        )
        for row in recent_rows
    ]

    return DashboardStatsResponse(
        total_campers=total_campers,
        total_events=total_events,
        upcoming_events=upcoming_events,
        total_registrations=total_registrations,
        recent_registrations=recent_registrations,
    )

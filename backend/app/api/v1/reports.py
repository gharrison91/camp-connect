"""
Camp Connect - Reports API Router
Download CSV reports for camper rosters, registrations, health forms,
financial summaries, and attendance.
"""
from __future__ import annotations

import io
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


def _csv_response(csv_data: str, filename: str) -> StreamingResponse:
    """Wrap a CSV string in a StreamingResponse with download headers."""
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Camper Roster ──────────────────────────────────────────────────────────

@router.get("/camper-roster")
async def download_camper_roster(
    event_id: Optional[uuid.UUID] = Query(None),
    user: dict = Depends(require_permission("reports.export.read")),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Download a CSV of the camper roster."""
    csv_data = await report_service.generate_camper_roster(
        db,
        organization_id=user["organization_id"],
        event_id=event_id,
    )
    return _csv_response(csv_data, "camper-roster.csv")


# ── Registrations ─────────────────────────────────────────────────────────

@router.get("/registrations")
async def download_registration_report(
    event_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    user: dict = Depends(require_permission("reports.export.read")),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Download a CSV of registrations."""
    csv_data = await report_service.generate_registration_report(
        db,
        organization_id=user["organization_id"],
        event_id=event_id,
        status=status,
    )
    return _csv_response(csv_data, "registrations.csv")


# ── Health Forms ───────────────────────────────────────────────────────────

@router.get("/health-forms")
async def download_health_form_report(
    event_id: Optional[uuid.UUID] = Query(None),
    user: dict = Depends(require_permission("reports.export.read")),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Download a CSV of health form statuses."""
    csv_data = await report_service.generate_health_form_report(
        db,
        organization_id=user["organization_id"],
        event_id=event_id,
    )
    return _csv_response(csv_data, "health-forms.csv")


# ── Financial ──────────────────────────────────────────────────────────────

@router.get("/financial")
async def download_financial_report(
    event_id: Optional[uuid.UUID] = Query(None),
    user: dict = Depends(require_permission("reports.export.read")),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Download a CSV of financial data (registration payments)."""
    csv_data = await report_service.generate_financial_report(
        db,
        organization_id=user["organization_id"],
        event_id=event_id,
    )
    return _csv_response(csv_data, "financial.csv")


# ── Attendance ─────────────────────────────────────────────────────────────

@router.get("/attendance")
async def download_attendance_report(
    event_id: uuid.UUID = Query(...),
    user: dict = Depends(require_permission("reports.export.read")),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Download a CSV of attendance for a specific event."""
    csv_data = await report_service.generate_attendance_report(
        db,
        organization_id=user["organization_id"],
        event_id=event_id,
    )
    return _csv_response(csv_data, "attendance.csv")

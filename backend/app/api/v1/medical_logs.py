"""
Camp Connect - Medical Logs API Router
REST endpoints for medical log entries.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.medical_log import (
    MedicalLogCreate,
    MedicalLogUpdate,
    MedicalLogEntry,
    MedicalLogStats,
)
from app.services import medical_log_service

router = APIRouter(prefix="/medical-logs", tags=["Medical Logs"])


def _org_id(user: Dict[str, Any]) -> str:
    return str(user["organization_id"])


def _user_id(user: Dict[str, Any]) -> str:
    return str(user["id"])


def _user_name(user: Dict[str, Any]) -> str:
    first = user.get("first_name") or ""
    last = user.get("last_name") or ""
    name = f"{first} {last}".strip()
    return name or user.get("email", "Unknown")


@router.get("/stats", response_model=MedicalLogStats)
async def medical_log_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get medical log dashboard statistics."""
    return await medical_log_service.get_stats(_org_id(current_user))


@router.get("/follow-ups", response_model=List[MedicalLogEntry])
async def medical_log_follow_ups(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get pending follow-up entries."""
    return await medical_log_service.get_follow_ups(_org_id(current_user))


@router.get("")
async def list_medical_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    camper_id: Optional[str] = Query(None),
    visit_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List medical log entries with filters and pagination."""
    return await medical_log_service.get_logs(
        _org_id(current_user),
        page=page,
        per_page=per_page,
        camper_id=camper_id,
        visit_type=visit_type,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )


@router.post("", response_model=MedicalLogEntry, status_code=201)
async def create_medical_log(
    body: MedicalLogCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new medical log entry."""
    return await medical_log_service.create_log(
        _org_id(current_user),
        user_id=_user_id(current_user),
        user_name=_user_name(current_user),
        data=body.model_dump(),
    )


@router.put("/{log_id}", response_model=MedicalLogEntry)
async def update_medical_log(
    log_id: str,
    body: MedicalLogUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing medical log entry."""
    result = await medical_log_service.update_log(
        _org_id(current_user),
        log_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Medical log entry not found")
    return result

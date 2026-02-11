"""
Camp Connect - Parent Logs API Router
REST endpoints for parent communication logs & camper check-ins.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.parent_log import (
    ParentLogCreate,
    ParentLogUpdate,
    ParentLogResponse,
    CheckInCreate,
    CheckInResponse,
    ParentLogStats,
)
from app.services import parent_log_service

router = APIRouter(prefix="/parent-logs", tags=["Parent Logs"])


# ── Helpers ───────────────────────────────────────────────────

def _org_id(user: Dict[str, Any]) -> str:
    return str(user["organization_id"])


def _user_id(user: Dict[str, Any]) -> str:
    return str(user["id"])


def _user_name(user: Dict[str, Any]) -> str:
    first = user.get("first_name") or ""
    last = user.get("last_name") or ""
    name = f"{first} {last}".strip()
    return name or user.get("email", "Unknown")


# ── GET /parent-logs/stats ────────────────────────────────────

@router.get("/stats", response_model=ParentLogStats)
async def log_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get parent log dashboard statistics."""
    return await parent_log_service.get_log_stats(_org_id(current_user))


# ── GET /parent-logs/follow-ups ───────────────────────────────

@router.get("/follow-ups", response_model=List[ParentLogResponse])
async def list_follow_ups(
    overdue_only: bool = Query(False),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get log entries that need follow-up."""
    return await parent_log_service.get_follow_ups_due(
        _org_id(current_user), overdue_only=overdue_only
    )


# ── POST /parent-logs/follow-ups/{entry_id}/complete ──────────

@router.post("/follow-ups/{entry_id}/complete", response_model=ParentLogResponse)
async def complete_follow_up(
    entry_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a follow-up as completed."""
    result = await parent_log_service.complete_follow_up(
        _org_id(current_user), entry_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return result


# ── GET /parent-logs/entries ──────────────────────────────────

@router.get("/entries", response_model=List[ParentLogResponse])
async def list_log_entries(
    parent_id: Optional[str] = Query(None),
    camper_id: Optional[str] = Query(None),
    log_type: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List parent communication log entries with optional filters."""
    return await parent_log_service.get_log_entries(
        _org_id(current_user),
        parent_id=parent_id,
        camper_id=camper_id,
        log_type=log_type,
        sentiment=sentiment,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )


# ── POST /parent-logs/entries ─────────────────────────────────

@router.post("/entries", response_model=ParentLogResponse, status_code=status.HTTP_201_CREATED)
async def create_log_entry(
    body: ParentLogCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new parent communication log entry."""
    return await parent_log_service.create_log_entry(
        _org_id(current_user),
        _user_id(current_user),
        _user_name(current_user),
        body.model_dump(),
    )


# ── GET /parent-logs/entries/{entry_id} ───────────────────────

@router.get("/entries/{entry_id}", response_model=ParentLogResponse)
async def get_log_entry(
    entry_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single log entry by ID."""
    entry = await parent_log_service.get_log_entry(_org_id(current_user), entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return entry


# ── PUT /parent-logs/entries/{entry_id} ───────────────────────

@router.put("/entries/{entry_id}", response_model=ParentLogResponse)
async def update_log_entry(
    entry_id: str,
    body: ParentLogUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a log entry."""
    result = await parent_log_service.update_log_entry(
        _org_id(current_user), entry_id, body.model_dump(exclude_unset=True)
    )
    if not result:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return result


# ── DELETE /parent-logs/entries/{entry_id} ────────────────────

@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log_entry(
    entry_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a log entry."""
    deleted = await parent_log_service.delete_log_entry(_org_id(current_user), entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Log entry not found")


# ── GET /parent-logs/parent/{parent_id}/history ───────────────

@router.get("/parent/{parent_id}/history", response_model=List[ParentLogResponse])
async def parent_history(
    parent_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all communication history for a specific parent."""
    return await parent_log_service.get_parent_history(
        _org_id(current_user), parent_id
    )


# ── Check-In Endpoints ───────────────────────────────────────

@router.get("/check-ins", response_model=List[CheckInResponse])
async def list_check_ins(
    camper_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    check_in_type: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List camper check-ins with optional filters."""
    return await parent_log_service.get_check_ins(
        _org_id(current_user),
        camper_id=camper_id,
        date=date,
        check_in_type=check_in_type,
    )


@router.post("/check-ins", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
async def create_check_in(
    body: CheckInCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new camper check-in."""
    return await parent_log_service.create_check_in(
        _org_id(current_user), body.model_dump()
    )


@router.post("/check-ins/{check_in_id}/share", response_model=CheckInResponse)
async def share_check_in(
    check_in_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Share a check-in with the camper's parents."""
    result = await parent_log_service.share_check_in_with_parents(
        _org_id(current_user), check_in_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Check-in not found")
    return result


@router.get("/check-ins/camper/{camper_id}", response_model=List[CheckInResponse])
async def camper_check_ins(
    camper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all check-ins for a specific camper."""
    return await parent_log_service.get_camper_check_ins(
        _org_id(current_user), camper_id
    )

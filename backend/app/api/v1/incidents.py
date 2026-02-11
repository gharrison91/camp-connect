"""
Camp Connect - Incidents API Router
REST endpoints for incident & safety reporting.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    IncidentStats,
    FollowUpCreate,
    ResolveRequest,
)
from app.services import incident_service

router = APIRouter(prefix="/incidents", tags=["Incidents"])


# ─── Helpers ──────────────────────────────────────────────────

def _org_id(user: Dict[str, Any]) -> str:
    return str(user["organization_id"])


def _user_id(user: Dict[str, Any]) -> str:
    return str(user["id"])


def _user_name(user: Dict[str, Any]) -> str:
    first = user.get("first_name") or ""
    last = user.get("last_name") or ""
    name = f"{first} {last}".strip()
    return name or user.get("email", "Unknown")


# ─── GET /incidents/stats ─────────────────────────────────────

@router.get("/stats", response_model=IncidentStats)
async def incident_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get incident dashboard statistics."""
    return await incident_service.get_incident_stats(_org_id(current_user))


# ─── GET /incidents/person/{person_type}/{person_id} ──────────

@router.get("/person/{person_type}/{person_id}", response_model=List[IncidentResponse])
async def person_incidents(
    person_type: str,
    person_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get incidents involving a specific camper or staff member."""
    if person_type not in ("camper", "staff"):
        raise HTTPException(status_code=400, detail="person_type must be camper or staff")
    return await incident_service.get_person_incidents(
        _org_id(current_user), person_type, person_id
    )


# ─── GET /incidents ───────────────────────────────────────────

@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    incident_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List incidents with optional filters."""
    return await incident_service.get_incidents(
        _org_id(current_user),
        status=status_filter,
        severity=severity,
        incident_type=incident_type,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )


# ─── POST /incidents ─────────────────────────────────────────

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    body: IncidentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new incident report."""
    return await incident_service.create_incident(
        _org_id(current_user),
        data=body.model_dump(),
        reported_by=_user_id(current_user),
        reported_by_name=_user_name(current_user),
    )


# ─── GET /incidents/{id} ─────────────────────────────────────

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single incident with full details."""
    inc = await incident_service.get_incident(_org_id(current_user), incident_id)
    if inc is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


# ─── PUT /incidents/{id} ─────────────────────────────────────

@router.put("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    body: IncidentUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an incident."""
    inc = await incident_service.update_incident(
        _org_id(current_user),
        incident_id,
        data=body.model_dump(exclude_none=True),
    )
    if inc is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


# ─── DELETE /incidents/{id} ───────────────────────────────────

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident(
    incident_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an incident."""
    deleted = await incident_service.delete_incident(_org_id(current_user), incident_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Incident not found")
    return None


# ─── POST /incidents/{id}/follow-up ──────────────────────────

@router.post("/{incident_id}/follow-up", response_model=IncidentResponse)
async def add_follow_up(
    incident_id: str,
    body: FollowUpCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a follow-up note to an incident."""
    inc = await incident_service.add_follow_up(
        _org_id(current_user),
        incident_id,
        note=body.note,
        author_id=_user_id(current_user),
        author_name=_user_name(current_user),
    )
    if inc is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


# ─── POST /incidents/{id}/resolve ────────────────────────────

@router.post("/{incident_id}/resolve", response_model=IncidentResponse)
async def resolve_incident(
    incident_id: str,
    body: ResolveRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an incident as resolved with a resolution note."""
    inc = await incident_service.resolve_incident(
        _org_id(current_user),
        incident_id,
        resolution=body.resolution,
    )
    if inc is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

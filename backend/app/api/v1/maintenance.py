"""
Camp Connect - Maintenance API Router
REST endpoints for facility maintenance requests.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.maintenance import (
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    MaintenanceRequestResponse,
    MaintenanceStats,
    AssignRequest,
    CompleteRequest,
)
from app.services import maintenance_service

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


# --- Helpers ---

def _org_id(user: Dict[str, Any]) -> str:
    return str(user["organization_id"])


def _user_id(user: Dict[str, Any]) -> str:
    return str(user["id"])


def _user_name(user: Dict[str, Any]) -> str:
    first = user.get("first_name") or ""
    last = user.get("last_name") or ""
    name = f"{first} {last}".strip()
    return name or user.get("email", "Unknown")


# --- GET /maintenance/stats ---

@router.get("/stats", response_model=MaintenanceStats)
async def maintenance_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get maintenance dashboard statistics."""
    return await maintenance_service.get_stats(_org_id(current_user))


# --- GET /maintenance ---

@router.get("", response_model=List[MaintenanceRequestResponse])
async def list_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List maintenance requests with optional filters."""
    return await maintenance_service.get_requests(
        _org_id(current_user),
        status=status_filter,
        priority=priority,
        category=category,
        search=search,
    )


# --- POST /maintenance ---

@router.post("", response_model=MaintenanceRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(
    body: MaintenanceRequestCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new maintenance request."""
    return await maintenance_service.create_request(
        _org_id(current_user),
        data=body.model_dump(),
        reported_by=_user_id(current_user),
        reported_by_name=_user_name(current_user),
    )


# --- GET /maintenance/{id} ---

@router.get("/{request_id}", response_model=MaintenanceRequestResponse)
async def get_request(
    request_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single maintenance request."""
    req = await maintenance_service.get_request(_org_id(current_user), request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return req


# --- PUT /maintenance/{id} ---

@router.put("/{request_id}", response_model=MaintenanceRequestResponse)
async def update_request(
    request_id: str,
    body: MaintenanceRequestUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a maintenance request."""
    req = await maintenance_service.update_request(
        _org_id(current_user),
        request_id,
        data=body.model_dump(exclude_none=True),
    )
    if req is None:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return req


# --- DELETE /maintenance/{id} ---

@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_request(
    request_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a maintenance request."""
    deleted = await maintenance_service.delete_request(_org_id(current_user), request_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return None


# --- POST /maintenance/{id}/assign ---

@router.post("/{request_id}/assign", response_model=MaintenanceRequestResponse)
async def assign_request(
    request_id: str,
    body: AssignRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Assign a maintenance request to a staff member."""
    req = await maintenance_service.assign_request(
        _org_id(current_user),
        request_id,
        assigned_to=body.assigned_to,
        assigned_to_name=body.assigned_to_name,
    )
    if req is None:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return req


# --- POST /maintenance/{id}/complete ---

@router.post("/{request_id}/complete", response_model=MaintenanceRequestResponse)
async def complete_request(
    request_id: str,
    body: CompleteRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a maintenance request as completed."""
    req = await maintenance_service.complete_request(
        _org_id(current_user),
        request_id,
        actual_cost=body.actual_cost,
        notes=body.notes,
    )
    if req is None:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    return req

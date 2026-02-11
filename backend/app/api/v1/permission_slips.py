"""
Camp Connect - Permission Slips API Endpoints
Digital permission slips with parent e-signatures.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.permission_slip import (
    AssignRequest,
    PermissionSlipAssignmentResponse,
    PermissionSlipCreate,
    PermissionSlipResponse,
    PermissionSlipUpdate,
    SignRequest,
    SlipStats,
)
from app.services import permission_slip_service

router = APIRouter(prefix="/permission-slips", tags=["Permission Slips"])


# ── Stats (must come before /{slip_id} routes) ────────────────────────


@router.get("/stats", response_model=SlipStats)
async def get_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get permission slip statistics."""
    return await permission_slip_service.get_stats(
        org_id=current_user["organization_id"],
    )


# ── CRUD ───────────────────────────────────────────────────────────────


@router.get("", response_model=List[PermissionSlipResponse])
async def list_slips(
    search: Optional[str] = Query(default=None, description="Search by title or description"),
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter: pending, complete"),
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """List all permission slips for the current organization."""
    return await permission_slip_service.get_slips(
        org_id=current_user["organization_id"],
        status=status_filter,
        search=search,
    )


@router.post("", response_model=PermissionSlipResponse, status_code=status.HTTP_201_CREATED)
async def create_slip(
    body: PermissionSlipCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new permission slip."""
    return await permission_slip_service.create_slip(
        org_id=current_user["organization_id"],
        user_id=str(current_user.get("user_id", "")),
        data=body.model_dump(),
    )


# ── Assignments sign (before /{slip_id} to avoid path conflict) ───────


@router.post("/assignments/{assignment_id}/sign", response_model=PermissionSlipAssignmentResponse)
async def sign_assignment(
    assignment_id: str,
    body: SignRequest,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Sign a permission slip assignment."""
    try:
        return await permission_slip_service.sign_assignment(
            org_id=current_user["organization_id"],
            assignment_id=assignment_id,
            signature_text=body.signature_text,
            ip_address=body.ip_address,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Slip-specific routes ──────────────────────────────────────────────


@router.put("/{slip_id}", response_model=PermissionSlipResponse)
async def update_slip(
    slip_id: str,
    body: PermissionSlipUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Update a permission slip."""
    try:
        return await permission_slip_service.update_slip(
            org_id=current_user["organization_id"],
            slip_id=slip_id,
            data=body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{slip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slip(
    slip_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a permission slip."""
    try:
        await permission_slip_service.delete_slip(
            org_id=current_user["organization_id"],
            slip_id=slip_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{slip_id}/assign", response_model=List[PermissionSlipAssignmentResponse])
async def assign_slip(
    slip_id: str,
    body: AssignRequest,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Assign a permission slip to campers."""
    try:
        return await permission_slip_service.assign_slip(
            org_id=current_user["organization_id"],
            slip_id=slip_id,
            camper_ids=body.camper_ids,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{slip_id}/assignments", response_model=List[PermissionSlipAssignmentResponse])
async def list_assignments(
    slip_id: str,
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by status"),
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """List assignments for a specific permission slip."""
    return await permission_slip_service.get_assignments(
        org_id=current_user["organization_id"],
        slip_id=slip_id,
        status=status_filter,
    )


@router.post("/{slip_id}/remind")
async def send_reminders(
    slip_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Send reminders for pending assignments."""
    try:
        count = await permission_slip_service.send_reminders(
            org_id=current_user["organization_id"],
            slip_id=slip_id,
        )
        return {"message": f"Reminders sent to {count} pending assignments", "count": count}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

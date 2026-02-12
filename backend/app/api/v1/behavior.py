"""
Camp Connect - Behavior Tracking API Endpoints
Full CRUD for behavior logs and statistics.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.behavior import (
    BehaviorLog,
    BehaviorLogCreate,
    BehaviorLogUpdate,
    BehaviorStats,
)
from app.services import behavior_service

router = APIRouter(prefix="/behavior", tags=["Behavior Tracking"])


# ---------------------------------------------------------------------------
# List logs
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[BehaviorLog],
)
async def list_behavior_logs(
    type: Optional[str] = Query(default=None, description="Filter by type"),
    severity: Optional[str] = Query(default=None, description="Filter by severity"),
    camper_id: Optional[uuid.UUID] = Query(default=None, description="Filter by camper"),
    search: Optional[str] = Query(default=None, description="Search description, camper, reporter"),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all behavior logs for the current organization."""
    return await behavior_service.list_logs(
        db,
        current_user["organization_id"],
        type=type,
        severity=severity,
        camper_id=camper_id,
        search=search,
    )


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=BehaviorStats,
)
async def get_behavior_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get behavior log statistics."""
    return await behavior_service.get_stats(
        db,
        current_user["organization_id"],
    )


# ---------------------------------------------------------------------------
# Get single log
# ---------------------------------------------------------------------------

@router.get(
    "/{log_id}",
    response_model=BehaviorLog,
)
async def get_behavior_log(
    log_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single behavior log by ID."""
    log = await behavior_service.get_log(
        db,
        current_user["organization_id"],
        log_id,
    )
    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Behavior log not found",
        )
    return log


# ---------------------------------------------------------------------------
# Create log
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=BehaviorLog,
    status_code=status.HTTP_201_CREATED,
)
async def create_behavior_log(
    body: BehaviorLogCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new behavior log entry."""
    return await behavior_service.create_log(
        db,
        current_user["organization_id"],
        body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Update log
# ---------------------------------------------------------------------------

@router.put(
    "/{log_id}",
    response_model=BehaviorLog,
)
async def update_behavior_log(
    log_id: uuid.UUID,
    body: BehaviorLogUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing behavior log entry."""
    log = await behavior_service.update_log(
        db,
        current_user["organization_id"],
        log_id,
        body.model_dump(exclude_unset=True),
    )
    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Behavior log not found",
        )
    return log


# ---------------------------------------------------------------------------
# Delete log
# ---------------------------------------------------------------------------

@router.delete(
    "/{log_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_behavior_log(
    log_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a behavior log entry."""
    deleted = await behavior_service.delete_log(
        db,
        current_user["organization_id"],
        log_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Behavior log not found",
        )

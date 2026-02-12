"""
Camp Connect - Announcements API Endpoints
Full CRUD for the announcement board plus stats and pin/unpin.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.announcements import (
    Announcement,
    AnnouncementCreate,
    AnnouncementStats,
    AnnouncementUpdate,
)
from app.services import announcement_service

router = APIRouter(prefix="/announcements", tags=["Announcements"])


# ---------------------------------------------------------------------------
# Stats (must be before /{id} to avoid route conflict)
# ---------------------------------------------------------------------------


@router.get(
    "/stats",
    response_model=AnnouncementStats,
)
async def get_announcement_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate announcement statistics for the current organization."""
    return await announcement_service.get_announcement_stats(
        db,
        org_id=current_user["organization_id"],
    )


# ---------------------------------------------------------------------------
# List & Create
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[Announcement],
)
async def list_announcements(
    category: Optional[str] = Query(default=None, description="Filter by category"),
    priority: Optional[str] = Query(default=None, description="Filter by priority"),
    target_audience: Optional[str] = Query(default=None, description="Filter by audience"),
    search: Optional[str] = Query(default=None, description="Search title or content"),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all announcements for the current organization with optional filters."""
    return await announcement_service.list_announcements(
        db,
        org_id=current_user["organization_id"],
        category=category,
        priority=priority,
        target_audience=target_audience,
        search=search,
    )


@router.post(
    "",
    response_model=Announcement,
    status_code=status.HTTP_201_CREATED,
)
async def create_announcement(
    body: AnnouncementCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new announcement."""
    return await announcement_service.create_announcement(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Single record: Get / Update / Delete
# ---------------------------------------------------------------------------


@router.get(
    "/{announcement_id}",
    response_model=Announcement,
)
async def get_announcement(
    announcement_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single announcement by ID."""
    record = await announcement_service.get_announcement(
        db,
        org_id=current_user["organization_id"],
        announcement_id=announcement_id,
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )
    return record


@router.put(
    "/{announcement_id}",
    response_model=Announcement,
)
async def update_announcement(
    announcement_id: uuid.UUID,
    body: AnnouncementUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing announcement."""
    record = await announcement_service.update_announcement(
        db,
        org_id=current_user["organization_id"],
        announcement_id=announcement_id,
        data=body.model_dump(exclude_unset=True),
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )
    return record


@router.delete(
    "/{announcement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_announcement(
    announcement_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete an announcement."""
    deleted = await announcement_service.delete_announcement(
        db,
        org_id=current_user["organization_id"],
        announcement_id=announcement_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )


# ---------------------------------------------------------------------------
# Pin / Unpin
# ---------------------------------------------------------------------------


@router.patch(
    "/{announcement_id}/pin",
    response_model=Announcement,
)
async def toggle_pin(
    announcement_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Toggle the pinned status of an announcement."""
    record = await announcement_service.toggle_pin(
        db,
        org_id=current_user["organization_id"],
        announcement_id=announcement_id,
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )
    return record

"""
Camp Connect - Group Notes API Endpoints
Full CRUD + filtering + stats for shift-based group notes.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.group_notes import (
    GroupNote,
    GroupNoteCreate,
    GroupNoteStats,
    GroupNoteUpdate,
)
from app.services import group_notes_service

router = APIRouter(prefix="/group-notes", tags=["Group Notes"])


@router.get(
    "",
    response_model=List[GroupNote],
)
async def list_group_notes(
    group_name: Optional[str] = Query(default=None, description="Filter by group name"),
    group_type: Optional[str] = Query(default=None, description="Filter by type (bunk, activity, age_group, custom)"),
    shift: Optional[str] = Query(default=None, description="Filter by shift (morning, afternoon, evening, overnight)"),
    priority: Optional[str] = Query(default=None, description="Filter by priority (normal, important, urgent)"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List group notes with optional filters."""
    return await group_notes_service.list_notes(
        db,
        org_id=current_user["organization_id"],
        group_name=group_name,
        group_type=group_type,
        shift=shift,
        priority=priority,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/stats",
    response_model=GroupNoteStats,
)
async def get_group_note_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate statistics for group notes."""
    return await group_notes_service.get_stats(
        db,
        org_id=current_user["organization_id"],
    )


@router.get(
    "/{note_id}",
    response_model=GroupNote,
)
async def get_group_note(
    note_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single group note by ID."""
    note = await group_notes_service.get_note(
        db,
        org_id=current_user["organization_id"],
        note_id=note_id,
    )
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group note not found",
        )
    return note


@router.post(
    "",
    response_model=GroupNote,
    status_code=status.HTTP_201_CREATED,
)
async def create_group_note(
    body: GroupNoteCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new group note."""
    return await group_notes_service.create_note(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{note_id}",
    response_model=GroupNote,
)
async def update_group_note(
    note_id: uuid.UUID,
    body: GroupNoteUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing group note."""
    note = await group_notes_service.update_note(
        db,
        org_id=current_user["organization_id"],
        note_id=note_id,
        data=body.model_dump(exclude_unset=True),
    )
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group note not found",
        )
    return note


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_group_note(
    note_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a group note."""
    deleted = await group_notes_service.delete_note(
        db,
        org_id=current_user["organization_id"],
        note_id=note_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group note not found",
        )

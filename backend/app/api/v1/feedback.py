"""
Camp Connect - Feedback API Endpoints
Full CRUD for feedback collection: entries and stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackStats,
    FeedbackUpdate,
)
from app.services import feedback_service

router = APIRouter(prefix="/feedback", tags=["Feedback"])


# ---------------------------------------------------------------------------
# List feedback entries
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[FeedbackResponse],
)
async def list_feedback(
    category: Optional[str] = Query(default=None, description="Filter by category"),
    submitter_type: Optional[str] = Query(default=None, description="Filter by submitter type"),
    feedback_status: Optional[str] = Query(default=None, alias="status", description="Filter by status"),
    rating: Optional[int] = Query(default=None, ge=1, le=5, description="Filter by rating"),
    search: Optional[str] = Query(default=None, description="Search title, comment, or submitter"),
    current_user: Dict[str, Any] = Depends(require_permission("core.feedback.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all feedback entries for the current organization."""
    return await feedback_service.list_feedback(
        db,
        current_user["organization_id"],
        category=category,
        submitter_type=submitter_type,
        status=feedback_status,
        rating=rating,
        search=search,
    )


# ---------------------------------------------------------------------------
# Get single feedback entry
# ---------------------------------------------------------------------------

@router.get(
    "/{feedback_id}",
    response_model=FeedbackResponse,
)
async def get_feedback(
    feedback_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.feedback.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single feedback entry by ID."""
    entry = await feedback_service.get_feedback(
        db,
        current_user["organization_id"],
        feedback_id,
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback entry not found",
        )
    return entry


# ---------------------------------------------------------------------------
# Create feedback entry
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_feedback(
    body: FeedbackCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.feedback.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new feedback entry."""
    return await feedback_service.create_feedback(
        db,
        current_user["organization_id"],
        data=body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Update feedback entry
# ---------------------------------------------------------------------------

@router.put(
    "/{feedback_id}",
    response_model=FeedbackResponse,
)
async def update_feedback(
    feedback_id: uuid.UUID,
    body: FeedbackUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.feedback.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update a feedback entry."""
    result = await feedback_service.update_feedback(
        db,
        current_user["organization_id"],
        feedback_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback entry not found",
        )
    return result


# ---------------------------------------------------------------------------
# Delete feedback entry
# ---------------------------------------------------------------------------

@router.delete(
    "/{feedback_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_feedback(
    feedback_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.feedback.delete")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a feedback entry."""
    deleted = await feedback_service.delete_feedback(
        db,
        current_user["organization_id"],
        feedback_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback entry not found",
        )


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@router.get(
    "/stats/summary",
    response_model=FeedbackStats,
)
async def get_feedback_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.feedback.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated feedback statistics."""
    return await feedback_service.get_stats(
        db,
        current_user["organization_id"],
    )

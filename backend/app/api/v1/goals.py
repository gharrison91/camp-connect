"""
Camp Connect - Goal Setting API Endpoints
Full CRUD for camper goals and statistics.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.goals import (
    Goal,
    GoalCreate,
    GoalUpdate,
    GoalStats,
)
from app.services import goal_service

router = APIRouter(prefix="/goals", tags=["Goals"])


# ---------------------------------------------------------------------------
# List goals
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[Goal],
)
async def list_goals(
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by status"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    camper_id: Optional[uuid.UUID] = Query(default=None, description="Filter by camper"),
    search: Optional[str] = Query(default=None, description="Search title, camper, description"),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all goals for the current organization."""
    return await goal_service.list_goals(
        db,
        current_user["organization_id"],
        status=status_filter,
        category=category,
        camper_id=camper_id,
        search=search,
    )


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=GoalStats,
)
async def get_goal_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get goal statistics for the current organization."""
    return await goal_service.get_stats(
        db,
        current_user["organization_id"],
    )


# ---------------------------------------------------------------------------
# Get single goal
# ---------------------------------------------------------------------------

@router.get(
    "/{goal_id}",
    response_model=Goal,
)
async def get_goal(
    goal_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single goal by ID."""
    goal = await goal_service.get_goal(
        db,
        current_user["organization_id"],
        goal_id,
    )
    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    return goal


# ---------------------------------------------------------------------------
# Create goal
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=Goal,
    status_code=status.HTTP_201_CREATED,
)
async def create_goal(
    body: GoalCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new camper goal."""
    return await goal_service.create_goal(
        db,
        current_user["organization_id"],
        body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Update goal
# ---------------------------------------------------------------------------

@router.put(
    "/{goal_id}",
    response_model=Goal,
)
async def update_goal(
    goal_id: uuid.UUID,
    body: GoalUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing camper goal."""
    goal = await goal_service.update_goal(
        db,
        current_user["organization_id"],
        goal_id,
        body.model_dump(exclude_unset=True),
    )
    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    return goal


# ---------------------------------------------------------------------------
# Delete goal
# ---------------------------------------------------------------------------

@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_goal(
    goal_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a camper goal."""
    deleted = await goal_service.delete_goal(
        db,
        current_user["organization_id"],
        goal_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

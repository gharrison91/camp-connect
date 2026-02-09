"""
Camp Connect - Activity API Endpoints
Full CRUD for camp activities.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate
from app.services import activity_service

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get(
    "",
    response_model=List[ActivityResponse],
)
async def list_activities(
    search: Optional[str] = Query(default=None, description="Search by activity name"),
    category: Optional[str] = Query(
        default=None, description="Filter by category (sports, arts, nature, water, education, other)"
    ),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all activities for the current organization."""
    return await activity_service.list_activities(
        db,
        organization_id=current_user["organization_id"],
        category=category,
        is_active=is_active,
        search=search,
    )


@router.get(
    "/{activity_id}",
    response_model=ActivityResponse,
)
async def get_activity(
    activity_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single activity by ID."""
    activity = await activity_service.get_activity(
        db,
        organization_id=current_user["organization_id"],
        activity_id=activity_id,
    )
    if activity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )
    return activity


@router.post(
    "",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_activity(
    body: ActivityCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new activity."""
    try:
        return await activity_service.create_activity(
            db,
            organization_id=current_user["organization_id"],
            data=body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/{activity_id}",
    response_model=ActivityResponse,
)
async def update_activity(
    activity_id: uuid.UUID,
    body: ActivityUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an activity."""
    result = await activity_service.update_activity(
        db,
        organization_id=current_user["organization_id"],
        activity_id=activity_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )
    return result


@router.delete(
    "/{activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_activity(
    activity_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.activities.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) an activity."""
    deleted = await activity_service.delete_activity(
        db,
        organization_id=current_user["organization_id"],
        activity_id=activity_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )

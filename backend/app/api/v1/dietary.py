"""
Camp Connect - Dietary Restrictions API Endpoints
CRUD and statistics for camper dietary restrictions.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.dietary import (
    DietaryRestriction,
    DietaryRestrictionCreate,
    DietaryRestrictionUpdate,
    DietaryStats,
)
from app.services import dietary_service

router = APIRouter(prefix="/dietary", tags=["Dietary"])


# ---------------------------------------------------------------------------
# List / Read
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[DietaryRestriction],
)
async def list_restrictions(
    restriction_type: Optional[str] = Query(
        default=None,
        description="Filter by type (food_allergy, intolerance, preference, medical, religious)",
    ),
    severity: Optional[str] = Query(
        default=None,
        description="Filter by severity (mild, moderate, severe)",
    ),
    search: Optional[str] = Query(default=None, description="Search restriction or camper name"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all dietary restrictions with optional filters."""
    return await dietary_service.list_restrictions(
        db,
        org_id=current_user["organization_id"],
        restriction_type=restriction_type,
        severity=severity,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/stats",
    response_model=DietaryStats,
)
async def get_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate dietary restriction statistics."""
    return await dietary_service.get_stats(
        db,
        org_id=current_user["organization_id"],
    )


@router.get(
    "/{restriction_id}",
    response_model=DietaryRestriction,
)
async def get_restriction(
    restriction_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single dietary restriction by ID."""
    entry = await dietary_service.get_restriction(
        db,
        org_id=current_user["organization_id"],
        restriction_id=restriction_id,
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dietary restriction not found",
        )
    return entry


# ---------------------------------------------------------------------------
# Create / Update / Delete
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=DietaryRestriction,
    status_code=status.HTTP_201_CREATED,
)
async def create_restriction(
    body: DietaryRestrictionCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new dietary restriction for a camper."""
    return await dietary_service.create_restriction(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{restriction_id}",
    response_model=DietaryRestriction,
)
async def update_restriction(
    restriction_id: uuid.UUID,
    body: DietaryRestrictionUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing dietary restriction."""
    entry = await dietary_service.update_restriction(
        db,
        org_id=current_user["organization_id"],
        restriction_id=restriction_id,
        data=body.model_dump(exclude_unset=True),
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dietary restriction not found",
        )
    return entry


@router.delete(
    "/{restriction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_restriction(
    restriction_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a dietary restriction."""
    deleted = await dietary_service.delete_restriction(
        db,
        org_id=current_user["organization_id"],
        restriction_id=restriction_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dietary restriction not found",
        )

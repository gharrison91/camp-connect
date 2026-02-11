"""
Camp Connect - Alumni Network API Endpoints
Full CRUD for alumni directory plus stats aggregation.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.alumni import (
    AlumniCreate,
    AlumniResponse,
    AlumniStats,
    AlumniUpdate,
)
from app.services import alumni_service

router = APIRouter(prefix="/alumni", tags=["Alumni"])


# ---------------------------------------------------------------------------
# Stats (must be before /{id} to avoid route conflict)
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=AlumniStats,
)
async def get_alumni_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate alumni statistics for the current organization."""
    return await alumni_service.get_alumni_stats(
        db,
        org_id=current_user["organization_id"],
    )


# ---------------------------------------------------------------------------
# List & Create
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[AlumniResponse],
)
async def list_alumni(
    search: Optional[str] = Query(default=None, description="Search by name or email"),
    role: Optional[str] = Query(default=None, description="Filter by role (camper, staff, both)"),
    graduation_year: Optional[int] = Query(default=None, description="Filter by graduation year"),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all alumni for the current organization with optional filters."""
    return await alumni_service.list_alumni(
        db,
        org_id=current_user["organization_id"],
        search=search,
        role=role,
        graduation_year=graduation_year,
    )


@router.post(
    "",
    response_model=AlumniResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_alumni(
    body: AlumniCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new alumni record."""
    return await alumni_service.create_alumni(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Single record: Get / Update / Delete
# ---------------------------------------------------------------------------

@router.get(
    "/{alumni_id}",
    response_model=AlumniResponse,
)
async def get_alumni(
    alumni_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single alumni record by ID."""
    record = await alumni_service.get_alumni(
        db,
        org_id=current_user["organization_id"],
        alumni_id=alumni_id,
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumni record not found",
        )
    return record


@router.put(
    "/{alumni_id}",
    response_model=AlumniResponse,
)
async def update_alumni(
    alumni_id: uuid.UUID,
    body: AlumniUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing alumni record."""
    record = await alumni_service.update_alumni(
        db,
        org_id=current_user["organization_id"],
        alumni_id=alumni_id,
        data=body.model_dump(exclude_unset=True),
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumni record not found",
        )
    return record


@router.delete(
    "/{alumni_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_alumni(
    alumni_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete an alumni record."""
    deleted = await alumni_service.delete_alumni(
        db,
        org_id=current_user["organization_id"],
        alumni_id=alumni_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumni record not found",
        )

"""
Camp Connect - Allergy Matrix API Endpoints
CRUD, matrix view, and statistics for camper allergies.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.allergy_matrix import (
    AllergyCreate,
    AllergyEntry,
    AllergyMatrixRow,
    AllergyStats,
    AllergyUpdate,
)
from app.services import allergy_service

router = APIRouter(prefix="/allergy-matrix", tags=["Allergy Matrix"])


# ---------------------------------------------------------------------------
# List / Read
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[AllergyEntry],
)
async def list_allergies(
    allergy_type: Optional[str] = Query(
        default=None,
        description="Filter by type (food, environmental, medication, insect, other)",
    ),
    severity: Optional[str] = Query(
        default=None,
        description="Filter by severity (mild, moderate, severe, life_threatening)",
    ),
    search: Optional[str] = Query(default=None, description="Search allergen or camper name"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all allergy entries with optional filters."""
    return await allergy_service.list_allergies(
        db,
        org_id=current_user["organization_id"],
        allergy_type=allergy_type,
        severity=severity,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/stats",
    response_model=AllergyStats,
)
async def get_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate allergy statistics."""
    return await allergy_service.get_stats(
        db,
        org_id=current_user["organization_id"],
    )


@router.get(
    "/matrix",
    response_model=List[AllergyMatrixRow],
)
async def get_matrix(
    allergy_type: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get the allergy matrix (campers x allergens) for visual grid display."""
    return await allergy_service.get_matrix(
        db,
        org_id=current_user["organization_id"],
        allergy_type=allergy_type,
        severity=severity,
    )


@router.get(
    "/{allergy_id}",
    response_model=AllergyEntry,
)
async def get_allergy(
    allergy_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single allergy entry by ID."""
    entry = await allergy_service.get_allergy(
        db,
        org_id=current_user["organization_id"],
        allergy_id=allergy_id,
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Allergy entry not found",
        )
    return entry


# ---------------------------------------------------------------------------
# Create / Update / Delete
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=AllergyEntry,
    status_code=status.HTTP_201_CREATED,
)
async def create_allergy(
    body: AllergyCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new allergy entry for a camper."""
    return await allergy_service.create_allergy(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{allergy_id}",
    response_model=AllergyEntry,
)
async def update_allergy(
    allergy_id: uuid.UUID,
    body: AllergyUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing allergy entry."""
    entry = await allergy_service.update_allergy(
        db,
        org_id=current_user["organization_id"],
        allergy_id=allergy_id,
        data=body.model_dump(exclude_unset=True),
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Allergy entry not found",
        )
    return entry


@router.delete(
    "/{allergy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_allergy(
    allergy_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete an allergy entry."""
    deleted = await allergy_service.delete_allergy(
        db,
        org_id=current_user["organization_id"],
        allergy_id=allergy_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Allergy entry not found",
        )

"""
Camp Connect - Family API Endpoints
CRUD for families (household grouping of campers and contacts).
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.family import (
    AddCamperRequest,
    AddContactRequest,
    FamilyCreate,
    FamilyListItem,
    FamilyResponse,
    FamilyUpdate,
)
from app.services import family_service

router = APIRouter(prefix="/families", tags=["Families"])


@router.get(
    "",
    response_model=List[FamilyListItem],
)
async def list_families(
    search: Optional[str] = Query(default=None, description="Search by family name"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.families.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all families for the current organization."""
    return await family_service.list_families(
        db,
        organization_id=current_user["organization_id"],
        search=search,
    )


@router.get(
    "/{family_id}",
    response_model=FamilyResponse,
)
async def get_family(
    family_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.families.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single family by ID with all members."""
    family = await family_service.get_family(
        db,
        organization_id=current_user["organization_id"],
        family_id=family_id,
    )
    if family is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found",
        )
    return family


@router.post(
    "",
    response_model=FamilyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_family(
    body: FamilyCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.families.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new family."""
    return await family_service.create_family(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{family_id}",
    response_model=FamilyResponse,
)
async def update_family(
    family_id: uuid.UUID,
    body: FamilyUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.families.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a family."""
    result = await family_service.update_family(
        db,
        organization_id=current_user["organization_id"],
        family_id=family_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found",
        )
    return result


@router.post(
    "/{family_id}/campers",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def add_camper_to_family(
    family_id: uuid.UUID,
    body: AddCamperRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.families.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Add a camper to a family."""
    success = await family_service.add_camper_to_family(
        db,
        organization_id=current_user["organization_id"],
        family_id=family_id,
        camper_id=body.camper_id,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family or camper not found",
        )


@router.post(
    "/{family_id}/contacts",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def add_contact_to_family(
    family_id: uuid.UUID,
    body: AddContactRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.families.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Add a contact to a family."""
    success = await family_service.add_contact_to_family(
        db,
        organization_id=current_user["organization_id"],
        family_id=family_id,
        contact_id=body.contact_id,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family or contact not found",
        )


@router.delete(
    "/{family_id}/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_member_from_family(
    family_id: uuid.UUID,
    member_id: uuid.UUID,
    member_type: str = Query(
        ..., description="Type of member to remove", pattern="^(camper|contact)$"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.families.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Remove a camper or contact from a family (unlinks, does not delete)."""
    success = await family_service.remove_member_from_family(
        db,
        organization_id=current_user["organization_id"],
        family_id=family_id,
        member_id=member_id,
        member_type=member_type,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this family",
        )

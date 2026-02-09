"""
Camp Connect - Camper API Endpoints
CRUD for campers (children/participants) with contact linking.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.camper import CamperContactLink, CamperCreate, CamperResponse, CamperUpdate
from app.services import camper_service
from app.services.camper_profile_service import get_camper_profile

router = APIRouter(prefix="/campers", tags=["Campers"])


@router.get("")
async def list_campers(
    search: Optional[str] = Query(default=None, description="Search by camper name"),
    event_id: Optional[uuid.UUID] = Query(default=None, description="Filter by event"),
    age_min: Optional[int] = Query(default=None, description="Minimum age"),
    age_max: Optional[int] = Query(default=None, description="Maximum age"),
    skip: int = Query(default=0, ge=0, description="Pagination offset"),
    limit: int = Query(default=50, ge=1, le=100, description="Page size"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List campers with optional filters and pagination."""
    return await camper_service.list_campers(
        db,
        organization_id=current_user["organization_id"],
        search=search,
        event_id=event_id,
        age_min=age_min,
        age_max=age_max,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{camper_id}",
    response_model=CamperResponse,
)
async def get_camper(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single camper with contacts and registrations."""
    camper = await camper_service.get_camper(
        db,
        organization_id=current_user["organization_id"],
        camper_id=camper_id,
    )
    if camper is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camper not found",
        )
    return camper


@router.get("/{camper_id}/profile")
async def get_camper_profile_endpoint(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a comprehensive camper profile aggregating data from multiple tables."""
    profile = await get_camper_profile(
        db,
        organization_id=current_user["organization_id"],
        camper_id=camper_id,
    )
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camper not found",
        )
    return profile


@router.post(
    "",
    response_model=CamperResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_camper(
    body: CamperCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new camper, optionally linking contacts."""
    data = body.model_dump(exclude={"contacts"})
    contacts = None
    if body.contacts:
        contacts = [c.model_dump() for c in body.contacts]

    return await camper_service.create_camper(
        db,
        organization_id=current_user["organization_id"],
        data=data,
        contacts=contacts,
    )


@router.put(
    "/{camper_id}",
    response_model=CamperResponse,
)
async def update_camper(
    camper_id: uuid.UUID,
    body: CamperUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a camper."""
    result = await camper_service.update_camper(
        db,
        organization_id=current_user["organization_id"],
        camper_id=camper_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camper not found",
        )
    return result


@router.delete(
    "/{camper_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_camper(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) a camper."""
    deleted = await camper_service.delete_camper(
        db,
        organization_id=current_user["organization_id"],
        camper_id=camper_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camper not found",
        )


# ─── Contact Linking ────────────────────────────────────────────


@router.post(
    "/{camper_id}/contacts",
    status_code=status.HTTP_201_CREATED,
)
async def link_contact(
    camper_id: uuid.UUID,
    body: CamperContactLink,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Link a contact to a camper."""
    try:
        return await camper_service.link_contact(
            db,
            organization_id=current_user["organization_id"],
            camper_id=camper_id,
            contact_id=body.contact_id,
            relationship_type=body.relationship_type,
            is_primary=body.is_primary,
            is_emergency=body.is_emergency,
            is_authorized_pickup=body.is_authorized_pickup,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{camper_id}/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unlink_contact(
    camper_id: uuid.UUID,
    contact_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.campers.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Unlink a contact from a camper."""
    deleted = await camper_service.unlink_contact(
        db,
        organization_id=current_user["organization_id"],
        camper_id=camper_id,
        contact_id=contact_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact link not found",
        )

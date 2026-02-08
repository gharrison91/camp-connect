"""
Camp Connect - Organization API Endpoints
Get and update the current organization.
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.schemas.organization import OrganizationResponse, OrganizationUpdate
from app.services import org_service

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get(
    "/me",
    response_model=OrganizationResponse,
)
async def get_my_organization(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's organization details."""
    org = await org_service.get_organization(
        db, organization_id=current_user["organization_id"]
    )
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return org


@router.put(
    "/me",
    response_model=OrganizationResponse,
)
async def update_my_organization(
    body: OrganizationUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update the current organization's details.
    Requires core.settings.manage permission.
    """
    try:
        org = await org_service.update_organization(
            db,
            organization_id=current_user["organization_id"],
            data=body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return org

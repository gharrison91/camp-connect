"""
Camp Connect - Referrals API Endpoints
Full CRUD for the referral tracking system.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.referral import (
    Referral,
    ReferralCreate,
    ReferralStats,
    ReferralUpdate,
)
from app.services import referral_service

router = APIRouter(prefix="/referrals", tags=["Referrals"])


# ---------------------------------------------------------------------------
# List referrals
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[Referral],
)
async def list_referrals(
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        description="Filter by status (pending, contacted, registered, completed, expired)",
    ),
    source: Optional[str] = Query(
        default=None,
        description="Filter by source (word_of_mouth, social_media, website, event, other)",
    ),
    search: Optional[str] = Query(
        default=None,
        description="Search referrer or referred name/email",
    ),
    current_user: Dict[str, Any] = Depends(require_permission("core.contacts.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all referrals for the current organization."""
    return await referral_service.list_referrals(
        db,
        current_user["organization_id"],
        status=status_filter,
        source=source,
        search=search,
    )


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=ReferralStats,
)
async def get_referral_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.contacts.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get referral statistics for the current organization."""
    return await referral_service.get_stats(
        db,
        current_user["organization_id"],
    )


# ---------------------------------------------------------------------------
# Get single referral
# ---------------------------------------------------------------------------

@router.get(
    "/{referral_id}",
    response_model=Referral,
)
async def get_referral(
    referral_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.contacts.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single referral by ID."""
    referral = await referral_service.get_referral(
        db,
        current_user["organization_id"],
        referral_id,
    )
    if referral is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found",
        )
    return referral


# ---------------------------------------------------------------------------
# Create referral
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=Referral,
    status_code=status.HTTP_201_CREATED,
)
async def create_referral(
    body: ReferralCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.contacts.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new referral."""
    return await referral_service.create_referral(
        db,
        current_user["organization_id"],
        body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Update referral
# ---------------------------------------------------------------------------

@router.put(
    "/{referral_id}",
    response_model=Referral,
)
async def update_referral(
    referral_id: uuid.UUID,
    body: ReferralUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.contacts.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing referral."""
    referral = await referral_service.update_referral(
        db,
        current_user["organization_id"],
        referral_id,
        body.model_dump(exclude_unset=True),
    )
    if referral is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found",
        )
    return referral


# ---------------------------------------------------------------------------
# Delete referral
# ---------------------------------------------------------------------------

@router.delete(
    "/{referral_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_referral(
    referral_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.contacts.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a referral."""
    deleted = await referral_service.delete_referral(
        db,
        current_user["organization_id"],
        referral_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found",
        )

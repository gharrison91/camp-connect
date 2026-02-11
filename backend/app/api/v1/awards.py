"""
Camp Connect - Awards API Endpoints
Full CRUD for badges, grants, leaderboard, and stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.award import (
    AwardBadgeCreate,
    AwardBadgeResponse,
    AwardBadgeUpdate,
    AwardGrantCreate,
    AwardGrantResponse,
    AwardStats,
    CamperAwardsSummary,
    LeaderboardEntry,
)
from app.services import award_service

router = APIRouter(prefix="/awards", tags=["Awards"])


# ---------------------------------------------------------------------------
# Badge CRUD
# ---------------------------------------------------------------------------


@router.get(
    "/badges",
    response_model=List[AwardBadgeResponse],
)
async def list_badges(
    category: Optional[str] = Query(
        default=None,
        description="Filter by category (skill, behavior, achievement, milestone, special)",
    ),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all award badges for the current organization."""
    return await award_service.get_badges(
        db,
        org_id=current_user["organization_id"],
        category=category,
    )


@router.get(
    "/badges/{badge_id}",
    response_model=AwardBadgeResponse,
)
async def get_badge(
    badge_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single badge by ID."""
    badge = await award_service.get_badge(
        db,
        org_id=current_user["organization_id"],
        badge_id=badge_id,
    )
    if badge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found",
        )
    return badge


@router.post(
    "/badges",
    response_model=AwardBadgeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_badge(
    body: AwardBadgeCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new award badge."""
    return await award_service.create_badge(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/badges/{badge_id}",
    response_model=AwardBadgeResponse,
)
async def update_badge(
    badge_id: uuid.UUID,
    body: AwardBadgeUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing badge."""
    badge = await award_service.update_badge(
        db,
        org_id=current_user["organization_id"],
        badge_id=badge_id,
        data=body.model_dump(exclude_unset=True),
    )
    if badge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found",
        )
    return badge


@router.delete(
    "/badges/{badge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_badge(
    badge_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a badge (cascades to all grants)."""
    deleted = await award_service.delete_badge(
        db,
        org_id=current_user["organization_id"],
        badge_id=badge_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found",
        )


# ---------------------------------------------------------------------------
# Badge recipients
# ---------------------------------------------------------------------------


@router.get(
    "/badges/{badge_id}/recipients",
    response_model=List[AwardGrantResponse],
)
async def get_badge_recipients(
    badge_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all campers who have earned a specific badge."""
    return await award_service.get_badge_recipients(
        db,
        org_id=current_user["organization_id"],
        badge_id=badge_id,
    )


# ---------------------------------------------------------------------------
# Grants (give / revoke awards)
# ---------------------------------------------------------------------------


@router.post(
    "/grants",
    response_model=AwardGrantResponse,
    status_code=status.HTTP_201_CREATED,
)
async def grant_award(
    body: AwardGrantCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Grant an award badge to a camper."""
    try:
        return await award_service.grant_award(
            db,
            org_id=current_user["organization_id"],
            badge_id=body.badge_id,
            camper_id=body.camper_id,
            granted_by=current_user["user_id"],
            reason=body.reason,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to grant award: {str(e)}",
        )


@router.delete(
    "/grants/{grant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_award(
    grant_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a previously granted award."""
    revoked = await award_service.revoke_award(
        db,
        org_id=current_user["organization_id"],
        grant_id=grant_id,
    )
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Award grant not found",
        )


# ---------------------------------------------------------------------------
# Camper awards
# ---------------------------------------------------------------------------


@router.get(
    "/campers/{camper_id}/awards",
    response_model=List[AwardGrantResponse],
)
async def get_camper_awards(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all awards for a specific camper."""
    return await award_service.get_camper_awards(
        db,
        org_id=current_user["organization_id"],
        camper_id=camper_id,
    )


@router.get(
    "/campers/{camper_id}/summary",
    response_model=CamperAwardsSummary,
)
async def get_camper_summary(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get award summary for a camper (total points, badges, recent)."""
    return await award_service.get_award_summary(
        db,
        org_id=current_user["organization_id"],
        camper_id=camper_id,
    )


# ---------------------------------------------------------------------------
# Leaderboard & Stats
# ---------------------------------------------------------------------------


@router.get(
    "/leaderboard",
    response_model=List[LeaderboardEntry],
)
async def get_leaderboard(
    limit: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = Query(
        default=None,
        description="Filter by badge category",
    ),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get the awards leaderboard ranked by total points."""
    return await award_service.get_leaderboard(
        db,
        org_id=current_user["organization_id"],
        limit=limit,
        category=category,
    )


@router.get(
    "/recent",
    response_model=List[AwardGrantResponse],
)
async def get_recent_awards(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get recent award activity feed."""
    return await award_service.get_recent_awards(
        db,
        org_id=current_user["organization_id"],
        limit=limit,
    )


@router.get(
    "/stats",
    response_model=AwardStats,
)
async def get_award_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get overall award statistics."""
    return await award_service.get_award_stats(
        db,
        org_id=current_user["organization_id"],
    )

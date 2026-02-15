"""
Camp Connect - Deal / CRM Pipeline API Endpoints
Full CRUD + stage management for deal pipeline.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.schemas.deal import DealCreate, DealUpdate, DealStageUpdate
from app.services import deal_service

router = APIRouter(prefix="/deals", tags=["Deals"])


@router.get(
    "/pipeline",
)
async def get_pipeline(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get deals grouped by stage with counts and total values."""
    return await deal_service.get_pipeline(
        db,
        organization_id=current_user["organization_id"],
    )


@router.get(
    "",
)
async def list_deals(
    stage: Optional[str] = Query(default=None, description="Filter by stage"),
    assigned_to: Optional[uuid.UUID] = Query(default=None, description="Filter by assigned staff"),
    search: Optional[str] = Query(default=None, description="Search by title"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all deals with optional filters."""
    return await deal_service.list_deals(
        db,
        organization_id=current_user["organization_id"],
        stage=stage,
        assigned_to=assigned_to,
        search=search,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_deal(
    body: DealCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new deal."""
    return await deal_service.create_deal(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(exclude_unset=True),
    )


@router.get(
    "/{deal_id}",
)
async def get_deal(
    deal_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single deal by ID."""
    result = await deal_service.get_deal(
        db,
        organization_id=current_user["organization_id"],
        deal_id=deal_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    return result


@router.put(
    "/{deal_id}",
)
async def update_deal(
    deal_id: uuid.UUID,
    body: DealUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing deal."""
    result = await deal_service.update_deal(
        db,
        organization_id=current_user["organization_id"],
        deal_id=deal_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    return result


@router.delete(
    "/{deal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_deal(
    deal_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a deal."""
    deleted = await deal_service.delete_deal(
        db,
        organization_id=current_user["organization_id"],
        deal_id=deal_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )


@router.put(
    "/{deal_id}/stage",
)
async def move_deal_stage(
    deal_id: uuid.UUID,
    body: DealStageUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Move a deal to a new stage."""
    result = await deal_service.move_deal_stage(
        db,
        organization_id=current_user["organization_id"],
        deal_id=deal_id,
        stage=body.stage,
        position=body.position,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    return result

"""
Camp Connect - Visitor Management API Endpoints
Full CRUD, check-in/out, pre-register, current visitors, log, stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.visitor import (
    VisitorCreate,
    VisitorResponse,
    VisitorStats,
    VisitorUpdate,
)
from app.services import visitor_service

router = APIRouter(prefix="/visitors", tags=["Visitors"])


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[VisitorResponse],
)
async def list_visitors(
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by visitor status"
    ),
    visitor_type: Optional[str] = Query(
        default=None, description="Filter by visitor type"
    ),
    date_from: Optional[str] = Query(
        default=None, description="Filter from date (YYYY-MM-DD)"
    ),
    date_to: Optional[str] = Query(
        default=None, description="Filter to date (YYYY-MM-DD)"
    ),
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all visitors for the current organization."""
    return await visitor_service.list_visitors(
        current_user["organization_id"],
        status=status_filter,
        visitor_type=visitor_type,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/current",
    response_model=List[VisitorResponse],
)
async def get_current_visitors(
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all currently checked-in visitors."""
    return await visitor_service.get_current_visitors(
        current_user["organization_id"]
    )


@router.get(
    "/log",
    response_model=List[VisitorResponse],
)
async def get_visitor_log(
    date_from: Optional[str] = Query(default=None),
    date_to: Optional[str] = Query(default=None),
    visitor_type: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get the visitor log with optional filters."""
    return await visitor_service.get_visitor_log(
        current_user["organization_id"],
        date_from=date_from,
        date_to=date_to,
        visitor_type=visitor_type,
        status=status_filter,
    )


@router.get(
    "/stats",
    response_model=VisitorStats,
)
async def get_visitor_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get visitor statistics for today."""
    return await visitor_service.get_stats(
        current_user["organization_id"]
    )


@router.get(
    "/{visitor_id}",
    response_model=VisitorResponse,
)
async def get_visitor(
    visitor_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single visitor by ID."""
    visitor = await visitor_service.get_visitor(
        current_user["organization_id"], visitor_id
    )
    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found"
        )
    return visitor


@router.post(
    "",
    response_model=VisitorResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_visitor(
    body: VisitorCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new visitor record."""
    return await visitor_service.create_visitor(
        current_user["organization_id"],
        body.model_dump(),
    )


@router.put(
    "/{visitor_id}",
    response_model=VisitorResponse,
)
async def update_visitor(
    visitor_id: uuid.UUID,
    body: VisitorUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update a visitor record."""
    visitor = await visitor_service.update_visitor(
        current_user["organization_id"],
        visitor_id,
        body.model_dump(exclude_unset=True),
    )
    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found"
        )
    return visitor


@router.delete(
    "/{visitor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_visitor(
    visitor_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a visitor record."""
    deleted = await visitor_service.delete_visitor(
        current_user["organization_id"], visitor_id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found"
        )
    return None


# ---------------------------------------------------------------------------
# Check-in / Check-out
# ---------------------------------------------------------------------------


@router.post(
    "/{visitor_id}/check-in",
    response_model=VisitorResponse,
)
async def check_in_visitor(
    visitor_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Check in a visitor."""
    visitor = await visitor_service.check_in(
        current_user["organization_id"], visitor_id
    )
    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found"
        )
    return visitor


@router.post(
    "/{visitor_id}/check-out",
    response_model=VisitorResponse,
)
async def check_out_visitor(
    visitor_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Check out a visitor."""
    visitor = await visitor_service.check_out(
        current_user["organization_id"], visitor_id
    )
    if visitor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Visitor not found"
        )
    return visitor


# ---------------------------------------------------------------------------
# Pre-register
# ---------------------------------------------------------------------------


@router.post(
    "/pre-register",
    response_model=VisitorResponse,
    status_code=status.HTTP_201_CREATED,
)
async def pre_register_visitor(
    body: VisitorCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Pre-register a visitor for an expected visit."""
    return await visitor_service.pre_register(
        current_user["organization_id"],
        body.model_dump(),
    )

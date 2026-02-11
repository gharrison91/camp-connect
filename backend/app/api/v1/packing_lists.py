"""
Camp Connect - Packing Lists API Endpoints
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.packing_list import (
    PackingListAssignmentResponse,
    PackingListAssignRequest,
    PackingListCheckRequest,
    PackingListStats,
    PackingListTemplateCreate,
    PackingListTemplateResponse,
    PackingListTemplateUpdate,
)
from app.services import packing_list_service

router = APIRouter(prefix="/packing-lists", tags=["Packing Lists"])


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------


@router.get(
    "/templates",
    response_model=List[PackingListTemplateResponse],
)
async def list_templates(
    current_user: Dict[str, Any] = Depends(require_permission("core.events.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all packing list templates for the organization."""
    return await packing_list_service.get_templates(current_user["organization_id"])


@router.post(
    "/templates",
    response_model=PackingListTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_template(
    data: PackingListTemplateCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.events.read")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new packing list template."""
    return await packing_list_service.create_template(
        current_user["organization_id"],
        data.model_dump(),
    )


@router.put(
    "/templates/{template_id}",
    response_model=PackingListTemplateResponse,
)
async def update_template(
    template_id: uuid.UUID,
    data: PackingListTemplateUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.events.read")),
    db: AsyncSession = Depends(get_db),
):
    """Update a packing list template."""
    result = await packing_list_service.update_template(
        current_user["organization_id"],
        template_id,
        data.model_dump(exclude_none=True),
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return result


@router.delete(
    "/templates/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_template(
    template_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.events.read")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a packing list template and its assignments."""
    deleted = await packing_list_service.delete_template(
        current_user["organization_id"], template_id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Template not found")


# ---------------------------------------------------------------------------
# Assignments
# ---------------------------------------------------------------------------


@router.post(
    "/assign",
    response_model=List[PackingListAssignmentResponse],
    status_code=status.HTTP_201_CREATED,
)
async def assign_template(
    data: PackingListAssignRequest,
    current_user: Dict[str, Any] = Depends(require_permission("core.events.read")),
    db: AsyncSession = Depends(get_db),
):
    """Assign a packing list template to one or more campers."""
    return await packing_list_service.assign_template(
        current_user["organization_id"],
        data.template_id,
        data.camper_ids,
    )


@router.get(
    "/assignments",
    response_model=List[PackingListAssignmentResponse],
)
async def list_assignments(
    template_id: Optional[uuid.UUID] = Query(default=None),
    camper_id: Optional[uuid.UUID] = Query(default=None),
    current_user: Dict[str, Any] = Depends(require_permission("core.events.read")),
    db: AsyncSession = Depends(get_db),
):
    """List packing list assignments, optionally filtered."""
    return await packing_list_service.get_assignments(
        current_user["organization_id"],
        template_id=template_id,
        camper_id=camper_id,
    )


@router.post(
    "/assignments/{assignment_id}/check",
    response_model=PackingListAssignmentResponse,
)
async def check_item(
    assignment_id: uuid.UUID,
    data: PackingListCheckRequest,
    current_user: Dict[str, Any] = Depends(require_permission("core.events.read")),
    db: AsyncSession = Depends(get_db),
):
    """Toggle a packing list item as checked/unchecked."""
    result = await packing_list_service.check_item(
        current_user["organization_id"],
        assignment_id,
        data.item_name,
        data.checked,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return result


@router.get(
    "/stats",
    response_model=PackingListStats,
)
async def get_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.events.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get packing list completion statistics."""
    return await packing_list_service.get_stats(current_user["organization_id"])

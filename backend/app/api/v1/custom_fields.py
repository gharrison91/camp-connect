"""
Camp Connect - Custom Fields API Endpoints
Full CRUD for custom field definitions and values.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.custom_field import (
    CustomFieldDefinitionCreate,
    CustomFieldDefinitionUpdate,
    ReorderRequest,
    BulkSaveRequest,
)
from app.services import custom_field_service

router = APIRouter(prefix="/custom-fields", tags=["Custom Fields"])


# ─── Definitions ─────────────────────────────────────────────


@router.get("/definitions")
async def list_definitions(
    entity_type: Optional[str] = Query(default=None, description="Filter by entity type"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all custom field definitions, optionally filtered by entity type."""
    return await custom_field_service.list_definitions(
        db,
        organization_id=current_user["organization_id"],
        entity_type=entity_type,
    )


@router.post(
    "/definitions",
    status_code=status.HTTP_201_CREATED,
)
async def create_definition(
    body: CustomFieldDefinitionCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new custom field definition."""
    return await custom_field_service.create_definition(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(exclude_unset=True),
    )


@router.put("/definitions/{definition_id}")
async def update_definition(
    definition_id: uuid.UUID,
    body: CustomFieldDefinitionUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing custom field definition."""
    result = await custom_field_service.update_definition(
        db,
        organization_id=current_user["organization_id"],
        definition_id=definition_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom field definition not found",
        )
    return result


@router.delete(
    "/definitions/{definition_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_definition(
    definition_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a custom field definition and all its values."""
    deleted = await custom_field_service.delete_definition(
        db,
        organization_id=current_user["organization_id"],
        definition_id=definition_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom field definition not found",
        )


@router.put("/definitions/reorder")
async def reorder_definitions(
    body: ReorderRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Reorder custom field definitions."""
    items = [item.model_dump() for item in body.items]
    return await custom_field_service.reorder_definitions(
        db,
        organization_id=current_user["organization_id"],
        items=items,
    )


# ─── Values ─────────────────────────────────────────────────


@router.get("/values/{entity_type}/{entity_id}")
async def get_values(
    entity_type: str,
    entity_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get all custom field values for a specific entity."""
    return await custom_field_service.get_values(
        db,
        organization_id=current_user["organization_id"],
        entity_type=entity_type,
        entity_id=entity_id,
    )


@router.put("/values/{entity_type}/{entity_id}")
async def save_values(
    entity_type: str,
    entity_id: uuid.UUID,
    body: BulkSaveRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Bulk save/update custom field values for an entity."""
    values = [v.model_dump() for v in body.values]
    return await custom_field_service.save_values(
        db,
        organization_id=current_user["organization_id"],
        entity_type=entity_type,
        entity_id=entity_id,
        values=values,
    )


@router.delete(
    "/values/{entity_type}/{entity_id}/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_value(
    entity_type: str,
    entity_id: uuid.UUID,
    field_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a specific custom field value."""
    deleted = await custom_field_service.delete_value(
        db,
        organization_id=current_user["organization_id"],
        entity_type=entity_type,
        entity_id=entity_id,
        field_id=field_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom field value not found",
        )

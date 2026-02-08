"""
Camp Connect - Roles API Endpoints
Full CRUD for custom roles and permissions.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.schemas.role import RoleCreate, RoleResponse, RoleUpdate
from app.services import role_service

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get(
    "",
    response_model=List[RoleResponse],
)
async def list_roles(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all roles for the current organization."""
    roles = await role_service.list_roles(
        db, organization_id=current_user["organization_id"]
    )
    return roles


@router.get(
    "/{role_id}",
    response_model=RoleResponse,
)
async def get_role(
    role_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single role with permissions."""
    role = await role_service.get_role(
        db,
        role_id=role_id,
        organization_id=current_user["organization_id"],
    )
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return role


@router.post(
    "",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_role(
    body: RoleCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.roles.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new custom role. Requires core.roles.manage permission."""
    try:
        role = await role_service.create_role(
            db,
            organization_id=current_user["organization_id"],
            name=body.name,
            description=body.description,
            permissions=body.permissions,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return role


@router.put(
    "/{role_id}",
    response_model=RoleResponse,
)
async def update_role(
    role_id: uuid.UUID,
    body: RoleUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.roles.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a role's name, description, and/or permissions."""
    try:
        role = await role_service.update_role(
            db,
            role_id=role_id,
            organization_id=current_user["organization_id"],
            data=body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return role


@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_role(
    role_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.roles.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a custom role.
    Cannot delete system roles or roles with assigned users.
    """
    try:
        await role_service.delete_role(
            db,
            role_id=role_id,
            organization_id=current_user["organization_id"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

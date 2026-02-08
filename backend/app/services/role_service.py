"""
Camp Connect - Role Service
CRUD operations for custom roles and permissions.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Role, RolePermission
from app.models.user import User


async def list_roles(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List all roles for an organization with user counts."""
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.organization_id == organization_id)
        .order_by(Role.name)
    )
    roles = result.scalars().all()

    # Get user counts per role
    count_result = await db.execute(
        select(User.role_id, func.count(User.id))
        .where(User.organization_id == organization_id)
        .where(User.deleted_at.is_(None))
        .group_by(User.role_id)
    )
    user_counts = dict(count_result.all())

    return [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "is_system": role.is_system,
            "permissions": [rp.permission for rp in role.permissions],
            "user_count": user_counts.get(role.id, 0),
            "created_at": role.created_at,
        }
        for role in roles
    ]


async def get_role(
    db: AsyncSession,
    *,
    role_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single role with permissions."""
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.id == role_id)
        .where(Role.organization_id == organization_id)
    )
    role = result.scalar_one_or_none()
    if role is None:
        return None

    # Get user count
    count_result = await db.execute(
        select(func.count(User.id))
        .where(User.role_id == role_id)
        .where(User.deleted_at.is_(None))
    )
    user_count = count_result.scalar() or 0

    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "is_system": role.is_system,
        "permissions": [rp.permission for rp in role.permissions],
        "user_count": user_count,
        "created_at": role.created_at,
    }


async def create_role(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    name: str,
    description: Optional[str] = None,
    permissions: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Create a new custom role with permissions."""
    role = Role(
        id=uuid.uuid4(),
        organization_id=organization_id,
        name=name,
        description=description,
        is_system=False,
    )
    db.add(role)
    await db.flush()

    # Add permissions
    if permissions:
        for perm in permissions:
            rp = RolePermission(
                id=uuid.uuid4(),
                role_id=role.id,
                permission=perm,
            )
            db.add(rp)

    await db.commit()
    await db.refresh(role)

    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "is_system": role.is_system,
        "permissions": permissions or [],
        "user_count": 0,
        "created_at": role.created_at,
    }


async def update_role(
    db: AsyncSession,
    *,
    role_id: uuid.UUID,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Update a role's name, description, and/or permissions.
    System roles can have their permissions changed but not be deleted.
    """
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.id == role_id)
        .where(Role.organization_id == organization_id)
    )
    role = result.scalar_one_or_none()
    if role is None:
        raise ValueError("Role not found")

    # Update basic fields
    if data.get("name") is not None:
        role.name = data["name"]
    if data.get("description") is not None:
        role.description = data["description"]

    # Update permissions if provided
    if data.get("permissions") is not None:
        # Remove existing permissions
        for rp in role.permissions:
            await db.delete(rp)
        await db.flush()

        # Add new permissions
        for perm in data["permissions"]:
            rp = RolePermission(
                id=uuid.uuid4(),
                role_id=role.id,
                permission=perm,
            )
            db.add(rp)

    await db.commit()

    # Reload to get fresh permissions
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()

    count_result = await db.execute(
        select(func.count(User.id))
        .where(User.role_id == role_id)
        .where(User.deleted_at.is_(None))
    )
    user_count = count_result.scalar() or 0

    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "is_system": role.is_system,
        "permissions": [rp.permission for rp in role.permissions],
        "user_count": user_count,
        "created_at": role.created_at,
    }


async def delete_role(
    db: AsyncSession,
    *,
    role_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> None:
    """
    Delete a custom role.
    Cannot delete system roles or roles with assigned users.
    """
    result = await db.execute(
        select(Role)
        .where(Role.id == role_id)
        .where(Role.organization_id == organization_id)
    )
    role = result.scalar_one_or_none()
    if role is None:
        raise ValueError("Role not found")

    if role.is_system:
        raise ValueError("Cannot delete system roles")

    # Check for assigned users
    count_result = await db.execute(
        select(func.count(User.id))
        .where(User.role_id == role_id)
        .where(User.deleted_at.is_(None))
    )
    user_count = count_result.scalar() or 0
    if user_count > 0:
        raise ValueError(
            f"Cannot delete role with {user_count} assigned user(s). "
            "Reassign users first."
        )

    await db.delete(role)
    await db.commit()

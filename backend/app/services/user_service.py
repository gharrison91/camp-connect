"""
Camp Connect - User Service
CRUD operations for user management (invite, list, update, suspend).
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.role import Role, RolePermission
from app.models.user import User


async def list_users(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    """List users for an organization with pagination."""
    # Get total count
    count_result = await db.execute(
        select(func.count(User.id))
        .where(User.organization_id == organization_id)
        .where(User.deleted_at.is_(None))
    )
    total = count_result.scalar() or 0

    # Get users
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.organization_id == organization_id)
        .where(User.deleted_at.is_(None))
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    users = result.scalars().all()

    return {
        "items": [_user_to_dict(u) for u in users],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


async def get_user(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single user by ID."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.id == user_id)
        .where(User.organization_id == organization_id)
        .where(User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if user is None:
        return None
    return _user_to_dict(user)


async def invite_user(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    email: str,
    first_name: str,
    last_name: str,
    role_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    Invite a new user to the organization.

    Creates a Supabase auth account and sends an invite email.
    Creates the user record in our DB linked to the Supabase user.
    """
    from supabase import create_client

    # Check email uniqueness in this org
    existing = await db.execute(
        select(User)
        .where(User.email == email)
        .where(User.organization_id == organization_id)
        .where(User.deleted_at.is_(None))
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"User with email '{email}' already exists in this organization")

    # Verify role belongs to this org
    role_result = await db.execute(
        select(Role)
        .where(Role.id == role_id)
        .where(Role.organization_id == organization_id)
    )
    if role_result.scalar_one_or_none() is None:
        raise ValueError("Invalid role ID")

    # Create Supabase auth user with invite
    supabase_admin = create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )

    try:
        auth_response = supabase_admin.auth.admin.create_user({
            "email": email,
            "email_confirm": False,  # User will receive invite email
        })
        supabase_user_id = auth_response.user.id
    except Exception as e:
        raise ValueError(f"Failed to create user account: {str(e)}")

    try:
        # Create our user record
        user = User(
            id=uuid.uuid4(),
            supabase_user_id=str(supabase_user_id),
            organization_id=organization_id,
            role_id=role_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Load role for response
        result = await db.execute(
            select(User)
            .options(selectinload(User.role))
            .where(User.id == user.id)
        )
        user = result.scalar_one()

    except Exception as e:
        await db.rollback()
        # Clean up Supabase user
        try:
            supabase_admin.auth.admin.delete_user(str(supabase_user_id))
        except Exception:
            pass
        raise ValueError(f"Failed to create user: {str(e)}")

    return _user_to_dict(user)


async def update_user(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Update a user's details."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.id == user_id)
        .where(User.organization_id == organization_id)
        .where(User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError("User not found")

    # If changing role, verify it belongs to the org
    if data.get("role_id") is not None:
        role_result = await db.execute(
            select(Role)
            .where(Role.id == data["role_id"])
            .where(Role.organization_id == organization_id)
        )
        if role_result.scalar_one_or_none() is None:
            raise ValueError("Invalid role ID")

    for key, value in data.items():
        if value is not None:
            setattr(user, key, value)

    await db.commit()

    # Reload with role
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.id == user_id)
    )
    user = result.scalar_one()
    return _user_to_dict(user)


async def suspend_user(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    is_active: bool,
) -> Dict[str, Any]:
    """Activate or suspend a user."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.id == user_id)
        .where(User.organization_id == organization_id)
        .where(User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError("User not found")

    user.is_active = is_active
    await db.commit()
    await db.refresh(user)

    # Reload with role
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.id == user_id)
    )
    user = result.scalar_one()
    return _user_to_dict(user)


def _user_to_dict(user: User) -> Dict[str, Any]:
    """Convert a User model to a response dict."""
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "role_id": user.role_id,
        "role_name": user.role.name if user.role else None,
        "is_active": user.is_active,
        "seasonal_access_start": user.seasonal_access_start,
        "seasonal_access_end": user.seasonal_access_end,
        "created_at": user.created_at,
    }

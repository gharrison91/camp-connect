"""
Camp Connect - API Dependencies
Shared FastAPI dependencies for authentication, authorization, and database.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any, Dict, List

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import verify_supabase_token
from app.middleware.tenant import set_tenant_context
from app.models.role import Role, RolePermission
from app.models.user import User


async def get_current_user(
    request: Request,
    token_payload: Dict[str, Any] = Depends(verify_supabase_token),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    FastAPI dependency: look up the application User by Supabase user ID.

    Takes the decoded JWT (from verify_supabase_token), finds the matching
    user in our database, loads their role and permissions, and checks:
      1. User exists in our system
      2. User is active
      3. Seasonal access is valid (if configured)

    Returns a dict with user info + permissions for use in endpoints.
    Also sets the tenant context for RLS.
    """
    supabase_user_id = token_payload.get("sub")

    # Look up user by Supabase auth ID
    result = await db.execute(
        select(User)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .where(User.supabase_user_id == supabase_user_id)
        .where(User.deleted_at.is_(None))  # Respect soft-delete
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Please complete registration.",
        )

    # Check active status
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Contact your administrator.",
        )

    # Check seasonal access
    today = date.today()
    if user.seasonal_access_start and user.seasonal_access_end:
        if not (user.seasonal_access_start <= today <= user.seasonal_access_end):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your seasonal access period has expired.",
            )

    # Extract permissions from role
    permissions: List[str] = []
    role_name = ""
    if user.role:
        role_name = user.role.name
        permissions = [rp.permission for rp in user.role.permissions]

    # Set tenant context for RLS
    await set_tenant_context(db, user.organization_id)

    # Store user info on request state for audit logging
    request.state.user_id = user.id
    request.state.organization_id = user.organization_id

    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "organization_id": user.organization_id,
        "role_id": user.role_id,
        "role_name": role_name,
        "permissions": permissions,
        "is_active": user.is_active,
        "platform_role": getattr(user, "platform_role", None),
    }


def require_permission(permission: str):
    """
    FastAPI dependency factory: require the current user to have a permission.

    Usage:
        @router.get(
            "/events",
            dependencies=[Depends(require_permission("core.events.read"))]
        )
        async def list_events(...):
            ...

    Or inject the user dict directly:
        @router.get("/events")
        async def list_events(
            user: dict = Depends(require_permission("core.events.read"))
        ):
            org_id = user["organization_id"]
            ...
    """

    async def _checker(
        current_user: Dict[str, Any] = Depends(get_current_user),
    ) -> Dict[str, Any]:
        # Camp Director role always has all permissions
        if current_user.get("role_name") == "Camp Director":
            return current_user
        user_permissions: List[str] = current_user.get("permissions", [])
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}",
            )
        return current_user

    return _checker


async def require_platform_admin(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Require the current user to be a platform admin (super admin)."""
    if current_user.get("platform_role") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin access required.",
        )
    return current_user


async def get_client_ip(request: Request) -> str:
    """Extract the client IP address from the request."""
    # Check for forwarded headers (when behind a proxy/load balancer)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"

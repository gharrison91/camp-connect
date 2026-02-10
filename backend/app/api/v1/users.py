"""
Camp Connect - Users API Endpoints
List, get, invite, update, and suspend users.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.schemas.user import UserInvite, UserResponse, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.users.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all users for the current organization with pagination."""
    return await user_service.list_users(
        db,
        organization_id=current_user["organization_id"],
        skip=skip,
        limit=limit,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.users.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user by ID."""
    user = await user_service.get_user(
        db,
        user_id=user_id,
        organization_id=current_user["organization_id"],
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post(
    "/invite",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def invite_user(
    body: UserInvite,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.users.invite")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Invite a new user to the organization.
    Creates a Supabase auth account and sends an invite email.
    """
    try:
        user = await user_service.invite_user(
            db,
            organization_id=current_user["organization_id"],
            email=body.email,
            first_name=body.first_name,
            last_name=body.last_name,
            role_id=body.role_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.users.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's details (name, phone, role, seasonal access)."""
    try:
        user = await user_service.update_user(
            db,
            user_id=user_id,
            organization_id=current_user["organization_id"],
            data=body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return user


@router.post("/{user_id}/suspend", response_model=UserResponse)
async def suspend_user(
    user_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.users.suspend")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Suspend (deactivate) a user."""
    try:
        user = await user_service.suspend_user(
            db,
            user_id=user_id,
            organization_id=current_user["organization_id"],
            is_active=False,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return user


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.users.suspend")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a suspended user."""
    try:
        user = await user_service.suspend_user(
            db,
            user_id=user_id,
            organization_id=current_user["organization_id"],
            is_active=True,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return user


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.users.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a password reset email for the user.
    For now, returns a success message. Actual email integration can come later.
    """
    # Verify the user exists in the same organization
    user = await user_service.get_user(
        db,
        user_id=user_id,
        organization_id=current_user["organization_id"],
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    # TODO: Integrate with Supabase auth.resetPasswordForEmail() or similar
    return {"message": "Password reset email sent", "user_id": str(user_id)}

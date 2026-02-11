"""
Camp Connect - Notification Preferences API Endpoints
Personal notification preference management for authenticated users.
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.notification_preferences import (
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
)
from app.services import notification_preferences_service

router = APIRouter(
    prefix="/notification-preferences",
    tags=["Notification Preferences"],
)


@router.get("", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user\'s notification preferences."""
    return await notification_preferences_service.get_preferences(
        db,
        user_id=current_user["id"],
        org_id=current_user["organization_id"],
    )


@router.put("", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user\'s notification preferences."""
    return await notification_preferences_service.update_preferences(
        db,
        user_id=current_user["id"],
        org_id=current_user["organization_id"],
        data=payload.model_dump(exclude_none=False),
    )


@router.post("/reset", response_model=NotificationPreferencesResponse)
async def reset_notification_preferences(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reset notification preferences to defaults."""
    return await notification_preferences_service.reset_preferences(
        db,
        user_id=current_user["id"],
        org_id=current_user["organization_id"],
    )

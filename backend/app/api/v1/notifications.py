"""
Camp Connect - Notifications API Endpoints
Manage automated notification configurations and test triggers.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.notification import (
    NotificationConfigCreate,
    NotificationConfigResponse,
    NotificationConfigUpdate,
    NotificationTestRequest,
)
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ---------------------------------------------------------------------------
# Notification config CRUD
# ---------------------------------------------------------------------------


@router.get(
    "/configs",
    response_model=List[NotificationConfigResponse],
)
async def list_notification_configs(
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.workflows.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all notification configurations for the current organization."""
    return await notification_service.list_notification_configs(
        db,
        organization_id=current_user["organization_id"],
    )


@router.get(
    "/configs/{config_id}",
    response_model=NotificationConfigResponse,
)
async def get_notification_config(
    config_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.workflows.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single notification configuration by ID."""
    config = await notification_service.get_notification_config(
        db,
        organization_id=current_user["organization_id"],
        config_id=config_id,
    )
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification config not found",
        )
    return config


@router.post(
    "/configs",
    response_model=NotificationConfigResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_notification_config(
    body: NotificationConfigCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.workflows.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new notification configuration."""
    return await notification_service.create_notification_config(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/configs/{config_id}",
    response_model=NotificationConfigResponse,
)
async def update_notification_config(
    config_id: uuid.UUID,
    body: NotificationConfigUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.workflows.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing notification configuration."""
    result = await notification_service.update_notification_config(
        db,
        organization_id=current_user["organization_id"],
        config_id=config_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification config not found",
        )
    return result


@router.delete(
    "/configs/{config_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_notification_config(
    config_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.workflows.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a notification configuration (hard delete)."""
    deleted = await notification_service.delete_notification_config(
        db,
        organization_id=current_user["organization_id"],
        config_id=config_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification config not found",
        )


# ---------------------------------------------------------------------------
# Test / debug endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/test",
    status_code=status.HTTP_200_OK,
)
async def test_trigger_notification(
    body: NotificationTestRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.messages.send")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Test-trigger a notification for debugging purposes.

    Fires the trigger engine for the given trigger_type. If recipient_email
    or recipient_phone are supplied they are merged into the context dict
    so the notification engine can route to them.
    """
    context = dict(body.context)

    # Merge explicit test recipients into context
    if body.recipient_email:
        context.setdefault("parent_email", body.recipient_email)
    if body.recipient_phone:
        context.setdefault("parent_phone", body.recipient_phone)

    result = await notification_service.trigger_notification(
        db,
        organization_id=current_user["organization_id"],
        trigger_type=body.trigger_type,
        context=context,
    )
    return result

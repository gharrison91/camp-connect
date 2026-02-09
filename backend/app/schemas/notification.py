"""
Camp Connect - Notification Configuration Schemas
Pydantic schemas for automated notification configuration endpoints.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Notification Config Schemas
# ---------------------------------------------------------------------------


class NotificationConfigCreate(BaseModel):
    """Request to create a new notification configuration."""

    trigger_type: str = Field(
        ...,
        pattern="^(registration_confirmed|health_form_reminder|payment_received|waitlist_promoted|event_reminder)$",
        description="System event that triggers this notification",
    )
    channel: str = Field(
        default="email",
        pattern="^(email|sms|both)$",
        description="Delivery channel: email, sms, or both",
    )
    is_active: bool = Field(default=True, description="Whether this config is active")
    template_id: Optional[uuid.UUID] = Field(
        default=None, description="MessageTemplate ID to use for content"
    )
    config: Optional[Dict[str, Any]] = Field(
        default=None, description="Extra configuration (e.g. {\"days_before\": 7})"
    )


class NotificationConfigUpdate(BaseModel):
    """Request to update an existing notification configuration."""

    trigger_type: Optional[str] = Field(
        default=None,
        pattern="^(registration_confirmed|health_form_reminder|payment_received|waitlist_promoted|event_reminder)$",
    )
    channel: Optional[str] = Field(
        default=None,
        pattern="^(email|sms|both)$",
    )
    is_active: Optional[bool] = None
    template_id: Optional[uuid.UUID] = None
    config: Optional[Dict[str, Any]] = None


class NotificationConfigResponse(BaseModel):
    """Response schema for a notification configuration."""

    id: uuid.UUID
    organization_id: uuid.UUID
    trigger_type: str
    channel: str
    is_active: bool
    template_id: Optional[uuid.UUID] = None
    config: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Notification Test Schema
# ---------------------------------------------------------------------------


class NotificationTestRequest(BaseModel):
    """Request to fire a test notification (debug endpoint)."""

    trigger_type: str = Field(
        ...,
        pattern="^(registration_confirmed|health_form_reminder|payment_received|waitlist_promoted|event_reminder)$",
        description="Trigger type to test",
    )
    context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Template variable context (e.g. camper_name, event_name)",
    )
    recipient_email: Optional[str] = Field(
        default=None, max_length=255, description="Override email recipient for test"
    )
    recipient_phone: Optional[str] = Field(
        default=None, max_length=50, description="Override phone recipient for test"
    )

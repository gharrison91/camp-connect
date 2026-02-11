"""
Camp Connect - Notification Preferences Schemas
Pydantic models for user notification preference settings.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class NotificationChannel(BaseModel):
    email: bool = True
    in_app: bool = True
    push: bool = False


class NotificationPreference(BaseModel):
    category: str
    label: str
    description: str
    channels: NotificationChannel


class NotificationPreferencesResponse(BaseModel):
    user_id: UUID
    preferences: list[NotificationPreference]
    quiet_hours_enabled: bool = False
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    digest_frequency: str = "instant"


class NotificationPreferencesUpdate(BaseModel):
    preferences: list[dict]
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    digest_frequency: Optional[str] = None

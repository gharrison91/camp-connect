"""
Camp Connect - Background Check Schemas
Pydantic models for background check operations.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict


class BackgroundCheckCreate(BaseModel):
    staff_user_id: str
    package: str = "basic"
    provider: str = "checkr"
    notes: Optional[str] = None


class BackgroundCheckUpdate(BaseModel):
    status: Optional[str] = None
    result: Optional[str] = None
    notes: Optional[str] = None
    report_url: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    is_archived: Optional[bool] = None


class BackgroundCheckResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    staff_user_id: uuid.UUID
    staff_name: Optional[str] = None
    provider: str
    external_id: Optional[str] = None
    package: str
    status: str
    result: Optional[str] = None
    report_url: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    initiated_by: Optional[uuid.UUID] = None
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    notes: Optional[str] = None
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BackgroundCheckSettingsUpdate(BaseModel):
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None

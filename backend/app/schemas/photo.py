"""
Camp Connect - Photo Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PhotoUploadResponse(BaseModel):
    """Response after uploading a photo."""
    id: uuid.UUID
    file_name: str
    file_path: str
    url: str
    file_size: int
    mime_type: str
    caption: Optional[str] = None
    tags: Optional[List[str]] = None
    category: str
    entity_id: Optional[uuid.UUID] = None
    is_profile_photo: bool = False
    uploaded_by: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PhotoUpdate(BaseModel):
    """Update photo metadata."""
    caption: Optional[str] = None
    tags: Optional[List[str]] = None
    is_profile_photo: Optional[bool] = None


class PhotoListResponse(BaseModel):
    """Photo in a list view (includes signed URL)."""
    id: uuid.UUID
    file_name: str
    file_path: str
    url: str
    file_size: int
    mime_type: str
    caption: Optional[str] = None
    tags: Optional[List[str]] = None
    category: str
    entity_id: Optional[uuid.UUID] = None
    is_profile_photo: bool = False
    uploaded_by: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

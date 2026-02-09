"""
Camp Connect - Face Recognition Schemas
Pydantic models for AWS Rekognition face tag results.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class FaceTagResponse(BaseModel):
    """A single face tag detection result."""

    id: uuid.UUID
    photo_id: uuid.UUID
    camper_id: Optional[uuid.UUID] = None
    camper_name: Optional[str] = None
    confidence: Optional[float] = None
    similarity: Optional[float] = None
    bounding_box: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class PhotoFaceTagsResponse(BaseModel):
    """All face tags detected in a single photo."""

    photo_id: uuid.UUID
    face_tags: List[FaceTagResponse]


class CamperPhotoMatch(BaseModel):
    """A photo matched to a camper via face recognition."""

    photo_id: uuid.UUID
    url: str
    confidence: Optional[float] = None
    similarity: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

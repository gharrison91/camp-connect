"""
Camp Connect - Photo Face Tag Model
AWS Rekognition face detection results linking detected faces in photos
to known campers via facial recognition.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class PhotoFaceTag(Base, TimestampMixin):
    """
    Face tag linking a detected face in a photo to a camper.

    Stores the AWS Rekognition FaceId, bounding box coordinates,
    confidence score, and similarity score for each detected face.
    """

    __tablename__ = "photo_face_tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
        nullable=False,
    )
    photo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("photos.id"),
        index=True,
        nullable=False,
    )
    camper_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campers.id"),
        index=True,
        nullable=True,
    )

    # Rekognition data
    face_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )  # AWS Rekognition FaceId
    bounding_box: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )  # {Width, Height, Left, Top}
    confidence: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )
    similarity: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )

    # Relationships
    photo = relationship("Photo", backref="face_tags")
    camper = relationship("Camper", backref="face_tags")

    def __repr__(self) -> str:
        return (
            f"<PhotoFaceTag(id={self.id}, photo_id={self.photo_id}, "
            f"camper_id={self.camper_id}, confidence={self.confidence})>"
        )

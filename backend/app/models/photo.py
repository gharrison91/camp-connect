"""
Camp Connect - Photo Model
Media uploads for camper photos, event photos, and general camp images.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Photo(Base, TimestampMixin, SoftDeleteMixin):
    """
    Photo model - media uploads associated with campers, events, or general.
    Scoped to an organization via organization_id.
    """

    __tablename__ = "photos"

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
    uploaded_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    # Classification
    category: Mapped[str] = mapped_column(
        String(20), nullable=False, default="general"
    )  # camper, event, general
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )

    # File info
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # Metadata
    caption: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    is_profile_photo: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    # Relationships
    organization = relationship("Organization", backref="photos")
    uploader = relationship("User", backref="uploaded_photos")

    def __repr__(self) -> str:
        return f"<Photo(id={self.id}, file_name='{self.file_name}', category='{self.category}')>"

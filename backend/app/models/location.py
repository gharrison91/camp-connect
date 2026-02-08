"""
Camp Connect - Location Model
Physical locations belonging to an organization.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Location(Base, TimestampMixin, SoftDeleteMixin):
    """
    Location model - physical locations/campuses per organization.
    """

    __tablename__ = "locations"

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

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="locations")

    def __repr__(self) -> str:
        return f"<Location(id={self.id}, name='{self.name}')>"

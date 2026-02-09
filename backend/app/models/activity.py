"""
Camp Connect - Activity Model
Activities offered at camp (sports, arts, nature, etc.).
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Activity(Base, TimestampMixin, SoftDeleteMixin):
    """
    Activity model - camp activities/programs that campers can participate in.
    Scoped to an organization via organization_id.
    """

    __tablename__ = "activities"

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

    # Basic info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, default="other"
    )  # sports, arts, nature, water, education, other
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Capacity & requirements
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    min_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    staff_required: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Equipment
    equipment_needed: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    organization = relationship("Organization", backref="activities")

    def __repr__(self) -> str:
        return f"<Activity(id={self.id}, name='{self.name}', category='{self.category}')>"

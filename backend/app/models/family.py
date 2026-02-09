"""
Camp Connect - Family Model
Groups campers and contacts into household units.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Family(Base, TimestampMixin, SoftDeleteMixin):
    """
    Family model - groups campers and contacts into a household.
    A family can have multiple campers (children) and contacts (parents/guardians).
    """

    __tablename__ = "families"

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

    # Family info
    family_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    organization = relationship("Organization")
    campers = relationship("Camper", back_populates="family", lazy="selectin")
    contacts = relationship("Contact", back_populates="family", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Family(id={self.id}, name='{self.family_name}')>"

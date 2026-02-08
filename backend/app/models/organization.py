"""
Camp Connect - Organization (Tenant) Model
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Organization(Base, TimestampMixin, SoftDeleteMixin):
    """
    Organization model - represents a camp/tenant.
    All data in the system is scoped to an organization.
    """

    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    brand_colors: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Configuration
    settings: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default="{}",
    )
    enabled_modules: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        server_default='["core"]',
    )
    subscription_tier: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="free",
    )

    # Marketplace
    marketplace_visible: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    users = relationship("User", back_populates="organization", lazy="selectin")
    roles = relationship("Role", back_populates="organization", lazy="selectin")
    locations = relationship("Location", back_populates="organization", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name='{self.name}', slug='{self.slug}')>"

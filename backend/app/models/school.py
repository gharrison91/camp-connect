"""
Camp Connect - School Model
Standardized school names from NCES (National Center for Education Statistics).
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class School(Base, TimestampMixin):
    """
    School database — pre-populated from NCES API or custom entries.
    Used for autocomplete on camper school fields to prevent duplicates.
    """

    __tablename__ = "schools"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        nullable=True,
        index=True,
    )  # NULL = national/shared, non-null = org-specific custom

    # NCES data
    nces_id: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    state: Mapped[Optional[str]] = mapped_column(String(2), nullable=True, index=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    county: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # School type
    school_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # public, private, charter, magnet, virtual
    grade_range: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # e.g., "K-5", "6-8", "9-12"
    enrollment: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Custom entries
    is_custom: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

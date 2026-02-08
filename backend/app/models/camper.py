"""
Camp Connect - Camper Model
Children/participants who attend camp events.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Camper(Base, TimestampMixin, SoftDeleteMixin):
    """
    Camper model - children/participants who register for events.
    Linked to contacts (parents/guardians) via camper_contacts.
    """

    __tablename__ = "campers"

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

    # Personal info
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # male, female, other

    # School info
    school: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    grade: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Location
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Health & dietary (JSONB arrays)
    allergies: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    dietary_restrictions: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)

    # Custom fields (HubSpot-style dynamic fields)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Photo for AI recognition
    reference_photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    organization = relationship("Organization", backref="campers")
    camper_contacts = relationship(
        "CamperContact", back_populates="camper", lazy="selectin",
        cascade="all, delete-orphan",
    )
    registrations = relationship(
        "Registration", back_populates="camper", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Camper(id={self.id}, name='{self.first_name} {self.last_name}')>"

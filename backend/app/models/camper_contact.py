"""
Camp Connect - CamperContact Junction Model
Links campers to their contacts (parents/guardians).
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class CamperContact(Base, TimestampMixin):
    """
    CamperContact junction model - links campers to contacts.
    Tracks relationship type and flags (primary, emergency, authorized pickup).
    """

    __tablename__ = "camper_contacts"
    __table_args__ = (
        UniqueConstraint("camper_id", "contact_id", name="uq_camper_contact"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    camper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campers.id"),
        index=True,
        nullable=False,
    )
    contact_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id"),
        index=True,
        nullable=False,
    )

    # Relationship details
    relationship_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="parent"
    )  # parent, guardian, grandparent, step-parent, etc.

    # Flags
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_emergency: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_authorized_pickup: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Relationships
    camper = relationship("Camper", back_populates="camper_contacts")
    contact = relationship("Contact", back_populates="camper_contacts")

    def __repr__(self) -> str:
        return (
            f"<CamperContact(camper_id={self.camper_id}, "
            f"contact_id={self.contact_id}, relationship_type='{self.relationship_type}')>"
        )

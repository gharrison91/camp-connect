"""
Camp Connect - Contact Model
Parents, guardians, and emergency contacts.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Contact(Base, TimestampMixin, SoftDeleteMixin):
    """
    Contact model - parents, guardians, and emergency contacts.
    A contact can be linked to multiple campers via camper_contacts.
    """

    __tablename__ = "contacts"

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
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Address
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Contact type and preferences
    relationship_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="parent"
    )  # parent, guardian, emergency
    notification_preferences: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )  # {"email": true, "sms": true}
    account_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )  # active, guest

    # Family & Portal
    family_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("families.id"),
        index=True,
        nullable=True,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        index=True,
        nullable=True,
    )

    # Parent Portal access
    portal_access: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    portal_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )

    # Relationships
    organization = relationship("Organization", backref="contacts")
    camper_contacts = relationship(
        "CamperContact", back_populates="contact", lazy="selectin"
    )
    family = relationship("Family", back_populates="contacts")
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<Contact(id={self.id}, name='{self.first_name} {self.last_name}')>"

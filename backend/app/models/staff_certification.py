"""
Camp Connect - Staff Certification Models
Organization-defined certification types and staff certification records.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class CertificationType(Base, TimestampMixin):
    """
    Custom certification types defined by an organization.
    Examples: CPR, First Aid, Lifeguard, etc.
    """

    __tablename__ = "certification_types"

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
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_required: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    expiry_days: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )

    # Relationships
    organization = relationship("Organization", backref="certification_types")
    staff_certifications = relationship(
        "StaffCertificationRecord",
        back_populates="certification_type",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<CertificationType(id={self.id}, name='{self.name}')>"


class StaffCertificationRecord(Base, TimestampMixin):
    """
    A specific certification held by a staff member.
    Linked to a CertificationType and a User.
    """

    __tablename__ = "staff_certification_records"

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
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )
    certification_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("certification_types.id"),
        index=True,
        nullable=False,
    )

    # Certification details
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, valid, expired, revoked
    issued_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    document_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    # Relationships
    organization = relationship("Organization")
    user = relationship("User", foreign_keys=[user_id], backref="certification_records")
    certification_type = relationship(
        "CertificationType", back_populates="staff_certifications"
    )
    verifier = relationship("User", foreign_keys=[verified_by])

    def __repr__(self) -> str:
        return (
            f"<StaffCertificationRecord(id={self.id}, user_id={self.user_id}, "
            f"status='{self.status}')>"
        )

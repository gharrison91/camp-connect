"""
Camp Connect - Staff Onboarding Models
Employee onboarding workflow: personal info, emergency contacts,
certifications, policy acknowledgments, payroll, and document uploads.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class StaffOnboarding(Base, TimestampMixin, SoftDeleteMixin):
    """
    Staff onboarding record tracking a user's multi-step onboarding process.

    Steps:
        1. Personal information
        2. Emergency contacts
        3. Certifications
        4. Policy acknowledgments
        5. Payroll information
    """

    __tablename__ = "staff_onboardings"

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
        unique=True,
        index=True,
        nullable=False,
    )

    # Workflow status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="invited"
    )  # invited, in_progress, completed
    current_step: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )  # 1-5

    # Step completion flags
    personal_info_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    emergency_contacts_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    certifications_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    policy_acknowledgments_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    payroll_info_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    # Emergency contacts stored as JSONB array
    emergency_contacts_data: Mapped[Optional[list]] = mapped_column(
        JSONB, nullable=True
    )

    # Completion timestamp
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user = relationship("User", backref="onboarding", lazy="joined")
    certifications = relationship(
        "StaffCertification",
        back_populates="onboarding",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    documents = relationship(
        "StaffDocument",
        back_populates="onboarding",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    acknowledgments = relationship(
        "PolicyAcknowledgment",
        back_populates="onboarding",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<StaffOnboarding(id={self.id}, user_id={self.user_id}, "
            f"status='{self.status}', step={self.current_step})>"
        )


class StaffCertification(Base, TimestampMixin):
    """
    Staff certification record attached to an onboarding.
    Tracks professional certifications such as CPR, First Aid, lifeguard, etc.
    """

    __tablename__ = "staff_certifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    onboarding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("staff_onboardings.id"),
        index=True,
        nullable=False,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
        nullable=False,
    )

    # Certification details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    issuing_authority: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    certificate_number: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    issued_date: Mapped[Optional[datetime]] = mapped_column(
        Date, nullable=True
    )
    expiry_date: Mapped[Optional[datetime]] = mapped_column(
        Date, nullable=True
    )
    document_url: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="valid"
    )  # valid, expired, pending_verification

    # Relationships
    onboarding = relationship(
        "StaffOnboarding", back_populates="certifications"
    )

    def __repr__(self) -> str:
        return (
            f"<StaffCertification(id={self.id}, name='{self.name}', "
            f"status='{self.status}')>"
        )


class StaffDocument(Base, TimestampMixin):
    """
    Staff document upload associated with an onboarding.
    Stores references to files in Supabase Storage (W-4, I-9, ID, etc.).
    """

    __tablename__ = "staff_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    onboarding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("staff_onboardings.id"),
        index=True,
        nullable=False,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
        nullable=False,
    )

    # Document metadata
    document_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # w4, i9, id, other
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    onboarding = relationship(
        "StaffOnboarding", back_populates="documents"
    )

    def __repr__(self) -> str:
        return (
            f"<StaffDocument(id={self.id}, type='{self.document_type}', "
            f"file='{self.file_name}')>"
        )


class PolicyAcknowledgment(Base, TimestampMixin):
    """
    Record of a staff member acknowledging a specific policy.
    Captures timestamp, IP address, and optional signature data.
    """

    __tablename__ = "policy_acknowledgments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    onboarding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("staff_onboardings.id"),
        index=True,
        nullable=False,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
        nullable=False,
    )

    # Policy details
    policy_name: Mapped[str] = mapped_column(String(255), nullable=False)
    policy_version: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )

    # Acknowledgment details
    acknowledged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45), nullable=True
    )
    signature_data: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )

    # Relationships
    onboarding = relationship(
        "StaffOnboarding", back_populates="acknowledgments"
    )

    def __repr__(self) -> str:
        return (
            f"<PolicyAcknowledgment(id={self.id}, "
            f"policy='{self.policy_name}')>"
        )

"""
Camp Connect - Health Form Models
Form templates, assigned form instances, and submitted form data
for health & safety compliance.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class HealthFormTemplate(Base, TimestampMixin, SoftDeleteMixin):
    """
    A form template that defines the structure/fields of a health form.
    Templates are reusable and can be assigned to many campers.
    """

    __tablename__ = "health_form_templates"

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

    # Template metadata
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, default="health"
    )  # health, medical, emergency, dietary, custom

    # Form field definitions stored as JSONB array
    fields: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Flags
    is_system: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )  # System templates cannot be deleted by users
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    version: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )
    required_for_registration: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Relationships
    organization = relationship("Organization", backref="health_form_templates")
    health_forms = relationship(
        "HealthForm", back_populates="template", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<HealthFormTemplate(id={self.id}, name='{self.name}')>"


class HealthForm(Base, TimestampMixin, SoftDeleteMixin):
    """
    An assigned health form instance — a template assigned to a specific
    camper (and optionally an event). Tracks lifecycle from pending to approved.
    """

    __tablename__ = "health_forms"

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
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("health_form_templates.id"),
        index=True,
        nullable=False,
    )
    camper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campers.id"),
        index=True,
        nullable=False,
    )
    event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id"),
        index=True,
        nullable=True,
    )

    # Status lifecycle
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, submitted, approved, rejected, expired

    # Submission tracking
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Review tracking
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Due date
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    organization = relationship("Organization", backref="health_forms")
    template = relationship("HealthFormTemplate", back_populates="health_forms")
    camper = relationship("Camper", backref="health_forms", lazy="selectin")
    event = relationship("Event", backref="health_forms", lazy="selectin")
    reviewer = relationship("User", backref="reviewed_health_forms", lazy="selectin")
    submission = relationship(
        "HealthFormSubmission",
        back_populates="form",
        uselist=False,
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<HealthForm(id={self.id}, template_id={self.template_id}, "
            f"camper_id={self.camper_id}, status='{self.status}')>"
        )


class HealthFormSubmission(Base, TimestampMixin):
    """
    The actual submitted form data. Stored separately so the form instance
    can track lifecycle while submission data is immutable.
    """

    __tablename__ = "health_form_submissions"

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
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("health_forms.id"),
        index=True,
        nullable=False,
    )
    submitted_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    # Submitted form data: field_id -> value mapping
    data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Signature
    signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    signed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Metadata
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    organization = relationship("Organization", backref="health_form_submissions")
    form = relationship("HealthForm", back_populates="submission")
    submitted_by_user = relationship("User", backref="health_form_submissions", lazy="selectin")

    def __repr__(self) -> str:
        return f"<HealthFormSubmission(id={self.id}, form_id={self.form_id})>"

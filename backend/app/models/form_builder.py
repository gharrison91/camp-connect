"""
Camp Connect - Form Builder Models
Drag-and-drop form builder with e-signature support.

FormTemplate: Stores the form schema (fields, layout, settings)
FormSubmission: Stores a completed form submission with answers
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FormTemplate(Base):
    """
    A form template created via the drag-and-drop builder.

    The `fields` JSONB column stores the form schema as an array of field
    definitions, e.g.:
    [
      {
        "id": "field_abc123",
        "type": "text",          # text, textarea, number, email, phone,
                                  # date, select, checkbox, radio, file,
                                  # signature, heading, paragraph, divider
        "label": "Full Name",
        "placeholder": "Enter your name",
        "required": true,
        "width": "full",         # full, half
        "options": [],           # for select/radio/checkbox
        "validation": {},        # min, max, pattern, etc.
        "order": 0
      },
      ...
    ]

    The `settings` JSONB column stores form-level configuration:
    {
      "require_signature": true,
      "allow_save_draft": true,
      "confirmation_message": "Thank you for submitting!",
      "redirect_url": null,
      "notify_on_submission": true,
      "notify_emails": ["admin@camp.com"],
      "expires_at": null,
      "max_submissions": null,
      "theme": { "primaryColor": "#2563eb" }
    }
    """

    __tablename__ = "form_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(
        String(50), default="general"
    )  # general, health, waiver, permission, registration, survey, custom
    status: Mapped[str] = mapped_column(
        String(20), default="draft"
    )  # draft, published, archived
    fields: Mapped[dict] = mapped_column(JSONB, default=list)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    require_signature: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    submissions = relationship("FormSubmission", back_populates="template")


class FormSubmission(Base):
    """
    A completed form submission.

    The `answers` JSONB column stores field_id -> value pairs:
    {
      "field_abc123": "John Doe",
      "field_def456": "2024-06-15",
      "field_ghi789": ["option1", "option3"],
      "field_sig001": {
        "type": "signature",
        "data_url": "data:image/png;base64,...",
        "signed_at": "2024-06-15T10:30:00Z",
        "signer_name": "John Doe",
        "ip_address": "192.168.1.1"
      }
    }
    """

    __tablename__ = "form_submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("form_templates.id"),
        index=True,
    )
    # Who submitted — could be a contact (parent), staff, or external
    submitted_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    submitted_by_contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True
    )
    submitted_by_email: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    # Related entity (e.g. a camper for a health form)
    related_entity_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # camper, event, staff, etc.
    related_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    # The actual answers
    answers: Mapped[dict] = mapped_column(JSONB, default=dict)
    # Signature audit trail
    signature_data: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )  # {signer_name, ip_address, user_agent, signed_at, signature_image_url}
    # Status
    status: Mapped[str] = mapped_column(
        String(20), default="submitted"
    )  # draft, submitted, approved, rejected
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45), nullable=True
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    template = relationship("FormTemplate", back_populates="submissions")

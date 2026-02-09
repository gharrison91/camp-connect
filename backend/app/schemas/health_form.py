"""
Camp Connect - Health Form Schemas
Pydantic models for health form templates, form instances, and submissions.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Field Definition ─────────────────────────────────────────


class FormFieldDefinition(BaseModel):
    """Schema for a single form field in a template's field array."""

    id: str
    type: str = Field(
        ...,
        description="Field type: text, textarea, number, date, select, multiselect, checkbox, radio, section, signature",
    )
    label: str
    description: Optional[str] = None
    required: bool = False
    options: Optional[List[str]] = None
    validation: Optional[Dict[str, Any]] = None
    order: int = 0
    section: Optional[str] = None
    conditional: Optional[Dict[str, Any]] = None


# ─── Template Schemas ──────────────────────────────────────────


class HealthFormTemplateCreate(BaseModel):
    """Request to create a new health form template."""

    name: str
    description: Optional[str] = None
    category: str = "health"
    fields: List[FormFieldDefinition]
    required_for_registration: bool = False


class HealthFormTemplateUpdate(BaseModel):
    """Request to update an existing health form template."""

    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    fields: Optional[List[FormFieldDefinition]] = None
    is_active: Optional[bool] = None
    required_for_registration: Optional[bool] = None


class HealthFormTemplateResponse(BaseModel):
    """Health form template details."""

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: str
    fields: List[FormFieldDefinition]
    is_system: bool
    is_active: bool
    version: int
    required_for_registration: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Form Instance Schemas ─────────────────────────────────────


class HealthFormAssign(BaseModel):
    """Request to assign a form template to a camper."""

    template_id: uuid.UUID
    camper_id: uuid.UUID
    event_id: Optional[uuid.UUID] = None
    due_date: Optional[date] = None


class HealthFormResponse(BaseModel):
    """Health form instance details (assigned to a camper)."""

    id: uuid.UUID
    template_id: uuid.UUID
    template_name: str
    template_category: str
    camper_id: uuid.UUID
    camper_name: str
    event_id: Optional[uuid.UUID] = None
    event_name: Optional[str] = None
    status: str
    due_date: Optional[date] = None
    submitted_at: Optional[datetime] = None
    reviewed_by: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Submission Schemas ────────────────────────────────────────


class HealthFormSubmit(BaseModel):
    """Request to submit form data."""

    data: Dict[str, Any]  # field_id -> value mapping
    signature: Optional[str] = None


class HealthFormSubmissionResponse(BaseModel):
    """Submitted form data."""

    id: uuid.UUID
    form_id: uuid.UUID
    data: Dict[str, Any]
    signature: Optional[str] = None
    signed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Review Schema ─────────────────────────────────────────────


class HealthFormReview(BaseModel):
    """Request to approve or reject a submitted form."""

    status: str = Field(
        ...,
        pattern="^(approved|rejected)$",
        description="Must be 'approved' or 'rejected'",
    )
    review_notes: Optional[str] = None

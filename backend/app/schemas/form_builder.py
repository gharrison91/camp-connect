"""
Camp Connect - Form Builder Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Form Template ───────────────────────────────────────────

class FormFieldDefinition(BaseModel):
    """A single field in a form template."""
    id: str
    type: str  # text, textarea, number, email, phone, date, select, checkbox, radio, file, signature, heading, paragraph, divider, custom_html
    label: str = ""
    placeholder: str = ""
    required: bool = False
    width: str = "full"  # full, half
    options: List[Dict[str, Any]] = Field(default_factory=list)
    validation: Dict[str, Any] = Field(default_factory=dict)
    order: int = 0
    custom_css: Optional[str] = None       # Per-field CSS classes
    html_content: Optional[str] = None     # Raw HTML (custom_html type only)
    css_content: Optional[str] = None      # Scoped CSS (custom_html type only)


class FormSettings(BaseModel):
    """Form-level settings."""
    require_signature: bool = False
    allow_save_draft: bool = True
    confirmation_message: str = "Thank you for your submission!"
    redirect_url: Optional[str] = None
    notify_on_submission: bool = True
    notify_emails: List[str] = Field(default_factory=list)
    expires_at: Optional[datetime] = None
    max_submissions: Optional[int] = None
    theme: Dict[str, Any] = Field(default_factory=dict)
    custom_css: Optional[str] = None   # Global form-level custom CSS


class FormTemplateCreate(BaseModel):
    """Create a new form template."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = "general"
    fields: List[Dict[str, Any]] = Field(default_factory=list)
    settings: Dict[str, Any] = Field(default_factory=dict)
    require_signature: bool = False
    status: str = "draft"


class FormTemplateUpdate(BaseModel):
    """Update an existing form template."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    fields: Optional[List[Dict[str, Any]]] = None
    settings: Optional[Dict[str, Any]] = None
    require_signature: Optional[bool] = None
    status: Optional[str] = None


class FormTemplateResponse(BaseModel):
    """Form template response."""
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: str
    status: str
    fields: List[Dict[str, Any]] = Field(default_factory=list)
    settings: Dict[str, Any] = Field(default_factory=dict)
    require_signature: bool = False
    version: int = 1
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FormTemplateListItem(BaseModel):
    """Compact form template for list views."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: str
    status: str
    require_signature: bool = False
    field_count: int = 0
    submission_count: int = 0
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


# ─── Form Submission ─────────────────────────────────────────

class FormSubmissionCreate(BaseModel):
    """Submit a form."""
    template_id: uuid.UUID
    answers: Dict[str, Any] = Field(default_factory=dict)
    signature_data: Optional[Dict[str, Any]] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[uuid.UUID] = None
    status: str = "submitted"


class FormSubmissionResponse(BaseModel):
    """Form submission response."""
    id: uuid.UUID
    template_id: uuid.UUID
    template_name: Optional[str] = None
    submitted_by_user_id: Optional[uuid.UUID] = None
    submitted_by_contact_id: Optional[uuid.UUID] = None
    submitted_by_email: Optional[str] = None
    submitted_by_name: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[uuid.UUID] = None
    answers: Dict[str, Any] = Field(default_factory=dict)
    signature_data: Optional[Dict[str, Any]] = None
    status: str
    ip_address: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime


class FormSubmissionListResponse(BaseModel):
    """Paginated submission list."""
    items: List[FormSubmissionResponse]
    total: int

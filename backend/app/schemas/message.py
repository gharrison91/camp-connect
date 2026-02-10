"""
Camp Connect - Message & Message Template Schemas
Pydantic schemas for communications endpoints.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Message Schemas
# ---------------------------------------------------------------------------


class MessageSend(BaseModel):
    """Request to send a single message (SMS or email)."""

    channel: str = Field(
        ..., pattern="^(sms|email)$", description="Message channel: sms or email"
    )
    to_address: str = Field(
        ..., min_length=1, max_length=255, description="Recipient phone number or email"
    )
    subject: Optional[str] = Field(
        default=None, max_length=500, description="Email subject (required for email)"
    )
    body: str = Field(..., min_length=1, description="Message body text")
    html_body: Optional[str] = Field(
        default=None, description="HTML body for emails"
    )
    template_id: Optional[str] = Field(
        default=None, max_length=100, description="Template ID if using a template"
    )
    recipient_type: Optional[str] = Field(
        default=None,
        pattern="^(contact|staff|manual)$",
        description="Type of recipient",
    )
    recipient_id: Optional[uuid.UUID] = Field(
        default=None, description="Contact or user ID of the recipient"
    )
    related_entity_type: Optional[str] = Field(
        default=None,
        pattern="^(registration|event|camper)$",
        description="Related entity type",
    )
    related_entity_id: Optional[uuid.UUID] = Field(
        default=None, description="Related entity ID"
    )


class MessageResponse(BaseModel):
    """Response schema for a sent message."""

    id: uuid.UUID
    channel: str
    direction: str
    status: str
    from_address: str
    to_address: str
    subject: Optional[str] = None
    body: str
    template_id: Optional[str] = None
    recipient_type: Optional[str] = None
    related_entity_type: Optional[str] = None
    external_id: Optional[str] = None
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageBulkSend(BaseModel):
    """Request to send a message to multiple recipients."""

    channel: str = Field(
        ..., pattern="^(sms|email)$", description="Message channel: sms or email"
    )
    subject: Optional[str] = Field(
        default=None, max_length=500, description="Email subject (required for email)"
    )
    body: str = Field(..., min_length=1, description="Message body text")
    html_body: Optional[str] = Field(
        default=None, description="HTML body for emails"
    )
    template_id: Optional[str] = Field(
        default=None, max_length=100, description="Template ID if using a template"
    )
    recipient_ids: List[uuid.UUID] = Field(
        ..., min_length=1, description="List of contact IDs to send to"
    )
    related_entity_type: Optional[str] = Field(
        default=None,
        pattern="^(registration|event|camper)$",
        description="Related entity type",
    )
    related_entity_id: Optional[uuid.UUID] = Field(
        default=None, description="Related entity ID"
    )


# ---------------------------------------------------------------------------
# Message Template Schemas
# ---------------------------------------------------------------------------


class MessageTemplateCreate(BaseModel):
    """Request to create a new message template."""

    name: str = Field(..., min_length=1, max_length=255)
    channel: str = Field(..., pattern="^(sms|email|both)$")
    subject: Optional[str] = Field(default=None, max_length=500)
    body: str = Field(..., min_length=1)
    html_body: Optional[str] = None
    category: str = Field(
        default="general",
        pattern="^(registration|waitlist|reminder|emergency|general)$",
    )
    variables: List[str] = Field(default_factory=list)


class MessageTemplateResponse(BaseModel):
    """Response schema for a message template."""

    id: uuid.UUID
    name: str
    channel: str
    subject: Optional[str] = None
    body: str
    html_body: Optional[str] = None
    category: str
    variables: List[str]
    is_system: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventRecipientResponse(BaseModel):
    """A contact associated with a camper registered in an event."""

    contact_id: uuid.UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MessageTemplateUpdate(BaseModel):
    """Request to update an existing message template."""

    name: Optional[str] = Field(default=None, max_length=255)
    subject: Optional[str] = Field(default=None, max_length=500)
    body: Optional[str] = None
    html_body: Optional[str] = None
    category: Optional[str] = Field(
        default=None,
        pattern="^(registration|waitlist|reminder|emergency|general)$",
    )
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None

"""
Camp Connect - Staff Certification Schemas
Pydantic models for certification types and staff certification records.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Certification Types ─────────────────────────────────────

class CertificationTypeCreate(BaseModel):
    """Request to create a new certification type."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_required: bool = False
    expiry_days: Optional[int] = Field(default=None, ge=1)


class CertificationTypeUpdate(BaseModel):
    """Request to update a certification type."""
    name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    is_required: Optional[bool] = None
    expiry_days: Optional[int] = Field(default=None, ge=1)


class CertificationTypeResponse(BaseModel):
    """Certification type response."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_required: bool
    expiry_days: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Staff Certification Records ─────────────────────────────

class StaffCertificationCreate(BaseModel):
    """Request to add a certification to a staff member."""
    certification_type_id: uuid.UUID
    status: str = Field(default="pending", pattern="^(pending|valid|expired|revoked)$")
    issued_date: Optional[date] = None
    expiry_date: Optional[date] = None
    document_url: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = None


class StaffCertificationUpdate(BaseModel):
    """Request to update a staff certification record."""
    status: Optional[str] = Field(
        default=None, pattern="^(pending|valid|expired|revoked)$"
    )
    issued_date: Optional[date] = None
    expiry_date: Optional[date] = None
    document_url: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = None
    verified_by: Optional[uuid.UUID] = None


class StaffCertificationResponse(BaseModel):
    """Staff certification record response."""
    id: uuid.UUID
    user_id: uuid.UUID
    certification_type_id: uuid.UUID
    certification_type_name: Optional[str] = None
    status: str
    issued_date: Optional[date] = None
    expiry_date: Optional[date] = None
    document_url: Optional[str] = None
    notes: Optional[str] = None
    verified_by: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

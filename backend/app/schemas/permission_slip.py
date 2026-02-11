"""
Camp Connect - Permission Slip Schemas
Digital permission slips with parent e-signatures.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PermissionSlipCreate(BaseModel):
    """Request to create a new permission slip."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_id: Optional[str] = None
    activity_name: Optional[str] = None
    required_by: str = Field(..., description="Date string YYYY-MM-DD")
    terms_text: str = Field(..., min_length=1)


class PermissionSlipUpdate(BaseModel):
    """Update a permission slip."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    event_id: Optional[str] = None
    activity_name: Optional[str] = None
    required_by: Optional[str] = None
    terms_text: Optional[str] = None


class PermissionSlipResponse(BaseModel):
    """Permission slip returned from API."""
    id: str
    organization_id: str
    title: str
    description: Optional[str] = None
    event_id: Optional[str] = None
    activity_name: Optional[str] = None
    required_by: str
    terms_text: str
    created_by: Optional[str] = None
    created_at: str
    total_assignments: int = 0
    signed_count: int = 0
    pending_count: int = 0
    declined_count: int = 0
    expired_count: int = 0
    model_config = ConfigDict(from_attributes=True)


class AssignRequest(BaseModel):
    """Request to assign a slip to campers."""
    camper_ids: List[str] = Field(..., min_length=1)


class PermissionSlipAssignmentResponse(BaseModel):
    """Assignment of a slip to a specific camper."""
    id: str
    slip_id: str
    camper_id: str
    camper_name: str
    parent_name: Optional[str] = None
    status: str = "pending"
    signed_at: Optional[str] = None
    signature_text: Optional[str] = None
    ip_address: Optional[str] = None
    reminder_sent_at: Optional[str] = None
    created_at: str
    model_config = ConfigDict(from_attributes=True)


class SignRequest(BaseModel):
    """Request to sign a permission slip assignment."""
    signature_text: str = Field(..., min_length=1, max_length=255)
    ip_address: Optional[str] = None


class SlipStats(BaseModel):
    """Aggregate stats for permission slips."""
    total_slips: int = 0
    pending_signatures: int = 0
    signed_count: int = 0
    compliance_rate: float = 0.0

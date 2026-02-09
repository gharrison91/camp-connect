"""
Camp Connect - Staff Onboarding Schemas
Pydantic models for the employee onboarding workflow.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Request Schemas ─────────────────────────────────────────────


class OnboardingCreate(BaseModel):
    """Initiate onboarding for a user."""

    user_id: uuid.UUID


class PersonalInfoUpdate(BaseModel):
    """Update personal information during onboarding step 1."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None


class EmergencyContactData(BaseModel):
    """A single emergency contact entry."""

    name: str
    phone: str
    relationship: str


class EmergencyContactsUpdate(BaseModel):
    """Update emergency contacts during onboarding step 2."""

    contacts: List[EmergencyContactData]


class CertificationCreate(BaseModel):
    """Add a certification during onboarding step 3."""

    name: str
    issuing_authority: Optional[str] = None
    certificate_number: Optional[str] = None
    issued_date: Optional[date] = None
    expiry_date: Optional[date] = None


# ─── Response Schemas ────────────────────────────────────────────


class CertificationResponse(BaseModel):
    """Staff certification in responses."""

    id: uuid.UUID
    name: str
    issuing_authority: Optional[str] = None
    certificate_number: Optional[str] = None
    issued_date: Optional[date] = None
    expiry_date: Optional[date] = None
    document_url: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentResponse(BaseModel):
    """Staff document in responses."""

    id: uuid.UUID
    document_type: str
    file_name: str
    file_size: int
    mime_type: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PolicyAcknowledgmentResponse(BaseModel):
    """Policy acknowledgment in responses."""

    id: uuid.UUID
    policy_name: str
    policy_version: Optional[str] = None
    acknowledged_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OnboardingResponse(BaseModel):
    """Full onboarding record with nested related data."""

    id: uuid.UUID
    user_id: uuid.UUID
    organization_id: uuid.UUID
    status: str
    current_step: int

    # Step completion flags
    personal_info_completed: bool = False
    emergency_contacts_completed: bool = False
    certifications_completed: bool = False
    policy_acknowledgments_completed: bool = False
    payroll_info_completed: bool = False

    # Emergency contacts JSONB
    emergency_contacts_data: Optional[List[dict]] = None

    # Completion timestamp
    completed_at: Optional[datetime] = None
    created_at: datetime

    # User info (flattened from relationship)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None

    # Nested related records
    certifications: List[CertificationResponse] = Field(default_factory=list)
    documents: List[DocumentResponse] = Field(default_factory=list)
    acknowledgments: List[PolicyAcknowledgmentResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(from_attributes=True)


class OnboardingListResponse(BaseModel):
    """Paginated list of onboarding records."""

    items: List[OnboardingResponse]
    total: int

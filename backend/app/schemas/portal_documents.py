"""
Camp Connect - Portal Documents & Forms Schemas
Schemas for parent portal document downloads and form assignments.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PortalDocument(BaseModel):
    """A document shared with a parent through the portal."""
    id: uuid.UUID
    name: str
    type: str  # pdf, doc, docx, image, spreadsheet, other
    size_bytes: int = 0
    uploaded_at: datetime
    camper_name: Optional[str] = None
    download_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PortalDocumentListResponse(BaseModel):
    """Response for portal document listing."""
    items: List[PortalDocument]
    total: int


class PortalFormAssignment(BaseModel):
    """A form assigned to a parent for completion."""
    id: uuid.UUID
    form_name: str
    description: Optional[str] = None
    status: str  # pending, completed, overdue
    due_date: Optional[datetime] = None
    camper_name: Optional[str] = None
    template_id: uuid.UUID
    fields: List[Dict[str, Any]] = Field(default_factory=list)
    settings: Dict[str, Any] = Field(default_factory=dict)
    require_signature: bool = False
    submitted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PortalFormAssignmentListResponse(BaseModel):
    """Response for portal form assignment listing."""
    items: List[PortalFormAssignment]
    total: int


class PortalFormSubmitRequest(BaseModel):
    """Request body for submitting a portal form."""
    answers: Dict[str, Any] = Field(default_factory=dict)
    signature_data: Optional[Dict[str, Any]] = None

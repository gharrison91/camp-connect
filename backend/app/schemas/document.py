"""
Camp Connect - Document Management Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SignatureRecord(BaseModel):
    """Record of a document signature."""
    user_id: str
    name: str
    signed_at: str


class DocumentCreate(BaseModel):
    """Request to create a new document."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    file_url: Optional[str] = Field(default=None, max_length=2048)
    file_type: str = Field(default="other", pattern="^(pdf|doc|image|spreadsheet|other)$")
    file_size: int = Field(default=0, ge=0)
    category: str = Field(default="other", pattern="^(policy|waiver|medical_form|emergency_plan|training|permit|insurance|other)$")
    tags: Optional[List[str]] = None
    version: int = Field(default=1, ge=1)
    requires_signature: bool = False
    expiry_date: Optional[str] = None
    shared_with: Optional[List[str]] = None
    folder_id: Optional[str] = None


class DocumentUpdate(BaseModel):
    """Update document details."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    file_url: Optional[str] = Field(default=None, max_length=2048)
    file_type: Optional[str] = Field(default=None, pattern="^(pdf|doc|image|spreadsheet|other)$")
    file_size: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = Field(default=None, pattern="^(policy|waiver|medical_form|emergency_plan|training|permit|insurance|other)$")
    tags: Optional[List[str]] = None
    version: Optional[int] = Field(default=None, ge=1)
    requires_signature: Optional[bool] = None
    expiry_date: Optional[str] = None
    shared_with: Optional[List[str]] = None
    folder_id: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(active|archived|expired)$")


class DocumentResponse(BaseModel):
    """Document details returned from API."""
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_type: str
    file_size: int
    category: str
    tags: List[str] = []
    uploaded_by: Optional[str] = None
    uploaded_by_name: Optional[str] = None
    version: int = 1
    requires_signature: bool = False
    signed_by: List[SignatureRecord] = []
    expiry_date: Optional[str] = None
    status: str = "active"
    shared_with: List[str] = []
    folder_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class FolderCreate(BaseModel):
    """Request to create a new folder."""
    name: str = Field(..., min_length=1, max_length=255)
    parent_id: Optional[str] = None


class FolderResponse(BaseModel):
    """Folder details returned from API."""
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    parent_id: Optional[str] = None
    document_count: int = 0
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

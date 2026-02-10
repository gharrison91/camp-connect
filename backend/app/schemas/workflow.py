"""
Camp Connect - Workflow Automation Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Workflow ────────────────────────────────────────────────

class WorkflowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    trigger: Dict[str, Any] = Field(default_factory=dict)
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    enrollment_type: str = "automatic"
    re_enrollment: bool = False
    status: str = "draft"


class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    trigger: Optional[Dict[str, Any]] = None
    steps: Optional[List[Dict[str, Any]]] = None
    enrollment_type: Optional[str] = None
    re_enrollment: Optional[bool] = None
    status: Optional[str] = None


class WorkflowResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    description: Optional[str] = None
    status: str
    trigger: Dict[str, Any] = Field(default_factory=dict)
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    enrollment_type: str
    re_enrollment: bool
    total_enrolled: int = 0
    total_completed: int = 0
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkflowListItem(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    status: str
    trigger_type: Optional[str] = None
    step_count: int = 0
    total_enrolled: int = 0
    total_completed: int = 0
    created_at: datetime


# ─── Workflow Execution ──────────────────────────────────────

class WorkflowExecutionResponse(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    workflow_name: Optional[str] = None
    entity_type: str
    entity_id: uuid.UUID
    status: str
    current_step_id: Optional[str] = None
    started_at: datetime
    next_step_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class WorkflowExecutionLogResponse(BaseModel):
    id: uuid.UUID
    step_id: str
    step_type: str
    status: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    executed_at: datetime
    duration_ms: Optional[int] = None


# ─── Workflow Template ──────────────────────────────────────

class WorkflowTemplateResponse(BaseModel):
    key: str
    name: str
    description: str
    category: str
    trigger: Dict[str, Any]
    steps: List[Dict[str, Any]]
    step_count: int


# ─── Contact Association ────────────────────────────────────

class ContactAssociationCreate(BaseModel):
    related_contact_id: uuid.UUID
    relationship_type: str = Field(..., min_length=1, max_length=50)
    notes: Optional[str] = None


class ContactAssociationResponse(BaseModel):
    id: uuid.UUID
    contact_id: uuid.UUID
    related_contact_id: uuid.UUID
    relationship_type: str
    related_contact_name: Optional[str] = None
    related_contact_email: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

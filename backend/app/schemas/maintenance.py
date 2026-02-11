"""
Camp Connect - Facility Maintenance Request Schemas
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MaintenanceRequestBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=5000)
    category: str = Field("other")
    priority: str = Field("medium")
    location: str = Field("", max_length=200)
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    scheduled_date: Optional[str] = None
    photos: List[str] = Field(default_factory=list)
    notes: str = Field("", max_length=5000)


class MaintenanceRequestCreate(MaintenanceRequestBase):
    pass


class MaintenanceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    scheduled_date: Optional[str] = None
    completed_date: Optional[str] = None
    photos: Optional[List[str]] = None
    notes: Optional[str] = None


class AssignRequest(BaseModel):
    assigned_to: str = Field(..., min_length=1)
    assigned_to_name: str = Field(..., min_length=1)


class CompleteRequest(BaseModel):
    actual_cost: Optional[float] = None
    notes: Optional[str] = None


class MaintenanceRequestResponse(BaseModel):
    id: str
    org_id: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    location: str
    reported_by: str
    reported_by_name: str
    assigned_to: str
    assigned_to_name: str
    estimated_cost: Optional[float]
    actual_cost: Optional[float]
    scheduled_date: Optional[str]
    completed_date: Optional[str]
    photos: List[str]
    notes: str
    created_at: str
    updated_at: str
    model_config = {"from_attributes": True}


class MaintenanceStats(BaseModel):
    total: int = 0
    open_count: int = 0
    urgent_count: int = 0
    completed_this_week: int = 0
    avg_completion_hours: Optional[float] = None
    by_category: Dict[str, int] = Field(default_factory=dict)
    by_priority: Dict[str, int] = Field(default_factory=dict)
    by_status: Dict[str, int] = Field(default_factory=dict)

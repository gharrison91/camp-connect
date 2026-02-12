"""
Camp Connect - Task Assignment Schemas
Pydantic models for staff task assignments and tracking.
"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, Field


TASK_CATEGORIES = ["maintenance", "administrative", "programming", "safety", "cleaning", "setup", "other"]
TASK_PRIORITIES = ["low", "medium", "high", "urgent"]
TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"]


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    assigned_to: str = Field(..., min_length=1, description="User ID or name of assignee")
    assigned_by: str = Field(..., min_length=1, description="User ID or name of assigner")
    category: str = Field("other")
    priority: str = Field("medium")
    status: str = Field("pending")
    due_date: Optional[str] = Field(None, description="ISO date string for due date")
    completed_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=5000)


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    assigned_to: str = Field(..., min_length=1)
    category: str = Field("other")
    priority: str = Field("medium")
    due_date: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=5000)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    assigned_to: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=5000)


class TaskItem(BaseModel):
    id: str
    org_id: str
    title: str
    description: Optional[str] = None
    assigned_to: str
    assigned_by: str
    category: str
    priority: str
    status: str
    due_date: Optional[str] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class TaskStats(BaseModel):
    total: int = 0
    pending: int = 0
    in_progress: int = 0
    completed: int = 0
    overdue: int = 0
    by_priority: Dict[str, int] = Field(default_factory=dict)
    by_category: Dict[str, int] = Field(default_factory=dict)

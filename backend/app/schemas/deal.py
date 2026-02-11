"""
Camp Connect - Deal / CRM Pipeline Schemas
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DealCreate(BaseModel):
    title: str
    contact_id: Optional[str] = None
    family_id: Optional[str] = None
    description: Optional[str] = None
    value: float = 0
    stage: str = "lead"
    priority: str = "medium"
    source: Optional[str] = None
    expected_close_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class DealUpdate(BaseModel):
    title: Optional[str] = None
    contact_id: Optional[str] = None
    family_id: Optional[str] = None
    description: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    priority: Optional[str] = None
    source: Optional[str] = None
    expected_close_date: Optional[datetime] = None
    actual_close_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    position: Optional[int] = None


class DealStageUpdate(BaseModel):
    stage: str
    position: int = 0

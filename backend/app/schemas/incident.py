"""
Camp Connect - Incident & Safety Reporting Schemas
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class InvolvedParty(BaseModel):
    person_type: str = Field(..., description="camper or staff")
    person_id: str
    person_name: str
    role: str = Field("involved", description="involved, witness, or reporter")


class FollowUpNote(BaseModel):
    id: str
    note: str
    author_id: str
    author_name: str
    created_at: str


class FollowUpCreate(BaseModel):
    note: str = Field(..., min_length=1)


class IncidentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=5000)
    incident_type: str = Field("other")
    severity: str = Field("medium")
    location: str = Field("", max_length=200)
    date_time: str = Field(...)
    involved_parties: List[InvolvedParty] = Field(default_factory=list)
    actions_taken: str = Field("", max_length=5000)
    attachments: List[str] = Field(default_factory=list)


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    incident_type: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    date_time: Optional[str] = None
    involved_parties: Optional[List[InvolvedParty]] = None
    actions_taken: Optional[str] = None
    attachments: Optional[List[str]] = None


class ResolveRequest(BaseModel):
    resolution: str = Field(..., min_length=1, max_length=5000)


class IncidentResponse(BaseModel):
    id: str
    org_id: str
    title: str
    description: str
    incident_type: str
    severity: str
    status: str
    location: str
    date_time: str
    reported_by: str
    reported_by_name: str
    involved_parties: List[InvolvedParty]
    actions_taken: str
    follow_ups: List[FollowUpNote] = Field(default_factory=list)
    resolution: str
    attachments: List[str]
    created_at: str
    updated_at: str
    model_config = {"from_attributes": True}


class IncidentStats(BaseModel):
    total: int = 0
    open_count: int = 0
    critical_count: int = 0
    resolved_this_week: int = 0
    avg_resolution_hours: Optional[float] = None
    by_type: Dict[str, int] = Field(default_factory=dict)
    by_severity: Dict[str, int] = Field(default_factory=dict)
    by_status: Dict[str, int] = Field(default_factory=dict)
    recent_trend: List[Dict[str, Any]] = Field(default_factory=list)

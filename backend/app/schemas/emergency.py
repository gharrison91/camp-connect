"""
Camp Connect - Emergency Action Plans & Drills Schemas
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PlanStep(BaseModel):
    step_number: int
    title: str
    description: str
    responsible_role: str
    estimated_time: str


class AssemblyPoint(BaseModel):
    name: str
    location: str
    capacity: int


class EmergencyContact(BaseModel):
    name: str
    role: str
    phone: str
    email: str


class EmergencyPlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    plan_type: str = Field("other")
    description: str = Field("", max_length=5000)
    steps: List[PlanStep] = Field(default_factory=list)
    assembly_points: List[AssemblyPoint] = Field(default_factory=list)
    emergency_contacts: List[EmergencyContact] = Field(default_factory=list)
    status: str = Field("draft")
    next_review_date: Optional[str] = None


class EmergencyPlanUpdate(BaseModel):
    name: Optional[str] = None
    plan_type: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[PlanStep]] = None
    assembly_points: Optional[List[AssemblyPoint]] = None
    emergency_contacts: Optional[List[EmergencyContact]] = None
    status: Optional[str] = None
    next_review_date: Optional[str] = None


class EmergencyPlanResponse(BaseModel):
    id: str
    org_id: str
    name: str
    plan_type: str
    description: str
    steps: List[PlanStep] = Field(default_factory=list)
    assembly_points: List[AssemblyPoint] = Field(default_factory=list)
    emergency_contacts: List[EmergencyContact] = Field(default_factory=list)
    status: str
    last_reviewed: Optional[str] = None
    next_review_date: Optional[str] = None
    version: int = 1
    created_at: str
    model_config = {"from_attributes": True}


class DrillRecordCreate(BaseModel):
    plan_id: str = Field(...)
    drill_date: str = Field(...)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    participants_count: int = Field(0)
    evaluator: str = Field("")
    score: int = Field(0, ge=0, le=5)
    observations: str = Field("")
    improvements_needed: List[str] = Field(default_factory=list)
    status: str = Field("scheduled")


class DrillRecordUpdate(BaseModel):
    plan_id: Optional[str] = None
    drill_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    participants_count: Optional[int] = None
    evaluator: Optional[str] = None
    score: Optional[int] = None
    observations: Optional[str] = None
    improvements_needed: Optional[List[str]] = None
    status: Optional[str] = None


class DrillRecordResponse(BaseModel):
    id: str
    org_id: str
    plan_id: str
    plan_name: str
    drill_date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    participants_count: int = 0
    evaluator: str = ""
    score: int = 0
    observations: str = ""
    improvements_needed: List[str] = Field(default_factory=list)
    status: str
    created_at: str
    model_config = {"from_attributes": True}


class EmergencyStats(BaseModel):
    total_active_plans: int = 0
    drills_this_quarter: int = 0
    avg_drill_score: Optional[float] = None
    overdue_reviews: int = 0

"""
Camp Connect - Medical Log Schemas
Pydantic models for medical log entries (nurse visits, medications, treatments).
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class MedicationGiven(BaseModel):
    name: str
    dose: str
    time: str


class Vitals(BaseModel):
    temperature: Optional[str] = None
    blood_pressure: Optional[str] = None
    pulse: Optional[str] = None
    respiratory_rate: Optional[str] = None


class MedicalLogCreate(BaseModel):
    camper_id: str
    camper_name: str
    visit_type: str = Field(..., description="nurse_visit | medication | treatment | injury | illness")
    chief_complaint: str = ""
    description: str = ""
    vitals: Optional[Vitals] = None
    medications_given: List[MedicationGiven] = []
    treatment_notes: str = ""
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    disposition: str = "returned_to_activity"
    parent_notified: bool = False


class MedicalLogUpdate(BaseModel):
    camper_id: Optional[str] = None
    camper_name: Optional[str] = None
    visit_type: Optional[str] = None
    chief_complaint: Optional[str] = None
    description: Optional[str] = None
    vitals: Optional[Vitals] = None
    medications_given: Optional[List[MedicationGiven]] = None
    treatment_notes: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None
    disposition: Optional[str] = None
    parent_notified: Optional[bool] = None


class MedicalLogEntry(BaseModel):
    id: str
    organization_id: str
    camper_id: str
    camper_name: str
    staff_id: str
    staff_name: str
    visit_type: str
    chief_complaint: str
    description: str
    vitals: Optional[Vitals] = None
    medications_given: List[MedicationGiven] = []
    treatment_notes: str
    follow_up_required: bool
    follow_up_date: Optional[str] = None
    disposition: str
    parent_notified: bool
    created_at: str
    updated_at: str


class MedicalLogStats(BaseModel):
    total_visits: int
    visits_today: int
    medications_given_today: int
    follow_ups_pending: int

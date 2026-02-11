"""
Camp Connect - Job Listing / Staff Marketplace Schemas
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class JobListingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: str = "seasonal"
    pay_rate: Optional[float] = None
    pay_type: str = "hourly"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    requirements: Optional[List[str]] = None
    certifications_required: Optional[List[str]] = None
    min_age: Optional[int] = None
    positions_available: int = 1
    is_featured: bool = False
    application_deadline: Optional[datetime] = None


class JobListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    pay_rate: Optional[float] = None
    pay_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    requirements: Optional[List[str]] = None
    certifications_required: Optional[List[str]] = None
    min_age: Optional[int] = None
    positions_available: Optional[int] = None
    is_featured: Optional[bool] = None
    application_deadline: Optional[datetime] = None


class JobApplicationCreate(BaseModel):
    applicant_name: str
    applicant_email: str
    applicant_phone: Optional[str] = None
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    experience_years: Optional[int] = None
    certifications: Optional[List[str]] = None
    availability_start: Optional[datetime] = None
    availability_end: Optional[datetime] = None


class JobApplicationStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

"""Job Listing and Application models for Staff Marketplace."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Float, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.models.base import Base


class JobListing(Base):
    __tablename__ = "job_listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    department = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    employment_type = Column(String(50), default="seasonal")  # seasonal, full_time, part_time, volunteer
    pay_rate = Column(Float, nullable=True)
    pay_type = Column(String(20), default="hourly")  # hourly, weekly, seasonal, stipend
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    requirements = Column(ARRAY(String), nullable=True)
    certifications_required = Column(ARRAY(String), nullable=True)
    min_age = Column(Integer, nullable=True)
    positions_available = Column(Integer, default=1)
    positions_filled = Column(Integer, default=0)
    status = Column(String(50), default="draft")  # draft, published, closed, filled
    is_featured = Column(Boolean, default=False)
    application_deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("job_listings.id"), nullable=False)
    organization_id = Column(UUID(as_uuid=True), nullable=False)
    applicant_name = Column(String(255), nullable=False)
    applicant_email = Column(String(255), nullable=False)
    applicant_phone = Column(String(50), nullable=True)
    resume_url = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)
    experience_years = Column(Integer, nullable=True)
    certifications = Column(ARRAY(String), nullable=True)
    availability_start = Column(DateTime, nullable=True)
    availability_end = Column(DateTime, nullable=True)
    status = Column(String(50), default="submitted")  # submitted, reviewing, interview, offered, hired, rejected
    notes = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

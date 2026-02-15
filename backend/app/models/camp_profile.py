"""Camp Profile model for public camp directory pages."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, Boolean, Float, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from app.models.base import Base


class CampProfile(Base):
    __tablename__ = "camp_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    slug = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    tagline = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    cover_image_url = Column(Text, nullable=True)
    gallery_urls = Column(ARRAY(String), nullable=True)
    website_url = Column(Text, nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    camp_type = Column(ARRAY(String), nullable=True)
    age_range_min = Column(Integer, nullable=True)
    age_range_max = Column(Integer, nullable=True)
    amenities = Column(ARRAY(String), nullable=True)
    activities = Column(ARRAY(String), nullable=True)
    accreditations = Column(ARRAY(String), nullable=True)
    price_range_min = Column(Float, nullable=True)
    price_range_max = Column(Float, nullable=True)
    session_dates = Column(JSONB, nullable=True)
    social_links = Column(JSONB, nullable=True)
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

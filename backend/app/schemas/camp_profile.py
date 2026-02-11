"""
Camp Connect - Camp Profile Schemas
Pydantic models for camp directory endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SessionDate(BaseModel):
    name: str
    start: str
    end: str
    price: float = 0


class SocialLinks(BaseModel):
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    youtube: Optional[str] = None


class CampProfileCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    gallery_urls: Optional[List[str]] = None
    website_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    camp_type: Optional[List[str]] = None
    age_range_min: Optional[int] = None
    age_range_max: Optional[int] = None
    amenities: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    accreditations: Optional[List[str]] = None
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    session_dates: Optional[List[Dict[str, Any]]] = None
    social_links: Optional[Dict[str, Any]] = None


class CampProfileUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    gallery_urls: Optional[List[str]] = None
    website_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    camp_type: Optional[List[str]] = None
    age_range_min: Optional[int] = None
    age_range_max: Optional[int] = None
    amenities: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    accreditations: Optional[List[str]] = None
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    session_dates: Optional[List[Dict[str, Any]]] = None
    social_links: Optional[Dict[str, Any]] = None


class CampProfileResponse(BaseModel):
    id: str
    organization_id: str
    slug: str
    name: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    gallery_urls: Optional[List[str]] = None
    website_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    camp_type: Optional[List[str]] = None
    age_range_min: Optional[int] = None
    age_range_max: Optional[int] = None
    amenities: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    accreditations: Optional[List[str]] = None
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    session_dates: Optional[List[Dict[str, Any]]] = None
    social_links: Optional[Dict[str, Any]] = None
    is_published: bool = False
    is_featured: bool = False
    rating: Optional[float] = None
    review_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DirectorySearchParams(BaseModel):
    q: Optional[str] = None
    camp_type: Optional[str] = None
    state: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    skip: int = 0
    limit: int = 24

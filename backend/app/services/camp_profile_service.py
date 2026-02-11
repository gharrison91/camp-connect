"""
Camp Connect - Camp Profile / Directory Service
Business logic for camp directory profiles.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.camp_profile import CampProfile
from app.models.organization import Organization


def _slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    slug = text.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def _profile_to_dict(profile: CampProfile) -> Dict[str, Any]:
    """Convert a CampProfile ORM object to a plain dict."""
    return {
        "id": str(profile.id),
        "organization_id": str(profile.organization_id),
        "slug": profile.slug,
        "name": profile.name,
        "tagline": profile.tagline,
        "description": profile.description,
        "logo_url": profile.logo_url,
        "cover_image_url": profile.cover_image_url,
        "gallery_urls": profile.gallery_urls,
        "website_url": profile.website_url,
        "email": profile.email,
        "phone": profile.phone,
        "address": profile.address,
        "city": profile.city,
        "state": profile.state,
        "zip_code": profile.zip_code,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "camp_type": profile.camp_type,
        "age_range_min": profile.age_range_min,
        "age_range_max": profile.age_range_max,
        "amenities": profile.amenities,
        "activities": profile.activities,
        "accreditations": profile.accreditations,
        "price_range_min": profile.price_range_min,
        "price_range_max": profile.price_range_max,
        "session_dates": profile.session_dates,
        "social_links": profile.social_links,
        "is_published": profile.is_published,
        "is_featured": profile.is_featured,
        "rating": profile.rating,
        "review_count": profile.review_count,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


async def get_own_profile(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get the camp profile for the current user's organization."""
    result = await db.execute(
        select(CampProfile).where(CampProfile.organization_id == organization_id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        return None
    return _profile_to_dict(profile)


async def upsert_profile(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create or update the camp profile for an organization."""
    result = await db.execute(
        select(CampProfile).where(CampProfile.organization_id == organization_id)
    )
    profile = result.scalar_one_or_none()

    if profile is None:
        # Auto-generate slug from name if not provided
        name = data.get("name", "camp")
        slug = data.pop("slug", None) or _slugify(name)
        # Ensure slug uniqueness
        existing = await db.execute(
            select(CampProfile).where(CampProfile.slug == slug)
        )
        if existing.scalar_one_or_none():
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        profile = CampProfile(
            organization_id=organization_id,
            slug=slug,
            **data,
        )
        db.add(profile)
    else:
        # Handle slug update with uniqueness check
        if "slug" in data and data["slug"] and data["slug"] != profile.slug:
            new_slug = _slugify(data["slug"])
            existing = await db.execute(
                select(CampProfile).where(
                    CampProfile.slug == new_slug,
                    CampProfile.id != profile.id,
                )
            )
            if existing.scalar_one_or_none():
                new_slug = f"{new_slug}-{uuid.uuid4().hex[:6]}"
            data["slug"] = new_slug

        for key, value in data.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        profile.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(profile)
    return _profile_to_dict(profile)


async def publish_profile(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    publish: bool = True,
) -> Optional[Dict[str, Any]]:
    """Publish or unpublish a camp profile."""
    result = await db.execute(
        select(CampProfile).where(CampProfile.organization_id == organization_id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        return None

    profile.is_published = publish
    profile.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(profile)
    return _profile_to_dict(profile)


async def list_published_profiles(
    db: AsyncSession,
    *,
    q: Optional[str] = None,
    camp_type: Optional[str] = None,
    state: Optional[str] = None,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    skip: int = 0,
    limit: int = 24,
) -> Dict[str, Any]:
    """List published camp profiles with search and filters."""
    query = select(CampProfile).where(CampProfile.is_published == True)

    if q:
        search_term = f"%{q}%"
        query = query.where(
            or_(
                CampProfile.name.ilike(search_term),
                CampProfile.tagline.ilike(search_term),
                CampProfile.description.ilike(search_term),
                CampProfile.city.ilike(search_term),
                CampProfile.state.ilike(search_term),
            )
        )

    if camp_type:
        query = query.where(CampProfile.camp_type.any(camp_type))

    if state:
        query = query.where(func.lower(CampProfile.state) == state.lower())

    if age_min is not None:
        query = query.where(
            or_(CampProfile.age_range_max.is_(None), CampProfile.age_range_max >= age_min)
        )

    if age_max is not None:
        query = query.where(
            or_(CampProfile.age_range_min.is_(None), CampProfile.age_range_min <= age_max)
        )

    if price_min is not None:
        query = query.where(
            or_(CampProfile.price_range_max.is_(None), CampProfile.price_range_max >= price_min)
        )

    if price_max is not None:
        query = query.where(
            or_(CampProfile.price_range_min.is_(None), CampProfile.price_range_min <= price_max)
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch page
    query = query.order_by(CampProfile.is_featured.desc(), CampProfile.name).offset(skip).limit(limit)
    result = await db.execute(query)
    profiles = result.scalars().all()

    return {
        "items": [_profile_to_dict(p) for p in profiles],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


async def get_profile_by_slug(
    db: AsyncSession,
    *,
    slug: str,
) -> Optional[Dict[str, Any]]:
    """Get a published camp profile by its URL slug."""
    result = await db.execute(
        select(CampProfile).where(
            CampProfile.slug == slug,
            CampProfile.is_published == True,
        )
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        return None
    return _profile_to_dict(profile)


async def get_featured_profiles(
    db: AsyncSession,
    *,
    limit: int = 6,
) -> List[Dict[str, Any]]:
    """Get featured camp profiles for the directory homepage."""
    result = await db.execute(
        select(CampProfile)
        .where(CampProfile.is_published == True, CampProfile.is_featured == True)
        .order_by(CampProfile.name)
        .limit(limit)
    )
    profiles = result.scalars().all()
    return [_profile_to_dict(p) for p in profiles]

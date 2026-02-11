"""
Camp Connect - Job Listing / Staff Marketplace Service
Business logic for job listings and applications.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_listing import JobListing, JobApplication


# ─── Listings ─────────────────────────────────────────────────

async def list_listings(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List job listings for an organization."""
    query = select(JobListing).where(JobListing.organization_id == organization_id)

    if status_filter:
        query = query.where(JobListing.status == status_filter)

    if search:
        query = query.where(JobListing.title.ilike(f"%{search}%"))

    query = query.order_by(JobListing.created_at.desc())
    result = await db.execute(query)
    listings = result.scalars().all()

    # Batch-load application counts
    listing_ids = [l.id for l in listings]
    app_counts: Dict[uuid.UUID, int] = {}
    if listing_ids:
        count_query = (
            select(
                JobApplication.listing_id,
                func.count(JobApplication.id).label("cnt"),
            )
            .where(JobApplication.listing_id.in_(listing_ids))
            .group_by(JobApplication.listing_id)
        )
        count_result = await db.execute(count_query)
        for row in count_result:
            app_counts[row.listing_id] = row.cnt

    return [_listing_to_dict(l, app_counts.get(l.id, 0)) for l in listings]


async def get_listing(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    listing_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single listing by ID."""
    result = await db.execute(
        select(JobListing)
        .where(JobListing.id == listing_id)
        .where(JobListing.organization_id == organization_id)
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        return None

    # Get application count
    count_result = await db.execute(
        select(func.count(JobApplication.id))
        .where(JobApplication.listing_id == listing_id)
    )
    app_count = count_result.scalar() or 0

    return _listing_to_dict(listing, app_count)


async def create_listing(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new job listing."""
    listing = JobListing(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return _listing_to_dict(listing, 0)


async def update_listing(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    listing_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing listing."""
    result = await db.execute(
        select(JobListing)
        .where(JobListing.id == listing_id)
        .where(JobListing.organization_id == organization_id)
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        return None

    for key, value in data.items():
        setattr(listing, key, value)

    await db.commit()
    await db.refresh(listing)
    return _listing_to_dict(listing, 0)


async def delete_listing(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    listing_id: uuid.UUID,
) -> bool:
    """Delete a listing and its applications."""
    result = await db.execute(
        select(JobListing)
        .where(JobListing.id == listing_id)
        .where(JobListing.organization_id == organization_id)
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        return False

    # Delete associated applications first
    apps_result = await db.execute(
        select(JobApplication).where(JobApplication.listing_id == listing_id)
    )
    for app in apps_result.scalars().all():
        await db.delete(app)

    await db.delete(listing)
    await db.commit()
    return True


async def publish_listing(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    listing_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Publish a draft listing."""
    result = await db.execute(
        select(JobListing)
        .where(JobListing.id == listing_id)
        .where(JobListing.organization_id == organization_id)
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        return None

    listing.status = "published"
    await db.commit()
    await db.refresh(listing)
    return _listing_to_dict(listing, 0)


async def close_listing(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    listing_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Close a listing."""
    result = await db.execute(
        select(JobListing)
        .where(JobListing.id == listing_id)
        .where(JobListing.organization_id == organization_id)
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        return None

    listing.status = "closed"
    await db.commit()
    await db.refresh(listing)
    return _listing_to_dict(listing, 0)


# ─── Applications ─────────────────────────────────────────────

async def list_applications(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    listing_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List applications for a specific listing."""
    result = await db.execute(
        select(JobApplication)
        .where(JobApplication.listing_id == listing_id)
        .where(JobApplication.organization_id == organization_id)
        .order_by(JobApplication.created_at.desc())
    )
    apps = result.scalars().all()

    # Get listing title
    listing_result = await db.execute(
        select(JobListing.title).where(JobListing.id == listing_id)
    )
    listing_title = listing_result.scalar_one_or_none() or "Unknown"

    return [_application_to_dict(a, listing_title) for a in apps]


async def list_all_applications(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List all applications across all listings for an organization."""
    result = await db.execute(
        select(JobApplication)
        .where(JobApplication.organization_id == organization_id)
        .order_by(JobApplication.created_at.desc())
    )
    apps = result.scalars().all()

    # Batch-load listing titles
    listing_ids = {a.listing_id for a in apps}
    title_map: Dict[uuid.UUID, str] = {}
    if listing_ids:
        title_result = await db.execute(
            select(JobListing.id, JobListing.title)
            .where(JobListing.id.in_(listing_ids))
        )
        for row in title_result:
            title_map[row.id] = row.title

    return [_application_to_dict(a, title_map.get(a.listing_id, "Unknown")) for a in apps]


async def get_application(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    application_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single application by ID."""
    result = await db.execute(
        select(JobApplication)
        .where(JobApplication.id == application_id)
        .where(JobApplication.organization_id == organization_id)
    )
    app = result.scalar_one_or_none()
    if app is None:
        return None

    # Get listing title
    listing_result = await db.execute(
        select(JobListing.title).where(JobListing.id == app.listing_id)
    )
    listing_title = listing_result.scalar_one_or_none() or "Unknown"

    return _application_to_dict(app, listing_title)


async def update_application_status(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    application_id: uuid.UUID,
    status: str,
    notes: Optional[str] = None,
    reviewed_by: Optional[uuid.UUID] = None,
) -> Optional[Dict[str, Any]]:
    """Update an application's status."""
    result = await db.execute(
        select(JobApplication)
        .where(JobApplication.id == application_id)
        .where(JobApplication.organization_id == organization_id)
    )
    app = result.scalar_one_or_none()
    if app is None:
        return None

    app.status = status
    if notes is not None:
        app.notes = notes
    if reviewed_by is not None:
        app.reviewed_by = reviewed_by

    # If hired, increment positions_filled on the listing
    if status == "hired":
        listing_result = await db.execute(
            select(JobListing).where(JobListing.id == app.listing_id)
        )
        listing = listing_result.scalar_one_or_none()
        if listing:
            listing.positions_filled = (listing.positions_filled or 0) + 1
            if listing.positions_filled >= listing.positions_available:
                listing.status = "filled"

    await db.commit()
    await db.refresh(app)

    # Get listing title
    listing_result = await db.execute(
        select(JobListing.title).where(JobListing.id == app.listing_id)
    )
    listing_title = listing_result.scalar_one_or_none() or "Unknown"

    return _application_to_dict(app, listing_title)


# ─── Public endpoints ─────────────────────────────────────────

async def list_public_listings(
    db: AsyncSession,
    *,
    search: Optional[str] = None,
    department: Optional[str] = None,
    employment_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List all published listings (public, no auth)."""
    query = select(JobListing).where(JobListing.status == "published")

    if search:
        query = query.where(JobListing.title.ilike(f"%{search}%"))

    if department:
        query = query.where(JobListing.department == department)

    if employment_type:
        query = query.where(JobListing.employment_type == employment_type)

    query = query.order_by(JobListing.is_featured.desc(), JobListing.created_at.desc())
    result = await db.execute(query)
    listings = result.scalars().all()
    return [_listing_to_dict(l, 0) for l in listings]


async def get_public_listing(
    db: AsyncSession,
    *,
    listing_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single published listing (public, no auth)."""
    result = await db.execute(
        select(JobListing)
        .where(JobListing.id == listing_id)
        .where(JobListing.status == "published")
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        return None
    return _listing_to_dict(listing, 0)


async def submit_application(
    db: AsyncSession,
    *,
    listing_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Submit an application to a published listing (public, no auth)."""
    # Verify listing exists and is published
    listing_result = await db.execute(
        select(JobListing)
        .where(JobListing.id == listing_id)
        .where(JobListing.status == "published")
    )
    listing = listing_result.scalar_one_or_none()
    if listing is None:
        return None

    app = JobApplication(
        id=uuid.uuid4(),
        listing_id=listing_id,
        organization_id=listing.organization_id,
        **data,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return _application_to_dict(app, listing.title)


# ─── Helpers ──────────────────────────────────────────────────

def _listing_to_dict(listing: JobListing, application_count: int) -> Dict[str, Any]:
    """Convert a JobListing model to a response dict."""
    return {
        "id": str(listing.id),
        "organization_id": str(listing.organization_id),
        "title": listing.title,
        "description": listing.description,
        "department": listing.department,
        "location": listing.location,
        "employment_type": listing.employment_type,
        "pay_rate": listing.pay_rate,
        "pay_type": listing.pay_type,
        "start_date": listing.start_date.isoformat() if listing.start_date else None,
        "end_date": listing.end_date.isoformat() if listing.end_date else None,
        "requirements": listing.requirements,
        "certifications_required": listing.certifications_required,
        "min_age": listing.min_age,
        "positions_available": listing.positions_available,
        "positions_filled": listing.positions_filled or 0,
        "status": listing.status,
        "is_featured": listing.is_featured or False,
        "application_deadline": listing.application_deadline.isoformat() if listing.application_deadline else None,
        "application_count": application_count,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
        "updated_at": listing.updated_at.isoformat() if listing.updated_at else None,
    }


def _application_to_dict(app: JobApplication, listing_title: str) -> Dict[str, Any]:
    """Convert a JobApplication model to a response dict."""
    return {
        "id": str(app.id),
        "listing_id": str(app.listing_id),
        "listing_title": listing_title,
        "organization_id": str(app.organization_id),
        "applicant_name": app.applicant_name,
        "applicant_email": app.applicant_email,
        "applicant_phone": app.applicant_phone,
        "resume_url": app.resume_url,
        "cover_letter": app.cover_letter,
        "experience_years": app.experience_years,
        "certifications": app.certifications,
        "availability_start": app.availability_start.isoformat() if app.availability_start else None,
        "availability_end": app.availability_end.isoformat() if app.availability_end else None,
        "status": app.status,
        "notes": app.notes,
        "reviewed_by": str(app.reviewed_by) if app.reviewed_by else None,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "updated_at": app.updated_at.isoformat() if app.updated_at else None,
    }

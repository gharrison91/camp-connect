"""
Camp Connect - Job Listing / Staff Marketplace API Endpoints
Full CRUD for listings + applications, plus public endpoints.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.job_listing import (
    JobListingCreate,
    JobListingUpdate,
    JobApplicationCreate,
    JobApplicationStatusUpdate,
)
from app.services import job_listing_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


# ─── Listings (admin, auth required) ─────────────────────────

@router.get("")
async def list_listings(
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(default=None, description="Search by title"),
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all job listings for the organization."""
    return await job_listing_service.list_listings(
        db,
        organization_id=current_user["organization_id"],
        status_filter=status_filter,
        search=search,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_listing(
    body: JobListingCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new job listing."""
    return await job_listing_service.create_listing(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(exclude_unset=True),
    )


@router.get("/applications/all")
async def list_all_applications(
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all applications across all listings."""
    return await job_listing_service.list_all_applications(
        db,
        organization_id=current_user["organization_id"],
    )


@router.get("/applications/{application_id}")
async def get_application(
    application_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single application by ID."""
    result = await job_listing_service.get_application(
        db,
        organization_id=current_user["organization_id"],
        application_id=application_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return result


@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: uuid.UUID,
    body: JobApplicationStatusUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an application's status."""
    result = await job_listing_service.update_application_status(
        db,
        organization_id=current_user["organization_id"],
        application_id=application_id,
        status=body.status,
        notes=body.notes,
        reviewed_by=current_user["id"],
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return result


# ─── Public endpoints (no auth) ──────────────────────────────

@router.get("/public")
async def list_public_listings(
    search: Optional[str] = Query(default=None, description="Search by title"),
    department: Optional[str] = Query(default=None, description="Filter by department"),
    employment_type: Optional[str] = Query(default=None, description="Filter by employment type"),
    db: AsyncSession = Depends(get_db),
):
    """List all published job listings (public, no auth)."""
    return await job_listing_service.list_public_listings(
        db,
        search=search,
        department=department,
        employment_type=employment_type,
    )


@router.get("/public/{listing_id}")
async def get_public_listing(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a single published listing detail (public, no auth)."""
    result = await job_listing_service.get_public_listing(
        db,
        listing_id=listing_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )
    return result


@router.post("/public/{listing_id}/apply", status_code=status.HTTP_201_CREATED)
async def submit_application(
    listing_id: uuid.UUID,
    body: JobApplicationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit an application to a published listing (public, no auth)."""
    result = await job_listing_service.submit_application(
        db,
        listing_id=listing_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or not accepting applications",
        )
    return result


# ─── Listing detail + applications (must come after /public, /applications) ──

@router.get("/{listing_id}")
async def get_listing(
    listing_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single job listing by ID."""
    result = await job_listing_service.get_listing(
        db,
        organization_id=current_user["organization_id"],
        listing_id=listing_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )
    return result


@router.put("/{listing_id}")
async def update_listing(
    listing_id: uuid.UUID,
    body: JobListingUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing job listing."""
    result = await job_listing_service.update_listing(
        db,
        organization_id=current_user["organization_id"],
        listing_id=listing_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )
    return result


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a job listing and its applications."""
    deleted = await job_listing_service.delete_listing(
        db,
        organization_id=current_user["organization_id"],
        listing_id=listing_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )


@router.post("/{listing_id}/publish")
async def publish_listing(
    listing_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Publish a draft listing."""
    result = await job_listing_service.publish_listing(
        db,
        organization_id=current_user["organization_id"],
        listing_id=listing_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )
    return result


@router.post("/{listing_id}/close")
async def close_listing(
    listing_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Close a listing."""
    result = await job_listing_service.close_listing(
        db,
        organization_id=current_user["organization_id"],
        listing_id=listing_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )
    return result


@router.get("/{listing_id}/applications")
async def list_applications(
    listing_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List applications for a specific listing."""
    return await job_listing_service.list_applications(
        db,
        organization_id=current_user["organization_id"],
        listing_id=listing_id,
    )

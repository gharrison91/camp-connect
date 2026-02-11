"""
Camp Connect - Organization API Endpoints
Get and update the current organization.
"""

from __future__ import annotations

import os
import uuid as uuid_mod
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.schemas.organization import OrganizationResponse, OrganizationUpdate
from app.services import org_service

router = APIRouter(prefix="/organizations", tags=["Organizations"])

ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    "image/webp",
}
MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2MB
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", "logos")


@router.get(
    "/me",
    response_model=OrganizationResponse,
)
async def get_my_organization(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's organization details."""
    org = await org_service.get_organization(
        db, organization_id=current_user["organization_id"]
    )
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return org


@router.put(
    "/me",
    response_model=OrganizationResponse,
)
async def update_my_organization(
    body: OrganizationUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update the current organization's details.
    Requires core.settings.manage permission.
    """
    try:
        org = await org_service.update_organization(
            db,
            organization_id=current_user["organization_id"],
            data=body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return org


@router.post("/me/logo")
async def upload_organization_logo(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload an organization logo image.
    Accepts PNG, JPEG, SVG, or WebP. Max 2MB.
    Saves file locally and updates the org's logo_url.
    """
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Allowed: PNG, JPEG, SVG, WebP.",
        )

    # Read file content and validate size
    content = await file.read()
    if len(content) > MAX_LOGO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 2MB.",
        )

    # Determine file extension
    ext_map = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/svg+xml": ".svg",
        "image/webp": ".webp",
    }
    ext = ext_map.get(file.content_type, ".png")

    # Generate unique filename
    org_id = str(current_user["organization_id"])
    filename = f"{org_id}_{uuid_mod.uuid4().hex[:8]}{ext}"

    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Save file
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    # Build the URL path (served statically or via Supabase storage later)
    logo_url = f"/uploads/logos/{filename}"

    # Update organization record
    try:
        await org_service.update_organization(
            db,
            organization_id=current_user["organization_id"],
            data={"logo_url": logo_url},
        )
    except ValueError as e:
        # Cleanup file on DB error
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return {"logo_url": logo_url, "filename": filename}

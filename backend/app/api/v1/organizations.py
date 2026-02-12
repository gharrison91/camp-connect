"""
Camp Connect - Organization API Endpoints
Get and update the current organization.
"""

from __future__ import annotations

import logging
import uuid as uuid_mod
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

from app.api.deps import get_current_user, require_permission
from app.config import settings
from app.database import get_db
from app.schemas.organization import OrganizationResponse, OrganizationUpdate
from app.services import org_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/organizations", tags=["Organizations"])

ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    "image/webp",
}
MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2MB
LOGO_BUCKET = "org-logos"

_supabase_client = None

def _get_supabase():
    """Lazy-init Supabase client for storage operations."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _supabase_client


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
    Upload an organization logo image to Supabase Storage.
    Accepts PNG, JPEG, SVG, or WebP. Max 2MB.
    Returns a public URL for the uploaded logo.
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

    # Generate unique filename scoped to org
    org_id = str(current_user["organization_id"])
    filename = f"{org_id}_{uuid_mod.uuid4().hex[:8]}{ext}"
    storage_path = f"logos/{filename}"

    # Upload to Supabase Storage
    try:
        supabase = _get_supabase()
        supabase.storage.from_(LOGO_BUCKET).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type, "upsert": "true"},
        )
    except Exception as e:
        logger.error(f"Failed to upload logo to Supabase Storage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload logo: {e}",
        )

    # Build a permanent public URL
    logo_url = f"{settings.supabase_url}/storage/v1/object/public/{LOGO_BUCKET}/{storage_path}"

    # Update organization record
    try:
        await org_service.update_organization(
            db,
            organization_id=current_user["organization_id"],
            data={"logo_url": logo_url},
        )
    except ValueError as e:
        # Attempt to clean up the uploaded file
        try:
            supabase = _get_supabase()
            supabase.storage.from_(LOGO_BUCKET).remove([storage_path])
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return {"logo_url": logo_url, "filename": filename}

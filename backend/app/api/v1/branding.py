"""
Camp Connect - Branding API Endpoints
Get, update org branding/theme settings. Upload logo.
"""

from __future__ import annotations

import os
import uuid as uuid_mod
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.models.organization import Organization
from app.schemas.branding import BrandingRead, BrandingUpdate

router = APIRouter(prefix="/branding", tags=["Branding"])

ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/svg+xml",
    "image/webp",
}
MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2 MB
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads",
    "branding",
)

# Default branding values
BRANDING_DEFAULTS: Dict[str, Any] = {
    "primary_color": "#10b981",
    "secondary_color": "#3b82f6",
    "logo_url": None,
    "favicon_url": None,
    "login_bg_url": None,
    "sidebar_style": "dark",
    "font_family": "System",
}

BRANDING_KEYS = set(BRANDING_DEFAULTS.keys())


def _extract_branding(settings: dict) -> dict:
    """Pull branding keys out of the org settings JSONB."""
    branding = settings.get("branding", {})
    result = {}
    for key in BRANDING_KEYS:
        result[key] = branding.get(key, BRANDING_DEFAULTS[key])
    return result


@router.get("", response_model=BrandingRead)
async def get_branding(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current organization\'s branding settings."""
    result = await db.execute(
        select(Organization).where(
            Organization.id == current_user["organization_id"]
        )
    )
    org = result.scalar_one_or_none()
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return _extract_branding(org.settings or {})


@router.put("", response_model=BrandingRead)
async def update_branding(
    body: BrandingUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Update the organization\'s branding settings.
    Requires core.settings.manage permission.
    Only supplied fields are updated; others are left unchanged.
    """
    result = await db.execute(
        select(Organization).where(
            Organization.id == current_user["organization_id"]
        )
    )
    org = result.scalar_one_or_none()
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Validate sidebar_style
    if body.sidebar_style is not None and body.sidebar_style not in ("dark", "light"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="sidebar_style must be \'dark\' or \'light\'",
        )

    # Validate font_family
    allowed_fonts = {"System", "Inter", "Poppins", "Roboto"}
    if body.font_family is not None and body.font_family not in allowed_fonts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"font_family must be one of: {', '.join(sorted(allowed_fonts))}",
        )

    current_settings = dict(org.settings or {})
    branding = dict(current_settings.get("branding", {}))

    # Merge only supplied fields
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key in BRANDING_KEYS:
            branding[key] = value

    current_settings["branding"] = branding
    org.settings = current_settings

    await db.commit()
    await db.refresh(org)

    return _extract_branding(org.settings or {})


@router.post("/upload-logo")
async def upload_branding_logo(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a logo image for branding.
    Accepts PNG, JPEG, SVG, or WebP. Max 2 MB.
    Returns the URL of the uploaded logo.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Allowed: PNG, JPEG, SVG, WebP.",
        )

    content = await file.read()
    if len(content) > MAX_LOGO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 2 MB.",
        )

    ext_map = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/svg+xml": ".svg",
        "image/webp": ".webp",
    }
    ext = ext_map.get(file.content_type, ".png")

    org_id = str(current_user["organization_id"])
    filename = f"brand_{org_id}_{uuid_mod.uuid4().hex[:8]}{ext}"

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    logo_url = f"/uploads/branding/{filename}"

    return {"logo_url": logo_url, "filename": filename}

"""
Camp Connect - Photo Service
Business logic for photo upload, retrieval, and management via Supabase Storage.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

from app.config import settings
from app.models.photo import Photo

logger = logging.getLogger(__name__)

# Supabase client for storage operations
_supabase_client = None


def _get_supabase():
    """Lazy-init Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _supabase_client


# Allowed MIME types for upload
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/heic",
    "image/heif",
}

# Max file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024


def _get_bucket(category: str) -> str:
    """Return the Supabase Storage bucket name for a given category."""
    if category == "camper":
        return "camper-photos"
    elif category == "event":
        return "event-photos"
    # General photos go to camper-photos bucket as a default
    return "camper-photos"


def _build_storage_path(
    organization_id: uuid.UUID,
    category: str,
    entity_id: Optional[uuid.UUID],
    file_name: str,
) -> str:
    """
    Build the storage path within the bucket.
    Format: {organization_id}/{category}/{entity_id}/{uuid}_{file_name}
    """
    unique_prefix = str(uuid.uuid4())[:8]
    entity_part = str(entity_id) if entity_id else "general"
    # Sanitize the file name to avoid issues
    safe_name = file_name.replace(" ", "_")
    return f"{organization_id}/{category}/{entity_part}/{unique_prefix}_{safe_name}"


def get_public_url(file_path: str, bucket: str) -> str:
    """Generate a signed URL for viewing a photo (1 hour expiry)."""
    try:
        supabase = _get_supabase()
        result = supabase.storage.from_(bucket).create_signed_url(
            file_path, 3600  # 1 hour
        )
        if result and "signedURL" in result:
            return result["signedURL"]
        # Fallback: construct a public URL
        return f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{file_path}"
    except Exception as e:
        logger.warning(f"Failed to generate signed URL for {file_path}: {e}")
        return f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{file_path}"


async def upload_photo(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    uploaded_by: uuid.UUID,
    file: UploadFile,
    category: str,
    entity_id: Optional[uuid.UUID] = None,
    caption: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Upload a photo to Supabase Storage and create a database record.

    1. Validate file type and size
    2. Upload to Supabase Storage
    3. Create Photo record in database
    4. Return photo dict with signed URL
    """
    # Validate category
    if category not in ("camper", "event", "general"):
        raise ValueError("Category must be one of: camper, event, general")

    # Validate MIME type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES:
        raise ValueError(
            f"File type '{content_type}' not allowed. "
            f"Allowed types: JPEG, PNG, GIF, WebP, SVG, HEIC"
        )

    # Read file content
    file_content = await file.read()
    file_size = len(file_content)

    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise ValueError(
            f"File size ({file_size / 1024 / 1024:.1f} MB) exceeds "
            f"maximum of {MAX_FILE_SIZE / 1024 / 1024:.0f} MB"
        )

    if file_size == 0:
        raise ValueError("File is empty")

    # Build storage path and determine bucket
    file_name = file.filename or "unnamed"
    bucket = _get_bucket(category)
    storage_path = _build_storage_path(organization_id, category, entity_id, file_name)

    # Upload to Supabase Storage
    try:
        supabase = _get_supabase()
        supabase.storage.from_(bucket).upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        logger.error(f"Supabase Storage upload failed: {e}")
        raise ValueError(f"Failed to upload file to storage: {e}")

    # Create database record
    photo = Photo(
        id=uuid.uuid4(),
        organization_id=organization_id,
        uploaded_by=uploaded_by,
        category=category,
        entity_id=entity_id,
        file_name=file_name,
        file_path=storage_path,
        file_size=file_size,
        mime_type=content_type,
        caption=caption,
        tags=None,
        is_profile_photo=False,
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)

    # Generate signed URL
    url = get_public_url(storage_path, bucket)

    return _photo_to_dict(photo, url)


async def list_photos(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    category: Optional[str] = None,
    entity_id: Optional[uuid.UUID] = None,
) -> List[Dict[str, Any]]:
    """List photos for an organization with optional filters."""
    query = (
        select(Photo)
        .where(Photo.organization_id == organization_id)
        .where(Photo.deleted_at.is_(None))
    )

    if category:
        query = query.where(Photo.category == category)

    if entity_id:
        query = query.where(Photo.entity_id == entity_id)

    query = query.order_by(Photo.created_at.desc())
    result = await db.execute(query)
    photos = result.scalars().all()

    return [
        _photo_to_dict(p, get_public_url(p.file_path, _get_bucket(p.category)))
        for p in photos
    ]


async def get_photo(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    photo_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single photo by ID with signed URL."""
    result = await db.execute(
        select(Photo)
        .where(Photo.id == photo_id)
        .where(Photo.organization_id == organization_id)
        .where(Photo.deleted_at.is_(None))
    )
    photo = result.scalar_one_or_none()
    if photo is None:
        return None

    url = get_public_url(photo.file_path, _get_bucket(photo.category))
    return _photo_to_dict(photo, url)


async def update_photo(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    photo_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update photo metadata (caption, tags, is_profile_photo)."""
    result = await db.execute(
        select(Photo)
        .where(Photo.id == photo_id)
        .where(Photo.organization_id == organization_id)
        .where(Photo.deleted_at.is_(None))
    )
    photo = result.scalar_one_or_none()
    if photo is None:
        return None

    for key, value in data.items():
        setattr(photo, key, value)

    await db.commit()
    await db.refresh(photo)

    url = get_public_url(photo.file_path, _get_bucket(photo.category))
    return _photo_to_dict(photo, url)


async def delete_photo(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    photo_id: uuid.UUID,
) -> bool:
    """Soft-delete a photo and remove from Supabase Storage."""
    result = await db.execute(
        select(Photo)
        .where(Photo.id == photo_id)
        .where(Photo.organization_id == organization_id)
        .where(Photo.deleted_at.is_(None))
    )
    photo = result.scalar_one_or_none()
    if photo is None:
        return False

    # Remove from Supabase Storage
    try:
        bucket = _get_bucket(photo.category)
        supabase = _get_supabase()
        supabase.storage.from_(bucket).remove([photo.file_path])
    except Exception as e:
        logger.warning(f"Failed to delete file from storage: {e}")
        # Continue with soft-delete even if storage deletion fails

    # Soft-delete the database record
    photo.is_deleted = True
    photo.deleted_at = datetime.utcnow()
    await db.commit()
    return True


def _photo_to_dict(photo: Photo, url: str) -> Dict[str, Any]:
    """Convert a Photo model to a response dict."""
    return {
        "id": photo.id,
        "file_name": photo.file_name,
        "file_path": photo.file_path,
        "url": url,
        "file_size": photo.file_size,
        "mime_type": photo.mime_type,
        "caption": photo.caption,
        "tags": photo.tags,
        "category": photo.category,
        "entity_id": photo.entity_id,
        "is_profile_photo": photo.is_profile_photo,
        "uploaded_by": photo.uploaded_by,
        "created_at": photo.created_at,
    }

"""
Camp Connect - Face Recognition API Endpoints
AWS Rekognition integration for identifying campers in photos.
"""

from __future__ import annotations

import asyncio
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_permission
from app.database import get_db
from app.models.camper import Camper
from app.models.photo import Photo
from app.models.photo_face_tag import PhotoFaceTag
from app.schemas.face_tag import CamperPhotoMatch, FaceTagResponse, PhotoFaceTagsResponse
from app.services import rekognition_service
from app.services.photo_service import get_public_url, _get_bucket

router = APIRouter(prefix="/recognition", tags=["Face Recognition"])


@router.get(
    "/photos/{photo_id}/faces",
    response_model=PhotoFaceTagsResponse,
)
async def get_photo_face_tags(
    photo_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("photos.media.view")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all face tags detected in a photo.

    Requires **photos.media.view** permission.
    Returns face bounding boxes with linked camper identities.
    """
    org_id = current_user["organization_id"]

    # Verify photo exists in org
    photo_result = await db.execute(
        select(Photo)
        .where(Photo.id == photo_id)
        .where(Photo.organization_id == org_id)
        .where(Photo.deleted_at.is_(None))
    )
    photo = photo_result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

    # Fetch face tags with camper relationships
    tags_result = await db.execute(
        select(PhotoFaceTag)
        .where(PhotoFaceTag.photo_id == photo_id)
        .where(PhotoFaceTag.organization_id == org_id)
    )
    tags = tags_result.scalars().all()

    # Look up camper names for tags that have a camper_id
    camper_ids = [t.camper_id for t in tags if t.camper_id is not None]
    camper_names: Dict[uuid.UUID, str] = {}
    if camper_ids:
        camper_result = await db.execute(
            select(Camper.id, Camper.first_name, Camper.last_name)
            .where(Camper.id.in_(camper_ids))
        )
        for row in camper_result:
            camper_names[row[0]] = f"{row[1]} {row[2]}"

    face_tags = []
    for tag in tags:
        face_tags.append({
            "id": tag.id,
            "photo_id": tag.photo_id,
            "camper_id": tag.camper_id,
            "camper_name": camper_names.get(tag.camper_id) if tag.camper_id else None,
            "confidence": tag.confidence,
            "similarity": tag.similarity,
            "bounding_box": tag.bounding_box,
        })

    return {"photo_id": photo_id, "face_tags": face_tags}


@router.get(
    "/campers/{camper_id}/photos",
    response_model=List[CamperPhotoMatch],
)
async def get_camper_photos(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("photos.media.view")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all photos containing a specific camper.

    Requires **photos.media.view** permission.
    Returns photos where the camper was identified via face recognition.
    """
    org_id = current_user["organization_id"]

    # Verify camper exists in org
    camper_result = await db.execute(
        select(Camper)
        .where(Camper.id == camper_id)
        .where(Camper.organization_id == org_id)
        .where(Camper.deleted_at.is_(None))
    )
    if camper_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camper not found",
        )

    # Fetch face tags linked to this camper
    tags_result = await db.execute(
        select(PhotoFaceTag)
        .where(PhotoFaceTag.camper_id == camper_id)
        .where(PhotoFaceTag.organization_id == org_id)
    )
    tags = tags_result.scalars().all()

    if not tags:
        return []

    # Fetch the corresponding photos
    photo_ids = [t.photo_id for t in tags]
    photos_result = await db.execute(
        select(Photo)
        .where(Photo.id.in_(photo_ids))
        .where(Photo.deleted_at.is_(None))
    )
    photos_map: Dict[uuid.UUID, Photo] = {
        p.id: p for p in photos_result.scalars().all()
    }

    matches = []
    for tag in tags:
        photo = photos_map.get(tag.photo_id)
        if photo is None:
            continue
        url = get_public_url(photo.file_path, _get_bucket(photo.category))
        matches.append({
            "photo_id": photo.id,
            "url": url,
            "confidence": tag.confidence,
            "similarity": tag.similarity,
            "created_at": photo.created_at,
        })

    return matches


@router.post(
    "/index/{camper_id}",
    status_code=status.HTTP_200_OK,
)
async def index_camper_face(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("photos.media.upload")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger face indexing for a camper.

    Requires **photos.media.upload** permission.
    Downloads the camper's reference photo and indexes it in the
    organization's Rekognition collection.
    """
    org_id = current_user["organization_id"]

    # Fetch camper
    result = await db.execute(
        select(Camper)
        .where(Camper.id == camper_id)
        .where(Camper.organization_id == org_id)
        .where(Camper.deleted_at.is_(None))
    )
    camper = result.scalar_one_or_none()
    if camper is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camper not found",
        )

    if not camper.reference_photo_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Camper has no reference photo. Upload one first.",
        )

    # Download the profile photo directly from Supabase Storage.
    # Profile photos are stored at a deterministic path (not as Photo records),
    # so we extract the storage path from the public URL.
    try:
        from app.services.photo_service import _get_supabase

        supabase = _get_supabase()
        bucket = "camper-photos"
        # Extract storage path from the public URL
        # URL format: {supabase_url}/storage/v1/object/public/{bucket}/{path}
        url_prefix = f"/storage/v1/object/public/{bucket}/"
        ref_url = camper.reference_photo_url
        if url_prefix in ref_url:
            storage_path = ref_url.split(url_prefix, 1)[1]
        else:
            # Fallback: try the deterministic profile path
            storage_path = f"{org_id}/profiles/{camper_id}/profile.jpg"

        image_bytes = supabase.storage.from_(bucket).download(storage_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download reference photo: {e}",
        )

    # Index via Rekognition (synchronous, run in thread)
    try:
        face_id = await asyncio.to_thread(
            rekognition_service.index_camper_face,
            org_id,
            camper_id,
            image_bytes,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face indexing failed: {e}",
        )

    if face_id is None:
        return {
            "status": "no_face_detected",
            "message": "No face was detected in the reference photo.",
        }

    return {
        "status": "indexed",
        "face_id": face_id,
        "camper_id": str(camper_id),
    }


@router.post(
    "/reprocess/{photo_id}",
    status_code=status.HTTP_200_OK,
)
async def reprocess_photo(
    photo_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("photos.media.upload")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Reprocess a photo for face detection and matching.

    Requires **photos.media.upload** permission.
    Downloads the photo, runs Rekognition face search, and creates/updates
    PhotoFaceTag records for any matched campers.
    """
    org_id = current_user["organization_id"]

    # Fetch photo
    result = await db.execute(
        select(Photo)
        .where(Photo.id == photo_id)
        .where(Photo.organization_id == org_id)
        .where(Photo.deleted_at.is_(None))
    )
    photo = result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

    # Download image from Supabase Storage
    try:
        from app.services.photo_service import _get_supabase

        supabase = _get_supabase()
        bucket = _get_bucket(photo.category)
        image_bytes = supabase.storage.from_(bucket).download(photo.file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download photo: {e}",
        )

    # Search faces via Rekognition (synchronous, run in thread)
    try:
        matches = await asyncio.to_thread(
            rekognition_service.search_faces_in_photo,
            org_id,
            image_bytes,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face recognition failed: {e}",
        )

    # Remove existing face tags for this photo to avoid duplicates
    existing_tags = await db.execute(
        select(PhotoFaceTag)
        .where(PhotoFaceTag.photo_id == photo_id)
        .where(PhotoFaceTag.organization_id == org_id)
    )
    for tag in existing_tags.scalars().all():
        await db.delete(tag)

    # Create new face tags from matches
    created_tags = []
    for match in matches:
        camper_id_str = match.get("camper_id", "")
        try:
            camper_uuid = uuid.UUID(camper_id_str)
        except (ValueError, AttributeError):
            camper_uuid = None

        tag = PhotoFaceTag(
            id=uuid.uuid4(),
            organization_id=org_id,
            photo_id=photo_id,
            camper_id=camper_uuid,
            face_id=match.get("face_id"),
            bounding_box=match.get("bounding_box"),
            confidence=match.get("confidence"),
            similarity=match.get("similarity"),
        )
        db.add(tag)
        created_tags.append({
            "camper_id": str(camper_uuid) if camper_uuid else None,
            "similarity": match.get("similarity"),
            "face_id": match.get("face_id"),
        })

    await db.commit()

    return {
        "photo_id": str(photo_id),
        "faces_found": len(created_tags),
        "matches": created_tags,
    }

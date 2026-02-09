"""
Camp Connect - Photo API Endpoints
Upload, list, view, update, and delete photos.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.photo import PhotoListResponse, PhotoUpdate, PhotoUploadResponse
from app.services import photo_service

router = APIRouter(prefix="/photos", tags=["Photos"])


@router.post(
    "",
    response_model=PhotoUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_photo(
    file: UploadFile = File(...),
    category: str = Form(default="general"),
    entity_id: Optional[str] = Form(default=None),
    caption: Optional[str] = Form(default=None),
    current_user: Dict[str, Any] = Depends(
        require_permission("photos.media.upload")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a photo file via multipart form data.

    - **file**: The image file (JPEG, PNG, GIF, WebP, SVG, HEIC)
    - **category**: One of: camper, event, general
    - **entity_id**: Optional UUID of the associated camper or event
    - **caption**: Optional caption for the photo
    """
    parsed_entity_id = None
    if entity_id:
        try:
            parsed_entity_id = uuid.UUID(entity_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="entity_id must be a valid UUID",
            )

    try:
        return await photo_service.upload_photo(
            db,
            organization_id=current_user["organization_id"],
            uploaded_by=current_user["id"],
            file=file,
            category=category,
            entity_id=parsed_entity_id,
            caption=caption,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=List[PhotoListResponse],
)
async def list_photos(
    category: Optional[str] = Query(default=None, description="Filter by category"),
    entity_id: Optional[uuid.UUID] = Query(default=None, description="Filter by entity"),
    current_user: Dict[str, Any] = Depends(
        require_permission("photos.media.view")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List photos for the current organization, with optional filters."""
    return await photo_service.list_photos(
        db,
        organization_id=current_user["organization_id"],
        category=category,
        entity_id=entity_id,
    )


@router.get(
    "/{photo_id}",
    response_model=PhotoUploadResponse,
)
async def get_photo(
    photo_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("photos.media.view")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single photo by ID with a signed view URL."""
    photo = await photo_service.get_photo(
        db,
        organization_id=current_user["organization_id"],
        photo_id=photo_id,
    )
    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )
    return photo


@router.put(
    "/{photo_id}",
    response_model=PhotoUploadResponse,
)
async def update_photo(
    photo_id: uuid.UUID,
    body: PhotoUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("photos.media.upload")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update photo metadata (caption, tags, is_profile_photo)."""
    result = await photo_service.update_photo(
        db,
        organization_id=current_user["organization_id"],
        photo_id=photo_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )
    return result


@router.delete(
    "/{photo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_photo(
    photo_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("photos.media.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a photo and remove from storage."""
    deleted = await photo_service.delete_photo(
        db,
        organization_id=current_user["organization_id"],
        photo_id=photo_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

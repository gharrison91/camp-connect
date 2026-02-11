"""
Camp Connect - Photo Albums API
Albums for organizing and grouping photos.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.photo import Photo, PhotoAlbum

router = APIRouter(prefix="/photo-albums", tags=["Photo Albums"])


# ─── Schemas ──────────────────────────────────────────────

class AlbumCreate(BaseModel):
    name: str
    description: Optional[str] = None
    event_id: Optional[str] = None
    activity_id: Optional[str] = None


class AlbumUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_photo_id: Optional[str] = None


class AlbumResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    cover_photo_id: Optional[str] = None
    cover_photo_url: Optional[str] = None
    event_id: Optional[str] = None
    activity_id: Optional[str] = None
    photo_count: int
    is_auto_generated: bool
    created_at: str
    updated_at: str


# ─── Endpoints ────────────────────────────────────────────

@router.get("", response_model=List[AlbumResponse])
async def list_albums(
    event_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all photo albums for the org."""
    query = (
        select(PhotoAlbum)
        .where(PhotoAlbum.organization_id == current_user["organization_id"])
        .where(PhotoAlbum.deleted_at.is_(None))
        .order_by(PhotoAlbum.updated_at.desc())
    )
    if event_id:
        query = query.where(PhotoAlbum.event_id == event_id)
    if search:
        query = query.where(PhotoAlbum.name.ilike(f"%{search}%"))

    result = await db.execute(query)
    albums = result.scalars().all()

    responses = []
    for album in albums:
        # Get cover photo URL
        cover_url = None
        if album.cover_photo_id:
            pr = await db.execute(
                select(Photo.file_path).where(Photo.id == album.cover_photo_id)
            )
            prow = pr.one_or_none()
            if prow:
                cover_url = prow[0]
        elif album.photo_count > 0:
            # Use first photo as cover
            pr = await db.execute(
                select(Photo.file_path)
                .where(Photo.album_id == album.id)
                .where(Photo.deleted_at.is_(None))
                .order_by(Photo.created_at)
                .limit(1)
            )
            prow = pr.one_or_none()
            if prow:
                cover_url = prow[0]

        responses.append(AlbumResponse(
            id=str(album.id),
            name=album.name,
            description=album.description,
            cover_photo_id=str(album.cover_photo_id) if album.cover_photo_id else None,
            cover_photo_url=cover_url,
            event_id=str(album.event_id) if album.event_id else None,
            activity_id=str(album.activity_id) if album.activity_id else None,
            photo_count=album.photo_count,
            is_auto_generated=album.is_auto_generated,
            created_at=album.created_at.isoformat() if album.created_at else "",
            updated_at=album.updated_at.isoformat() if album.updated_at else "",
        ))
    return responses


@router.post("", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
async def create_album(
    body: AlbumCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new photo album."""
    album = PhotoAlbum(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        name=body.name,
        description=body.description,
        event_id=uuid.UUID(body.event_id) if body.event_id else None,
        activity_id=uuid.UUID(body.activity_id) if body.activity_id else None,
        created_by=current_user["id"],
    )
    db.add(album)
    await db.commit()
    await db.refresh(album)

    return AlbumResponse(
        id=str(album.id),
        name=album.name,
        description=album.description,
        cover_photo_id=None,
        cover_photo_url=None,
        event_id=str(album.event_id) if album.event_id else None,
        activity_id=str(album.activity_id) if album.activity_id else None,
        photo_count=0,
        is_auto_generated=False,
        created_at=album.created_at.isoformat() if album.created_at else "",
        updated_at=album.updated_at.isoformat() if album.updated_at else "",
    )


@router.get("/{album_id}", response_model=AlbumResponse)
async def get_album(
    album_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get album details."""
    result = await db.execute(
        select(PhotoAlbum)
        .where(PhotoAlbum.id == album_id)
        .where(PhotoAlbum.organization_id == current_user["organization_id"])
        .where(PhotoAlbum.deleted_at.is_(None))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    return AlbumResponse(
        id=str(album.id),
        name=album.name,
        description=album.description,
        cover_photo_id=str(album.cover_photo_id) if album.cover_photo_id else None,
        event_id=str(album.event_id) if album.event_id else None,
        activity_id=str(album.activity_id) if album.activity_id else None,
        photo_count=album.photo_count,
        is_auto_generated=album.is_auto_generated,
        created_at=album.created_at.isoformat() if album.created_at else "",
        updated_at=album.updated_at.isoformat() if album.updated_at else "",
    )


@router.put("/{album_id}", response_model=AlbumResponse)
async def update_album(
    album_id: uuid.UUID,
    body: AlbumUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an album."""
    result = await db.execute(
        select(PhotoAlbum)
        .where(PhotoAlbum.id == album_id)
        .where(PhotoAlbum.organization_id == current_user["organization_id"])
        .where(PhotoAlbum.deleted_at.is_(None))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "cover_photo_id" and value:
            value = uuid.UUID(value)
        setattr(album, key, value)

    await db.commit()
    await db.refresh(album)

    return AlbumResponse(
        id=str(album.id),
        name=album.name,
        description=album.description,
        cover_photo_id=str(album.cover_photo_id) if album.cover_photo_id else None,
        event_id=str(album.event_id) if album.event_id else None,
        activity_id=str(album.activity_id) if album.activity_id else None,
        photo_count=album.photo_count,
        is_auto_generated=album.is_auto_generated,
        created_at=album.created_at.isoformat() if album.created_at else "",
        updated_at=album.updated_at.isoformat() if album.updated_at else "",
    )


@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_album(
    album_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete an album. Photos are not deleted, just unlinked."""
    from datetime import datetime, timezone
    result = await db.execute(
        select(PhotoAlbum)
        .where(PhotoAlbum.id == album_id)
        .where(PhotoAlbum.organization_id == current_user["organization_id"])
        .where(PhotoAlbum.deleted_at.is_(None))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    album.deleted_at = datetime.now(timezone.utc)

    # Unlink photos from this album
    from sqlalchemy import update
    await db.execute(
        update(Photo).where(Photo.album_id == album_id).values(album_id=None)
    )
    await db.commit()


@router.post("/{album_id}/photos")
async def add_photos_to_album(
    album_id: uuid.UUID,
    photo_ids: List[str],
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add photos to an album."""
    result = await db.execute(
        select(PhotoAlbum)
        .where(PhotoAlbum.id == album_id)
        .where(PhotoAlbum.organization_id == current_user["organization_id"])
        .where(PhotoAlbum.deleted_at.is_(None))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    from sqlalchemy import update
    count = 0
    for pid in photo_ids:
        await db.execute(
            update(Photo)
            .where(Photo.id == uuid.UUID(pid))
            .where(Photo.organization_id == current_user["organization_id"])
            .values(album_id=album_id)
        )
        count += 1

    album.photo_count = album.photo_count + count
    await db.commit()

    return {"added": count, "total_photos": album.photo_count}


@router.delete("/{album_id}/photos")
async def remove_photos_from_album(
    album_id: uuid.UUID,
    photo_ids: List[str],
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove photos from an album (photos are not deleted, just unlinked)."""
    result = await db.execute(
        select(PhotoAlbum)
        .where(PhotoAlbum.id == album_id)
        .where(PhotoAlbum.organization_id == current_user["organization_id"])
        .where(PhotoAlbum.deleted_at.is_(None))
    )
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    from sqlalchemy import update
    for pid in photo_ids:
        await db.execute(
            update(Photo)
            .where(Photo.id == uuid.UUID(pid))
            .where(Photo.album_id == album_id)
            .values(album_id=None)
        )

    album.photo_count = max(0, album.photo_count - len(photo_ids))
    await db.commit()

    return {"removed": len(photo_ids), "total_photos": album.photo_count}

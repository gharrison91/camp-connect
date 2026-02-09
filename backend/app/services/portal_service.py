"""
Camp Connect - Parent Portal Service
Scoped queries that let parents view their campers, photos, invoices,
and submit health forms.  All queries are restricted to the parent's
linked campers and organization.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camper import Camper
from app.models.camper_contact import CamperContact
from app.models.health_form import HealthForm, HealthFormSubmission
from app.models.payment import Invoice
from app.models.photo import Photo
from app.models.photo_face_tag import PhotoFaceTag


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _calculate_age(dob: Optional[Any]) -> Optional[int]:
    """Calculate age from date of birth."""
    if dob is None:
        return None
    from datetime import date
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _photo_url(file_path: str, category: str) -> str:
    """Generate a public/signed URL for a photo, best-effort."""
    try:
        from app.services.photo_service import get_public_url
        bucket = "event-photos" if category == "event" else "camper-photos"
        return get_public_url(file_path, bucket)
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# 1. List My Campers
# ---------------------------------------------------------------------------

async def list_my_campers(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    contact_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """
    List campers linked to this contact via the camper_contacts junction table.
    Returns basic info suitable for a parent dashboard.
    """
    result = await db.execute(
        select(CamperContact)
        .options(selectinload(CamperContact.camper))
        .where(CamperContact.contact_id == contact_id)
    )
    links = result.scalars().all()

    campers: List[Dict[str, Any]] = []
    for link in links:
        camper = link.camper
        if camper is None or camper.deleted_at is not None:
            continue
        if camper.organization_id != organization_id:
            continue
        campers.append({
            "id": camper.id,
            "first_name": camper.first_name,
            "last_name": camper.last_name,
            "age": _calculate_age(camper.date_of_birth),
            "gender": camper.gender,
            "reference_photo_url": camper.reference_photo_url,
        })

    return campers


# ---------------------------------------------------------------------------
# 2. Get My Camper Profile (full detail, scoped)
# ---------------------------------------------------------------------------

async def get_my_camper_profile(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
    contact_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """
    Verify the camper is linked to the requesting contact, then delegate
    to camper_profile_service for the full profile payload.
    """
    # Verify link exists
    link_result = await db.execute(
        select(CamperContact).where(
            CamperContact.contact_id == contact_id,
            CamperContact.camper_id == camper_id,
        )
    )
    link = link_result.scalar_one_or_none()
    if link is None:
        return None

    # Delegate to the existing profile service
    from app.services.camper_profile_service import get_camper_profile

    return await get_camper_profile(
        db,
        organization_id=organization_id,
        camper_id=camper_id,
    )


# ---------------------------------------------------------------------------
# 3. List My Invoices
# ---------------------------------------------------------------------------

async def list_my_invoices(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    contact_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """
    List invoices where the contact_id matches the authenticated parent.
    """
    result = await db.execute(
        select(Invoice)
        .where(Invoice.organization_id == organization_id)
        .where(Invoice.contact_id == contact_id)
        .where(Invoice.deleted_at.is_(None))
        .order_by(Invoice.created_at.desc())
    )
    invoices = result.scalars().all()

    items: List[Dict[str, Any]] = []
    for inv in invoices:
        items.append({
            "id": inv.id,
            "status": inv.status,
            "subtotal": float(inv.subtotal),
            "tax": float(inv.tax),
            "total": float(inv.total),
            "due_date": inv.due_date,
            "paid_at": inv.paid_at,
            "line_items": inv.line_items,
            "notes": inv.notes,
            "created_at": inv.created_at,
        })

    return items


# ---------------------------------------------------------------------------
# 4. List My Photos
# ---------------------------------------------------------------------------

async def list_my_photos(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_ids: List[uuid.UUID],
) -> List[Dict[str, Any]]:
    """
    List photos for all linked campers.  Uses face-tag records to find
    photos where the camper appears, plus any photos directly categorised
    as 'camper' with entity_id matching.
    """
    if not camper_ids:
        return []

    # Photos via face tags (AI-matched)
    tag_result = await db.execute(
        select(PhotoFaceTag)
        .options(selectinload(PhotoFaceTag.photo))
        .where(PhotoFaceTag.organization_id == organization_id)
        .where(PhotoFaceTag.camper_id.in_(camper_ids))
        .order_by(PhotoFaceTag.created_at.desc())
    )
    face_tags = tag_result.scalars().all()

    seen_ids: set = set()
    items: List[Dict[str, Any]] = []

    for tag in face_tags:
        photo = tag.photo
        if photo is None or photo.deleted_at is not None:
            continue
        if photo.id in seen_ids:
            continue
        seen_ids.add(photo.id)
        items.append({
            "id": photo.id,
            "url": _photo_url(photo.file_path, photo.category),
            "file_name": photo.file_name,
            "caption": photo.caption,
            "category": photo.category,
            "created_at": photo.created_at,
        })

    # Also include photos directly linked by entity_id (category='camper')
    direct_result = await db.execute(
        select(Photo)
        .where(Photo.organization_id == organization_id)
        .where(Photo.category == "camper")
        .where(Photo.entity_id.in_(camper_ids))
        .where(Photo.deleted_at.is_(None))
        .order_by(Photo.created_at.desc())
    )
    direct_photos = direct_result.scalars().all()

    for photo in direct_photos:
        if photo.id in seen_ids:
            continue
        seen_ids.add(photo.id)
        items.append({
            "id": photo.id,
            "url": _photo_url(photo.file_path, photo.category),
            "file_name": photo.file_name,
            "caption": photo.caption,
            "category": photo.category,
            "created_at": photo.created_at,
        })

    return items


# ---------------------------------------------------------------------------
# 5. Submit Health Form
# ---------------------------------------------------------------------------

async def submit_health_form(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    health_form_id: uuid.UUID,
    contact_id: uuid.UUID,
    form_data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    Submit a health form on behalf of a linked camper.

    1. Load the HealthForm and verify it belongs to a camper linked to this contact.
    2. Create (or update) the HealthFormSubmission with the supplied data.
    3. Set form status to 'submitted' and record submitted_at.
    """
    # Load the health form
    form_result = await db.execute(
        select(HealthForm)
        .options(selectinload(HealthForm.template))
        .where(HealthForm.id == health_form_id)
        .where(HealthForm.organization_id == organization_id)
        .where(HealthForm.deleted_at.is_(None))
    )
    form = form_result.scalar_one_or_none()
    if form is None:
        return None

    # Verify the camper on this form is linked to the contact
    link_result = await db.execute(
        select(CamperContact).where(
            CamperContact.contact_id == contact_id,
            CamperContact.camper_id == form.camper_id,
        )
    )
    link = link_result.scalar_one_or_none()
    if link is None:
        return None

    # Create or update the submission record
    now = datetime.now(timezone.utc)
    if form.submission:
        # Update existing submission
        form.submission.data = form_data
        form.submission.signed_at = now
    else:
        submission = HealthFormSubmission(
            organization_id=organization_id,
            form_id=form.id,
            data=form_data,
            signed_at=now,
        )
        db.add(submission)

    # Update form status
    form.status = "submitted"
    form.submitted_at = now

    await db.commit()
    await db.refresh(form)

    return {
        "id": form.id,
        "template_name": form.template.name if form.template else None,
        "camper_id": form.camper_id,
        "status": form.status,
        "submitted_at": form.submitted_at,
    }

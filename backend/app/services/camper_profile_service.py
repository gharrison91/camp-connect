"""
Camp Connect - Camper Profile Service
Aggregates comprehensive camper data from multiple tables into a single profile.
"""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camper import Camper
from app.models.camper_contact import CamperContact
from app.models.contact import Contact
from app.models.event import Event
from app.models.family import Family
from app.models.health_form import HealthForm, HealthFormTemplate
from app.models.message import Message
from app.models.photo import Photo
from app.models.photo_face_tag import PhotoFaceTag
from app.models.registration import Registration


async def get_camper_profile(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """
    Build a comprehensive camper profile by aggregating data from multiple tables.

    Returns a dictionary containing:
    - Basic camper info (name, dob, age, school, etc.)
    - Contacts (parents/guardians linked via camper_contacts)
    - Family data (family name, siblings, family contacts)
    - Registrations with full event details
    - Health forms with template names
    - Photos (tagged photos + reference photo)
    - Communications (messages related to this camper)
    - Financial summary (total due, amount paid)

    Returns None if the camper is not found.
    """

    # ── 1. Fetch the camper with contacts and registrations ──────────────
    result = await db.execute(
        select(Camper)
        .options(
            selectinload(Camper.camper_contacts).selectinload(CamperContact.contact),
            selectinload(Camper.registrations),
        )
        .where(Camper.id == camper_id)
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
    )
    camper = result.scalar_one_or_none()
    if camper is None:
        return None

    # Build basic camper info
    camper_info = {
        "id": camper.id,
        "first_name": camper.first_name,
        "last_name": camper.last_name,
        "date_of_birth": camper.date_of_birth,
        "age": _calculate_age(camper.date_of_birth),
        "gender": camper.gender,
        "school": camper.school,
        "grade": camper.grade,
        "city": camper.city,
        "state": camper.state,
        "allergies": camper.allergies,
        "dietary_restrictions": camper.dietary_restrictions,
        "custom_fields": camper.custom_fields,
        "reference_photo_url": camper.reference_photo_url,
        "family_id": camper.family_id,
        "created_at": camper.created_at,
        "updated_at": camper.updated_at,
    }

    # Build contacts list
    contacts = _build_contacts_list(camper)

    # ── 2. Fetch family data ─────────────────────────────────────────────
    family_data = None
    if camper.family_id:
        family_data = await _fetch_family_data(
            db, camper.family_id, camper_id
        )

    # ── 3. Fetch registrations with event details ────────────────────────
    registrations = await _fetch_registrations_with_events(
        db, camper_id, organization_id
    )

    # ── 4. Fetch health forms ────────────────────────────────────────────
    health_forms = await _fetch_health_forms(db, camper_id, organization_id)

    # ── 5. Fetch photos ──────────────────────────────────────────────────
    photos = await _fetch_photos(db, camper_id, organization_id)

    # ── 6. Fetch communications ──────────────────────────────────────────
    communications = await _fetch_communications(
        db, camper_id, organization_id
    )

    # ── 7. Calculate financial summary ───────────────────────────────────
    financial_summary = _calculate_financial_summary(registrations)

    return {
        **camper_info,
        "contacts": contacts,
        "family": family_data,
        "registrations": registrations,
        "health_forms": health_forms,
        "photos": photos,
        "communications": communications,
        "financial_summary": financial_summary,
    }


# ─── Helper Functions ────────────────────────────────────────────────────


def _calculate_age(dob: Optional[date]) -> Optional[int]:
    """Calculate age from date of birth."""
    if dob is None:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _build_contacts_list(camper: Camper) -> List[Dict[str, Any]]:
    """Build a list of contact dicts from loaded camper_contacts."""
    contacts: List[Dict[str, Any]] = []
    if camper.camper_contacts:
        for cc in camper.camper_contacts:
            contact = cc.contact
            if contact and not contact.deleted_at:
                contacts.append({
                    "contact_id": contact.id,
                    "first_name": contact.first_name,
                    "last_name": contact.last_name,
                    "email": contact.email,
                    "phone": contact.phone,
                    "address": contact.address,
                    "city": contact.city,
                    "state": contact.state,
                    "zip_code": contact.zip_code,
                    "relationship_type": cc.relationship_type,
                    "is_primary": cc.is_primary,
                    "is_emergency": cc.is_emergency,
                    "is_authorized_pickup": cc.is_authorized_pickup,
                })
    return contacts


async def _fetch_family_data(
    db: AsyncSession,
    family_id: uuid.UUID,
    current_camper_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Fetch family info including siblings and family contacts."""
    result = await db.execute(
        select(Family)
        .options(
            selectinload(Family.campers),
            selectinload(Family.contacts),
        )
        .where(Family.id == family_id)
        .where(Family.deleted_at.is_(None))
    )
    family = result.scalar_one_or_none()
    if family is None:
        return None

    # Siblings = other campers in the same family (exclude current camper)
    siblings = []
    for sibling in (family.campers or []):
        if sibling.id != current_camper_id and not sibling.deleted_at:
            siblings.append({
                "id": sibling.id,
                "first_name": sibling.first_name,
                "last_name": sibling.last_name,
                "date_of_birth": sibling.date_of_birth,
                "age": _calculate_age(sibling.date_of_birth),
            })

    # Family contacts
    family_contacts = []
    for contact in (family.contacts or []):
        if not contact.deleted_at:
            family_contacts.append({
                "id": contact.id,
                "first_name": contact.first_name,
                "last_name": contact.last_name,
                "email": contact.email,
                "phone": contact.phone,
                "relationship_type": contact.relationship_type,
            })

    return {
        "id": family.id,
        "family_name": family.family_name,
        "campers": siblings,
        "contacts": family_contacts,
    }


async def _fetch_registrations_with_events(
    db: AsyncSession,
    camper_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Fetch registrations with full event details joined."""
    result = await db.execute(
        select(Registration)
        .options(selectinload(Registration.event))
        .where(Registration.camper_id == camper_id)
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
        .order_by(Registration.registered_at.desc())
    )
    registrations = result.scalars().all()

    items: List[Dict[str, Any]] = []
    for reg in registrations:
        event = reg.event
        event_data = None
        if event and not event.deleted_at:
            event_data = {
                "id": event.id,
                "name": event.name,
                "description": event.description,
                "start_date": event.start_date,
                "end_date": event.end_date,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "price": float(event.price) if event.price is not None else 0.0,
                "deposit_amount": (
                    float(event.deposit_amount)
                    if event.deposit_amount is not None
                    else None
                ),
                "status": event.status,
            }

        items.append({
            "id": reg.id,
            "event_id": reg.event_id,
            "status": reg.status,
            "payment_status": reg.payment_status,
            "registered_at": reg.registered_at,
            "special_requests": reg.special_requests,
            "activity_requests": reg.activity_requests,
            "event": event_data,
        })

    return items


async def _fetch_health_forms(
    db: AsyncSession,
    camper_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Fetch health forms for a camper with template names."""
    result = await db.execute(
        select(HealthForm)
        .options(
            selectinload(HealthForm.template),
            selectinload(HealthForm.submission),
        )
        .where(HealthForm.camper_id == camper_id)
        .where(HealthForm.organization_id == organization_id)
        .where(HealthForm.deleted_at.is_(None))
        .order_by(HealthForm.created_at.desc())
    )
    forms = result.scalars().all()

    items: List[Dict[str, Any]] = []
    for form in forms:
        template = form.template
        items.append({
            "id": form.id,
            "template_name": template.name if template and not template.deleted_at else None,
            "status": form.status,
            "due_date": form.due_date,
            "submitted_at": form.submitted_at,
            "event_name": None,  # Event name would need separate lookup; keep null for now
        })

    return items


def _get_photo_url(file_path: str, category: str) -> str:
    """Generate a public URL for a photo."""
    try:
        from app.services.photo_service import get_public_url
        bucket = "event-photos" if category == "event" else "camper-photos"
        return get_public_url(file_path, bucket)
    except Exception:
        return ""


async def _fetch_photos(
    db: AsyncSession,
    camper_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Fetch photos where the camper is face-tagged."""
    result = await db.execute(
        select(PhotoFaceTag)
        .options(
            selectinload(PhotoFaceTag.photo).selectinload(Photo.event),
        )
        .where(PhotoFaceTag.camper_id == camper_id)
        .where(PhotoFaceTag.organization_id == organization_id)
        .order_by(PhotoFaceTag.created_at.desc())
    )
    face_tags = result.scalars().all()

    items: List[Dict[str, Any]] = []
    for tag in face_tags:
        photo = tag.photo
        if photo and not photo.deleted_at:
            event = photo.event
            items.append({
                "id": photo.id,
                "url": _get_photo_url(photo.file_path, photo.category),
                "file_name": photo.file_name,
                "caption": photo.caption,
                "similarity": tag.similarity,
                "event_id": photo.event_id,
                "event_name": event.name if event and not event.deleted_at else None,
                "created_at": photo.created_at,
            })

    return items


async def _fetch_communications(
    db: AsyncSession,
    camper_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Fetch messages related to this camper."""
    result = await db.execute(
        select(Message)
        .where(Message.related_entity_type == "camper")
        .where(Message.related_entity_id == camper_id)
        .where(Message.organization_id == organization_id)
        .where(Message.deleted_at.is_(None))
        .order_by(Message.created_at.desc())
    )
    messages = result.scalars().all()

    items: List[Dict[str, Any]] = []
    for msg in messages:
        items.append({
            "id": msg.id,
            "channel": msg.channel,
            "direction": msg.direction,
            "status": msg.status,
            "from_address": msg.from_address,
            "to_address": msg.to_address,
            "subject": msg.subject,
            "body": msg.body,
            "sent_at": msg.sent_at,
            "delivered_at": msg.delivered_at,
            "created_at": msg.created_at,
        })

    return items


def _calculate_financial_summary(
    registrations: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Calculate financial summary from registration data.

    - total_due: sum of event prices for confirmed (non-cancelled) registrations
    - total_paid: estimated from payment_status values
    - balance: total_due - total_paid
    """
    total_due = Decimal("0.00")
    total_paid = Decimal("0.00")
    registration_count = 0

    for reg in registrations:
        # Skip cancelled registrations
        if reg["status"] == "cancelled":
            continue

        registration_count += 1
        event = reg.get("event")
        if event is None:
            continue

        price = Decimal(str(event.get("price", 0)))
        total_due += price

        # Determine paid amount based on payment_status
        payment_status = reg.get("payment_status", "unpaid")
        if payment_status == "paid":
            total_paid += price
        elif payment_status == "deposit_paid":
            deposit = event.get("deposit_amount")
            if deposit is not None:
                total_paid += Decimal(str(deposit))
        # "unpaid" and "refunded" contribute 0

    balance = total_due - total_paid

    return {
        "total_due": float(total_due),
        "total_paid": float(total_paid),
        "balance": float(balance),
        "registration_count": registration_count,
    }

"""
Camp Connect - Camper Service
Business logic for camper (child/participant) management.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camper import Camper
from app.models.camper_contact import CamperContact
from app.models.contact import Contact
from app.models.registration import Registration


async def list_campers(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    search: Optional[str] = None,
    event_id: Optional[uuid.UUID] = None,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    """List campers with filters and pagination."""
    query = (
        select(Camper)
        .options(
            selectinload(Camper.camper_contacts).selectinload(CamperContact.contact),
            selectinload(Camper.registrations),
        )
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
    )

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Camper.first_name.ilike(search_pattern))
            | (Camper.last_name.ilike(search_pattern))
        )

    if event_id:
        query = query.where(
            Camper.id.in_(
                select(Registration.camper_id)
                .where(Registration.event_id == event_id)
                .where(Registration.status != "cancelled")
            )
        )

    # Age filtering based on date_of_birth
    today = date.today()
    if age_min is not None:
        max_dob = date(today.year - age_min, today.month, today.day)
        query = query.where(Camper.date_of_birth <= max_dob)
    if age_max is not None:
        min_dob = date(today.year - age_max - 1, today.month, today.day)
        query = query.where(Camper.date_of_birth > min_dob)

    # Count total before pagination
    from sqlalchemy import func as sqlfunc
    count_query = (
        select(sqlfunc.count())
        .select_from(Camper)
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
    )
    if search:
        count_query = count_query.where(
            (Camper.first_name.ilike(f"%{search}%"))
            | (Camper.last_name.ilike(f"%{search}%"))
        )
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = query.order_by(Camper.last_name, Camper.first_name)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    campers = result.scalars().all()

    return {
        "items": [_camper_to_dict(c) for c in campers],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


async def get_camper(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single camper with contacts and registrations."""
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
    return _camper_to_dict(camper)


async def create_camper(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
    contacts: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Create a camper, optionally linking contacts."""
    camper = Camper(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(camper)

    # Link contacts if provided
    if contacts:
        for contact_link in contacts:
            cc = CamperContact(
                id=uuid.uuid4(),
                camper_id=camper.id,
                contact_id=contact_link["contact_id"],
                relationship_type=contact_link.get("relationship_type", "parent"),
                is_primary=contact_link.get("is_primary", False),
                is_emergency=contact_link.get("is_emergency", False),
                is_authorized_pickup=contact_link.get("is_authorized_pickup", False),
            )
            db.add(cc)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Camper)
        .options(
            selectinload(Camper.camper_contacts).selectinload(CamperContact.contact),
            selectinload(Camper.registrations),
        )
        .where(Camper.id == camper.id)
    )
    camper = result.scalar_one()
    return _camper_to_dict(camper)


async def update_camper(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update a camper."""
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

    for key, value in data.items():
        setattr(camper, key, value)

    await db.commit()
    await db.refresh(camper)
    return _camper_to_dict(camper)


async def delete_camper(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
) -> bool:
    """Soft-delete a camper."""
    result = await db.execute(
        select(Camper)
        .where(Camper.id == camper_id)
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
    )
    camper = result.scalar_one_or_none()
    if camper is None:
        return False

    camper.is_deleted = True
    camper.deleted_at = datetime.utcnow()
    await db.commit()
    return True


async def link_contact(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
    contact_id: uuid.UUID,
    relationship_type: str = "parent",
    is_primary: bool = False,
    is_emergency: bool = False,
    is_authorized_pickup: bool = False,
) -> Dict[str, Any]:
    """Link a contact to a camper."""
    # Verify camper belongs to org
    camper_result = await db.execute(
        select(Camper)
        .where(Camper.id == camper_id)
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
    )
    if camper_result.scalar_one_or_none() is None:
        raise ValueError("Camper not found")

    # Verify contact belongs to org
    contact_result = await db.execute(
        select(Contact)
        .where(Contact.id == contact_id)
        .where(Contact.organization_id == organization_id)
        .where(Contact.deleted_at.is_(None))
    )
    if contact_result.scalar_one_or_none() is None:
        raise ValueError("Contact not found")

    # Check if link already exists
    existing = await db.execute(
        select(CamperContact)
        .where(CamperContact.camper_id == camper_id)
        .where(CamperContact.contact_id == contact_id)
    )
    cc = existing.scalar_one_or_none()

    if cc:
        # Update existing link
        cc.relationship_type = relationship_type
        cc.is_primary = is_primary
        cc.is_emergency = is_emergency
        cc.is_authorized_pickup = is_authorized_pickup
    else:
        cc = CamperContact(
            id=uuid.uuid4(),
            camper_id=camper_id,
            contact_id=contact_id,
            relationship_type=relationship_type,
            is_primary=is_primary,
            is_emergency=is_emergency,
            is_authorized_pickup=is_authorized_pickup,
        )
        db.add(cc)

    await db.commit()
    return {"status": "linked"}


async def unlink_contact(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
    contact_id: uuid.UUID,
) -> bool:
    """Remove a contact link from a camper."""
    # Verify camper belongs to org
    camper_result = await db.execute(
        select(Camper)
        .where(Camper.id == camper_id)
        .where(Camper.organization_id == organization_id)
    )
    if camper_result.scalar_one_or_none() is None:
        return False

    result = await db.execute(
        select(CamperContact)
        .where(CamperContact.camper_id == camper_id)
        .where(CamperContact.contact_id == contact_id)
    )
    cc = result.scalar_one_or_none()
    if cc is None:
        return False

    await db.delete(cc)
    await db.commit()
    return True


def _calculate_age(dob: Optional[date]) -> Optional[int]:
    """Calculate age from date of birth."""
    if dob is None:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _camper_to_dict(camper: Camper) -> Dict[str, Any]:
    """Convert a Camper model to a response dict."""
    contacts = []
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
                    "relationship_type": cc.relationship_type,
                    "is_primary": cc.is_primary,
                    "is_emergency": cc.is_emergency,
                    "is_authorized_pickup": cc.is_authorized_pickup,
                })

    active_registrations = [
        r for r in (camper.registrations or [])
        if r.status != "cancelled" and not r.deleted_at
    ]

    return {
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
        "contacts": contacts,
        "registration_count": len(active_registrations),
        "created_at": camper.created_at,
    }

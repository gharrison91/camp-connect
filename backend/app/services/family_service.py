"""
Camp Connect - Family Service
Business logic for family (household) management.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.family import Family
from app.models.camper import Camper
from app.models.contact import Contact


async def list_families(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List families for an organization with optional search."""
    query = (
        select(Family)
        .options(selectinload(Family.campers), selectinload(Family.contacts))
        .where(Family.organization_id == organization_id)
        .where(Family.deleted_at.is_(None))
    )

    if search:
        query = query.where(Family.family_name.ilike(f"%{search}%"))

    query = query.order_by(Family.family_name)
    result = await db.execute(query)
    families = result.scalars().all()

    return [_family_to_list_item(f) for f in families]


async def get_family(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    family_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single family by ID with all members."""
    result = await db.execute(
        select(Family)
        .options(selectinload(Family.campers), selectinload(Family.contacts))
        .where(Family.id == family_id)
        .where(Family.organization_id == organization_id)
        .where(Family.deleted_at.is_(None))
    )
    family = result.scalar_one_or_none()
    if family is None:
        return None
    return _family_to_dict(family)


async def create_family(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new family."""
    family = Family(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(family)
    await db.commit()
    await db.refresh(family, ["campers", "contacts"])
    return _family_to_dict(family)


async def update_family(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    family_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing family."""
    result = await db.execute(
        select(Family)
        .options(selectinload(Family.campers), selectinload(Family.contacts))
        .where(Family.id == family_id)
        .where(Family.organization_id == organization_id)
        .where(Family.deleted_at.is_(None))
    )
    family = result.scalar_one_or_none()
    if family is None:
        return None

    for key, value in data.items():
        setattr(family, key, value)

    await db.commit()
    await db.refresh(family, ["campers", "contacts"])
    return _family_to_dict(family)


async def delete_family(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    family_id: uuid.UUID,
) -> bool:
    """Soft-delete a family."""
    result = await db.execute(
        select(Family)
        .where(Family.id == family_id)
        .where(Family.organization_id == organization_id)
        .where(Family.deleted_at.is_(None))
    )
    family = result.scalar_one_or_none()
    if family is None:
        return False

    family.is_deleted = True
    family.deleted_at = datetime.utcnow()
    await db.commit()
    return True


async def add_camper_to_family(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    family_id: uuid.UUID,
    camper_id: uuid.UUID,
) -> bool:
    """Add a camper to a family by setting their family_id."""
    # Verify family belongs to org
    family_result = await db.execute(
        select(Family)
        .where(Family.id == family_id)
        .where(Family.organization_id == organization_id)
        .where(Family.deleted_at.is_(None))
    )
    if family_result.scalar_one_or_none() is None:
        return False

    # Verify camper belongs to org
    camper_result = await db.execute(
        select(Camper)
        .where(Camper.id == camper_id)
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
    )
    camper = camper_result.scalar_one_or_none()
    if camper is None:
        return False

    camper.family_id = family_id
    await db.commit()
    return True


async def add_contact_to_family(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    family_id: uuid.UUID,
    contact_id: uuid.UUID,
) -> bool:
    """Add a contact to a family by setting their family_id."""
    # Verify family belongs to org
    family_result = await db.execute(
        select(Family)
        .where(Family.id == family_id)
        .where(Family.organization_id == organization_id)
        .where(Family.deleted_at.is_(None))
    )
    if family_result.scalar_one_or_none() is None:
        return False

    # Verify contact belongs to org
    contact_result = await db.execute(
        select(Contact)
        .where(Contact.id == contact_id)
        .where(Contact.organization_id == organization_id)
        .where(Contact.deleted_at.is_(None))
    )
    contact = contact_result.scalar_one_or_none()
    if contact is None:
        return False

    contact.family_id = family_id
    await db.commit()
    return True


async def remove_member_from_family(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    family_id: uuid.UUID,
    member_id: uuid.UUID,
    member_type: str,
) -> bool:
    """Remove a camper or contact from a family (sets family_id = None)."""
    if member_type == "camper":
        result = await db.execute(
            select(Camper)
            .where(Camper.id == member_id)
            .where(Camper.organization_id == organization_id)
            .where(Camper.family_id == family_id)
            .where(Camper.deleted_at.is_(None))
        )
        member = result.scalar_one_or_none()
    elif member_type == "contact":
        result = await db.execute(
            select(Contact)
            .where(Contact.id == member_id)
            .where(Contact.organization_id == organization_id)
            .where(Contact.family_id == family_id)
            .where(Contact.deleted_at.is_(None))
        )
        member = result.scalar_one_or_none()
    else:
        return False

    if member is None:
        return False

    member.family_id = None
    await db.commit()
    return True


def _calculate_age(dob: Optional[date]) -> Optional[int]:
    """Calculate age from date of birth."""
    if dob is None:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _family_to_list_item(family: Family) -> Dict[str, Any]:
    """Convert a Family model to a list-item response dict."""
    # Only count non-deleted members
    active_campers = [c for c in family.campers if c.deleted_at is None]
    active_contacts = [c for c in family.contacts if c.deleted_at is None]
    return {
        "id": family.id,
        "family_name": family.family_name,
        "camper_count": len(active_campers),
        "contact_count": len(active_contacts),
        "created_at": family.created_at,
    }


def _family_to_dict(family: Family) -> Dict[str, Any]:
    """Convert a Family model to a full response dict with members."""
    active_campers = [c for c in family.campers if c.deleted_at is None]
    active_contacts = [c for c in family.contacts if c.deleted_at is None]

    camper_dicts = [
        {
            "id": c.id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "age": _calculate_age(c.date_of_birth),
            "gender": c.gender,
        }
        for c in active_campers
    ]

    contact_dicts = [
        {
            "id": c.id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "phone": c.phone,
            "relationship_type": c.relationship_type,
            "user_id": c.user_id,
        }
        for c in active_contacts
    ]

    return {
        "id": family.id,
        "family_name": family.family_name,
        "campers": camper_dicts,
        "contacts": contact_dicts,
        "camper_count": len(active_campers),
        "contact_count": len(active_contacts),
        "created_at": family.created_at,
    }

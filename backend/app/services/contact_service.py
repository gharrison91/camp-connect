"""
Camp Connect - Contact Service
Business logic for parent/guardian contact management.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.contact import Contact
from app.models.camper_contact import CamperContact


async def list_contacts(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List contacts for an organization with optional search."""
    query = (
        select(Contact)
        .options(selectinload(Contact.camper_contacts))
        .where(Contact.organization_id == organization_id)
        .where(Contact.deleted_at.is_(None))
    )

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Contact.first_name.ilike(search_pattern))
            | (Contact.last_name.ilike(search_pattern))
            | (Contact.email.ilike(search_pattern))
        )

    query = query.order_by(Contact.last_name, Contact.first_name)
    result = await db.execute(query)
    contacts = result.scalars().all()

    return [_contact_to_dict(c) for c in contacts]


async def get_contact(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    contact_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single contact by ID."""
    result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.camper_contacts))
        .where(Contact.id == contact_id)
        .where(Contact.organization_id == organization_id)
        .where(Contact.deleted_at.is_(None))
    )
    contact = result.scalar_one_or_none()
    if contact is None:
        return None
    return _contact_to_dict(contact)


async def create_contact(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new contact."""
    contact = Contact(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact, ["camper_contacts"])
    return _contact_to_dict(contact)


async def update_contact(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    contact_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update a contact."""
    result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.camper_contacts))
        .where(Contact.id == contact_id)
        .where(Contact.organization_id == organization_id)
        .where(Contact.deleted_at.is_(None))
    )
    contact = result.scalar_one_or_none()
    if contact is None:
        return None

    for key, value in data.items():
        setattr(contact, key, value)

    await db.commit()
    await db.refresh(contact, ["camper_contacts"])
    return _contact_to_dict(contact)


async def delete_contact(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    contact_id: uuid.UUID,
) -> bool:
    """Soft-delete a contact."""
    result = await db.execute(
        select(Contact)
        .where(Contact.id == contact_id)
        .where(Contact.organization_id == organization_id)
        .where(Contact.deleted_at.is_(None))
    )
    contact = result.scalar_one_or_none()
    if contact is None:
        return False

    contact.is_deleted = True
    contact.deleted_at = datetime.utcnow()
    await db.commit()
    return True


def _contact_to_dict(contact: Contact) -> Dict[str, Any]:
    """Convert a Contact model to a response dict."""
    return {
        "id": contact.id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "email": contact.email,
        "phone": contact.phone,
        "address": contact.address,
        "city": contact.city,
        "state": contact.state,
        "zip_code": contact.zip_code,
        "relationship_type": contact.relationship_type,
        "notification_preferences": contact.notification_preferences,
        "account_status": contact.account_status,
        "communication_preference": contact.communication_preference,
        "camper_count": len(contact.camper_contacts) if contact.camper_contacts else 0,
        "created_at": contact.created_at,
    }

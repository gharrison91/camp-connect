"""
Camp Connect - Communications API Endpoints
Send messages (SMS/email), manage templates, and view message history.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from sqlalchemy import select

from app.models.camper import Camper
from app.models.camper_contact import CamperContact
from app.models.contact import Contact
from app.models.registration import Registration
from app.schemas.message import (
    EventRecipientResponse,
    MessageBulkSend,
    MessageResponse,
    MessageSend,
    MessageTemplateCreate,
    MessageTemplateResponse,
    MessageTemplateUpdate,
)
from app.services import message_service

router = APIRouter(prefix="/communications", tags=["Communications"])


# ---------------------------------------------------------------------------
# Send messages
# ---------------------------------------------------------------------------


@router.post(
    "/send",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    body: MessageSend,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.messages.send")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Send a single SMS or email message."""
    return await message_service.send_message(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.post(
    "/send-bulk",
    response_model=List[MessageResponse],
    status_code=status.HTTP_201_CREATED,
)
async def send_bulk_messages(
    body: MessageBulkSend,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.messages.send")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to multiple contacts (looked up by contact ID)."""
    return await message_service.send_bulk_messages(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Event recipients
# ---------------------------------------------------------------------------


@router.get(
    "/event-recipients/{event_id}",
    response_model=List[EventRecipientResponse],
)
async def get_event_recipients(
    event_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.messages.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Return all contacts linked to campers registered for a given event.
    Contacts are de-duplicated (a contact linked to multiple registered
    campers appears only once).
    """
    org_id = current_user["organization_id"]

    # Join registrations -> camper_contacts -> contacts
    query = (
        select(
            Contact.id.label("contact_id"),
            Contact.first_name,
            Contact.last_name,
            Contact.email,
            Contact.phone,
        )
        .select_from(Registration)
        .join(CamperContact, CamperContact.camper_id == Registration.camper_id)
        .join(Contact, Contact.id == CamperContact.contact_id)
        .where(Registration.event_id == event_id)
        .where(Registration.organization_id == org_id)
        .where(Registration.status.in_(["pending", "confirmed"]))
        .where(Contact.deleted_at.is_(None))
        .distinct(Contact.id)
        .order_by(Contact.id, Contact.last_name, Contact.first_name)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "contact_id": row.contact_id,
            "first_name": row.first_name,
            "last_name": row.last_name,
            "email": row.email,
            "phone": row.phone,
        }
        for row in rows
    ]


# ---------------------------------------------------------------------------
# Message history
# ---------------------------------------------------------------------------


@router.get(
    "/messages",
    response_model=List[MessageResponse],
)
async def list_messages(
    channel: Optional[str] = Query(
        default=None, description="Filter by channel: sms or email"
    ),
    message_status: Optional[str] = Query(
        default=None,
        alias="status",
        description="Filter by status: queued, sent, delivered, failed, bounced",
    ),
    search: Optional[str] = Query(
        default=None, description="Search in to_address, body, or subject"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.messages.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List message history with optional filters."""
    return await message_service.list_messages(
        db,
        organization_id=current_user["organization_id"],
        channel=channel,
        status=message_status,
        search=search,
    )


@router.get(
    "/messages/{message_id}",
    response_model=MessageResponse,
)
async def get_message(
    message_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.messages.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single message by ID."""
    message = await message_service.get_message(
        db,
        organization_id=current_user["organization_id"],
        message_id=message_id,
    )
    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    return message


# ---------------------------------------------------------------------------
# Message templates
# ---------------------------------------------------------------------------


@router.get(
    "/templates",
    response_model=List[MessageTemplateResponse],
)
async def list_templates(
    channel: Optional[str] = Query(
        default=None, description="Filter by channel: sms, email, or both"
    ),
    category: Optional[str] = Query(
        default=None,
        description="Filter by category: registration, waitlist, reminder, emergency, general",
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.messages.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List message templates with optional filters."""
    return await message_service.list_templates(
        db,
        organization_id=current_user["organization_id"],
        channel=channel,
        category=category,
    )


@router.post(
    "/templates",
    response_model=MessageTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_template(
    body: MessageTemplateCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.templates.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new message template."""
    return await message_service.create_template(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/templates/{template_id}",
    response_model=MessageTemplateResponse,
)
async def update_template(
    template_id: uuid.UUID,
    body: MessageTemplateUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.templates.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a message template."""
    try:
        result = await message_service.update_template(
            db,
            organization_id=current_user["organization_id"],
            template_id=template_id,
            data=body.model_dump(exclude_unset=True),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    return result


@router.delete(
    "/templates/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_template(
    template_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("comms.templates.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) a message template. System templates cannot be deleted."""
    try:
        deleted = await message_service.delete_template(
            db,
            organization_id=current_user["organization_id"],
            template_id=template_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

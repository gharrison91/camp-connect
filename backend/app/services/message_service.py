"""
Camp Connect - Message Service
Orchestrates sending messages (SMS/email), logging, templates, and bulk operations.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.contact import Contact
from app.models.message import Message
from app.models.message_template import MessageTemplate
from app.services import sendgrid_service, twilio_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Default system templates (seeded per organization on first use)
# ---------------------------------------------------------------------------

DEFAULT_TEMPLATES: List[Dict[str, Any]] = [
    {
        "name": "Registration Confirmation",
        "channel": "both",
        "category": "registration",
        "subject": "Registration Confirmed - {{event_name}}",
        "body": (
            "Hi {{parent_name}}, {{camper_name}} has been registered for "
            "{{event_name}} ({{event_dates}}). We look forward to seeing them!"
        ),
        "html_body": None,
        "variables": ["parent_name", "camper_name", "event_name", "event_dates"],
        "is_system": True,
    },
    {
        "name": "Waitlist Notification",
        "channel": "both",
        "category": "waitlist",
        "subject": "Spot Available - {{event_name}}",
        "body": (
            "Hi {{parent_name}}, a spot has opened up for {{camper_name}} in "
            "{{event_name}}. Please confirm within 48 hours."
        ),
        "html_body": None,
        "variables": ["parent_name", "camper_name", "event_name"],
        "is_system": True,
    },
    {
        "name": "Event Reminder",
        "channel": "both",
        "category": "reminder",
        "subject": "Reminder: {{event_name}} starts {{start_date}}",
        "body": (
            "Hi {{parent_name}}, just a friendly reminder that {{event_name}} "
            "starts on {{start_date}}. Don't forget to complete any required "
            "health forms!"
        ),
        "html_body": None,
        "variables": ["parent_name", "event_name", "start_date"],
        "is_system": True,
    },
    {
        "name": "Emergency Alert",
        "channel": "sms",
        "category": "emergency",
        "subject": None,
        "body": (
            "CAMP ALERT: {{message}}. Please contact us at {{contact_number}} "
            "for more information."
        ),
        "html_body": None,
        "variables": ["message", "contact_number"],
        "is_system": True,
    },
]


# ---------------------------------------------------------------------------
# Template rendering
# ---------------------------------------------------------------------------


async def render_template(template_body: str, variables: Dict[str, Any]) -> str:
    """
    Replace ``{{variable}}`` placeholders in *template_body* with the
    corresponding values from *variables*.
    """
    result = template_body
    for key, value in variables.items():
        result = result.replace("{{" + key + "}}", str(value))
    return result


# ---------------------------------------------------------------------------
# Sending messages
# ---------------------------------------------------------------------------


async def send_message(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Send a single message (SMS or email) and persist a log record.

    Steps:
        1. Create a Message record with status='queued'.
        2. Call the appropriate provider (Twilio / SendGrid).
        3. Update the record with the provider response (status, external_id).
        4. Return the message dict.
    """
    channel = data["channel"]
    to_address = data["to_address"]
    body = data["body"]
    subject = data.get("subject")
    html_body = data.get("html_body")

    # Determine from address based on channel
    from_address = (
        settings.twilio_from_number
        if channel == "sms"
        else settings.sendgrid_from_email
    )

    # 1. Create the message record
    message = Message(
        id=uuid.uuid4(),
        organization_id=organization_id,
        channel=channel,
        direction="outbound",
        status="queued",
        from_address=from_address,
        to_address=to_address,
        subject=subject,
        body=body,
        html_body=html_body,
        template_id=data.get("template_id"),
        recipient_type=data.get("recipient_type"),
        recipient_id=data.get("recipient_id"),
        related_entity_type=data.get("related_entity_type"),
        related_entity_id=data.get("related_entity_id"),
    )
    db.add(message)
    await db.flush()  # Persist so we have the ID before sending

    # 2. Send via provider
    now = datetime.now(timezone.utc)
    try:
        if channel == "sms":
            result = await twilio_service.send_sms(to_number=to_address, body=body)
            message.external_id = result.get("sid")
            message.status = result.get("status", "sent")
        elif channel == "email":
            if not subject:
                raise ValueError("Subject is required for email messages")
            result = await sendgrid_service.send_email(
                to_email=to_address,
                subject=subject,
                body=body,
                html_body=html_body,
            )
            message.external_id = result.get("message_id")
            status_code = result.get("status_code", 500)
            message.status = "sent" if 200 <= status_code < 300 else "failed"
        else:
            raise ValueError(f"Unsupported channel: {channel}")

        message.sent_at = now

    except Exception as exc:
        message.status = "failed"
        message.error_message = str(exc)
        logger.error(
            "Failed to send %s to %s (org=%s): %s",
            channel,
            to_address,
            organization_id,
            exc,
        )

    # 3. Commit
    await db.commit()
    await db.refresh(message)

    return _message_to_dict(message)


async def send_bulk_messages(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Send a message to multiple contacts.

    Looks up each contact by ID to get their email / phone,
    then delegates to ``send_message`` for each recipient.
    """
    channel = data["channel"]
    recipient_ids: List[uuid.UUID] = data["recipient_ids"]

    # Fetch contacts
    result = await db.execute(
        select(Contact)
        .where(Contact.id.in_(recipient_ids))
        .where(Contact.organization_id == organization_id)
        .where(Contact.deleted_at.is_(None))
    )
    contacts = result.scalars().all()

    results: List[Dict[str, Any]] = []

    for contact in contacts:
        # Determine to_address based on channel
        if channel == "sms":
            to_address = contact.phone
        else:
            to_address = contact.email

        if not to_address:
            logger.warning(
                "Contact %s has no %s address, skipping",
                contact.id,
                "phone" if channel == "sms" else "email",
            )
            continue

        single_data = {
            **data,
            "to_address": to_address,
            "recipient_type": "contact",
            "recipient_id": contact.id,
        }
        # Remove recipient_ids key (not used in single send)
        single_data.pop("recipient_ids", None)

        msg_result = await send_message(
            db,
            organization_id=organization_id,
            data=single_data,
        )
        results.append(msg_result)

    return results


# ---------------------------------------------------------------------------
# Message queries
# ---------------------------------------------------------------------------


async def list_messages(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    channel: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List message history for an organization with optional filters."""
    query = (
        select(Message)
        .where(Message.organization_id == organization_id)
        .where(Message.deleted_at.is_(None))
    )

    if channel:
        query = query.where(Message.channel == channel)
    if status:
        query = query.where(Message.status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Message.to_address.ilike(search_pattern))
            | (Message.body.ilike(search_pattern))
            | (Message.subject.ilike(search_pattern))
        )

    query = query.order_by(Message.created_at.desc())
    result = await db.execute(query)
    messages = result.scalars().all()

    return [_message_to_dict(m) for m in messages]


async def get_message(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    message_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single message by ID."""
    result = await db.execute(
        select(Message)
        .where(Message.id == message_id)
        .where(Message.organization_id == organization_id)
        .where(Message.deleted_at.is_(None))
    )
    message = result.scalar_one_or_none()
    if message is None:
        return None
    return _message_to_dict(message)


# ---------------------------------------------------------------------------
# Template CRUD
# ---------------------------------------------------------------------------


async def list_templates(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    channel: Optional[str] = None,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List message templates for an organization with optional filters."""
    query = (
        select(MessageTemplate)
        .where(MessageTemplate.organization_id == organization_id)
        .where(MessageTemplate.deleted_at.is_(None))
    )

    if channel:
        query = query.where(MessageTemplate.channel == channel)
    if category:
        query = query.where(MessageTemplate.category == category)

    query = query.order_by(MessageTemplate.name)
    result = await db.execute(query)
    templates = result.scalars().all()

    return [_template_to_dict(t) for t in templates]


async def create_template(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new message template."""
    template = MessageTemplate(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return _template_to_dict(template)


async def update_template(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    template_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing message template."""
    result = await db.execute(
        select(MessageTemplate)
        .where(MessageTemplate.id == template_id)
        .where(MessageTemplate.organization_id == organization_id)
        .where(MessageTemplate.deleted_at.is_(None))
    )
    template = result.scalar_one_or_none()
    if template is None:
        return None

    # System templates: only allow toggling is_active
    if template.is_system:
        if "is_active" in data:
            template.is_active = data["is_active"]
    else:
        for key, value in data.items():
            setattr(template, key, value)

    await db.commit()
    await db.refresh(template)
    return _template_to_dict(template)


async def delete_template(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    template_id: uuid.UUID,
) -> bool:
    """Soft-delete a message template. System templates cannot be deleted."""
    result = await db.execute(
        select(MessageTemplate)
        .where(MessageTemplate.id == template_id)
        .where(MessageTemplate.organization_id == organization_id)
        .where(MessageTemplate.deleted_at.is_(None))
    )
    template = result.scalar_one_or_none()
    if template is None:
        return False

    if template.is_system:
        raise ValueError("System templates cannot be deleted")

    template.is_deleted = True
    template.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return True


async def seed_default_templates(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """
    Seed default system templates for a new organization.
    Skips templates that already exist (matched by name + organization).
    """
    created: List[Dict[str, Any]] = []

    for tmpl_data in DEFAULT_TEMPLATES:
        # Check if already exists
        result = await db.execute(
            select(MessageTemplate)
            .where(MessageTemplate.organization_id == organization_id)
            .where(MessageTemplate.name == tmpl_data["name"])
            .where(MessageTemplate.deleted_at.is_(None))
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            continue

        template = MessageTemplate(
            id=uuid.uuid4(),
            organization_id=organization_id,
            name=tmpl_data["name"],
            channel=tmpl_data["channel"],
            category=tmpl_data["category"],
            subject=tmpl_data.get("subject"),
            body=tmpl_data["body"],
            html_body=tmpl_data.get("html_body"),
            variables=tmpl_data.get("variables", []),
            is_system=tmpl_data.get("is_system", False),
            is_active=True,
        )
        db.add(template)
        created.append(_template_to_dict(template))

    if created:
        await db.commit()
        logger.info(
            "Seeded %d default templates for org %s",
            len(created),
            organization_id,
        )

    return created


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _message_to_dict(message: Message) -> Dict[str, Any]:
    """Convert a Message model instance to a response dict."""
    return {
        "id": message.id,
        "channel": message.channel,
        "direction": message.direction,
        "status": message.status,
        "from_address": message.from_address,
        "to_address": message.to_address,
        "subject": message.subject,
        "body": message.body,
        "template_id": message.template_id,
        "recipient_type": message.recipient_type,
        "related_entity_type": message.related_entity_type,
        "external_id": message.external_id,
        "error_message": message.error_message,
        "sent_at": message.sent_at,
        "delivered_at": message.delivered_at,
        "created_at": message.created_at,
    }


def _template_to_dict(template: MessageTemplate) -> Dict[str, Any]:
    """Convert a MessageTemplate model instance to a response dict."""
    return {
        "id": template.id,
        "name": template.name,
        "channel": template.channel,
        "subject": template.subject,
        "body": template.body,
        "html_body": template.html_body,
        "category": template.category,
        "variables": template.variables or [],
        "is_system": template.is_system,
        "is_active": template.is_active,
        "created_at": template.created_at,
    }

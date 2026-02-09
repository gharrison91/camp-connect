"""
Camp Connect - Notification Service
Manages automated notification configurations and triggers delivery
via email (SendGrid) or SMS (Twilio) based on system events.
"""

from __future__ import annotations

import logging
import uuid
from string import Template
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message_template import MessageTemplate
from app.models.notification_config import NotificationConfig

logger = logging.getLogger(__name__)

# Supported trigger types
TRIGGER_TYPES = (
    "registration_confirmed",
    "health_form_reminder",
    "payment_received",
    "waitlist_promoted",
    "event_reminder",
)


# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------


async def list_notification_configs(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List all notification configurations for an organization."""
    result = await db.execute(
        select(NotificationConfig)
        .where(NotificationConfig.organization_id == organization_id)
        .order_by(NotificationConfig.trigger_type)
    )
    configs = result.scalars().all()
    return [_config_to_dict(c) for c in configs]


async def get_notification_config(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    config_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single notification configuration by ID."""
    result = await db.execute(
        select(NotificationConfig)
        .where(NotificationConfig.id == config_id)
        .where(NotificationConfig.organization_id == organization_id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        return None
    return _config_to_dict(config)


async def create_notification_config(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new notification configuration."""
    config = NotificationConfig(
        id=uuid.uuid4(),
        organization_id=organization_id,
        trigger_type=data["trigger_type"],
        channel=data.get("channel", "email"),
        is_active=data.get("is_active", True),
        template_id=data.get("template_id"),
        config=data.get("config"),
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return _config_to_dict(config)


async def update_notification_config(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    config_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing notification configuration."""
    result = await db.execute(
        select(NotificationConfig)
        .where(NotificationConfig.id == config_id)
        .where(NotificationConfig.organization_id == organization_id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        return None

    for key, value in data.items():
        setattr(config, key, value)

    await db.commit()
    await db.refresh(config)
    return _config_to_dict(config)


async def delete_notification_config(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    config_id: uuid.UUID,
) -> bool:
    """Hard-delete a notification configuration (no soft-delete mixin)."""
    result = await db.execute(
        select(NotificationConfig)
        .where(NotificationConfig.id == config_id)
        .where(NotificationConfig.organization_id == organization_id)
    )
    config = result.scalar_one_or_none()
    if config is None:
        return False

    await db.delete(config)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Trigger engine
# ---------------------------------------------------------------------------


async def trigger_notification(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    trigger_type: str,
    context: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Core notification engine.

    1. Look up active NotificationConfig(s) for this trigger_type + organization.
    2. If found and has template_id, load the MessageTemplate to get subject/body.
    3. Substitute variables in template using the context dict.
    4. Based on channel, call SendGrid (email) or Twilio (SMS).
    5. Log results.

    Context dict example::

        {
            "camper_name": "...",
            "event_name": "...",
            "parent_email": "...",
            "parent_phone": "...",
            "amount": "...",
        }

    Returns a summary dict with results for each config that was processed.
    """
    # 1. Fetch active configs for this trigger type + org
    result = await db.execute(
        select(NotificationConfig)
        .where(NotificationConfig.organization_id == organization_id)
        .where(NotificationConfig.trigger_type == trigger_type)
        .where(NotificationConfig.is_active.is_(True))
    )
    configs = result.scalars().all()

    if not configs:
        logger.info(
            "No active notification config for trigger_type=%s org=%s",
            trigger_type,
            organization_id,
        )
        return {"triggered": False, "reason": "no_active_config", "results": []}

    results: List[Dict[str, Any]] = []

    for cfg in configs:
        subject: Optional[str] = None
        body: Optional[str] = None
        html_body: Optional[str] = None

        # 2. Load template if configured
        if cfg.template_id:
            tmpl_result = await db.execute(
                select(MessageTemplate)
                .where(MessageTemplate.id == cfg.template_id)
            )
            template = tmpl_result.scalar_one_or_none()
            if template:
                subject = template.subject
                body = template.body
                html_body = template.html_body
            else:
                logger.warning(
                    "Template %s not found for config %s, skipping",
                    cfg.template_id,
                    cfg.id,
                )
                results.append({
                    "config_id": cfg.id,
                    "status": "skipped",
                    "reason": "template_not_found",
                })
                continue

        if not body:
            logger.warning(
                "No template body for config %s (trigger=%s), skipping",
                cfg.id,
                trigger_type,
            )
            results.append({
                "config_id": cfg.id,
                "status": "skipped",
                "reason": "no_template_body",
            })
            continue

        # 3. Substitute variables using {{variable}} style (matching existing templates)
        body = _render(body, context)
        if subject:
            subject = _render(subject, context)
        if html_body:
            html_body = _render(html_body, context)

        # 4. Dispatch based on channel
        channel = cfg.channel
        send_results: List[Dict[str, Any]] = []

        if channel in ("email", "both"):
            email = context.get("parent_email") or context.get("email")
            if email and subject:
                send_results.append(
                    await _send_email(email, subject, body, html_body)
                )
            else:
                send_results.append({
                    "channel": "email",
                    "status": "skipped",
                    "reason": "missing_email_or_subject",
                })

        if channel in ("sms", "both"):
            phone = context.get("parent_phone") or context.get("phone")
            if phone:
                send_results.append(await _send_sms(phone, body))
            else:
                send_results.append({
                    "channel": "sms",
                    "status": "skipped",
                    "reason": "missing_phone",
                })

        # 5. Log
        logger.info(
            "Notification triggered: config=%s trigger=%s channel=%s results=%s",
            cfg.id,
            trigger_type,
            channel,
            send_results,
        )

        results.append({
            "config_id": cfg.id,
            "channel": channel,
            "status": "processed",
            "send_results": send_results,
        })

    return {"triggered": True, "results": results}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _render(template_body: str, variables: Dict[str, Any]) -> str:
    """Replace ``{{variable}}`` placeholders with values from variables dict."""
    result = template_body
    for key, value in variables.items():
        result = result.replace("{{" + key + "}}", str(value))
    return result


async def _send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
) -> Dict[str, Any]:
    """Send email via SendGrid, with lazy import and error handling."""
    try:
        from app.services import sendgrid_service

        result = await sendgrid_service.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
        )
        return {"channel": "email", "status": "sent", "detail": result}
    except Exception as exc:
        logger.error("Notification email send failed to %s: %s", to_email, exc)
        return {"channel": "email", "status": "failed", "error": str(exc)}


async def _send_sms(to_phone: str, body: str) -> Dict[str, Any]:
    """Send SMS via Twilio, with lazy import and error handling."""
    try:
        from app.services import twilio_service

        result = await twilio_service.send_sms(to_number=to_phone, body=body)
        return {"channel": "sms", "status": "sent", "detail": result}
    except Exception as exc:
        logger.error("Notification SMS send failed to %s: %s", to_phone, exc)
        return {"channel": "sms", "status": "failed", "error": str(exc)}


def _config_to_dict(config: NotificationConfig) -> Dict[str, Any]:
    """Convert a NotificationConfig model instance to a response dict."""
    return {
        "id": config.id,
        "organization_id": config.organization_id,
        "trigger_type": config.trigger_type,
        "channel": config.channel,
        "is_active": config.is_active,
        "template_id": config.template_id,
        "config": config.config,
        "created_at": config.created_at,
        "updated_at": config.updated_at,
    }

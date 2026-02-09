"""
Camp Connect - SendGrid Email Service
Sends emails via the SendGrid Web API.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Content, Email, Mail, To

from app.config import settings

logger = logging.getLogger(__name__)


def _get_client() -> SendGridAPIClient:
    """Create and return a SendGrid API client."""
    if not settings.sendgrid_api_key:
        raise ValueError(
            "SendGrid API key not configured. "
            "Set SENDGRID_API_KEY in your environment."
        )
    return SendGridAPIClient(settings.sendgrid_api_key)


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Send an email via SendGrid.

    Args:
        to_email: Recipient email address.
        subject: Email subject line.
        body: Plain-text email body.
        html_body: Optional HTML email body.

    Returns:
        Dict with "status_code" and "message_id".

    Raises:
        ValueError: If SendGrid API key is not configured.
        Exception: If the SendGrid API returns a non-2xx status.
    """
    message = Mail(
        from_email=Email(settings.sendgrid_from_email, settings.sendgrid_from_name),
        to_emails=To(to_email),
        subject=subject,
    )

    if html_body:
        message.content = [
            Content("text/plain", body),
            Content("text/html", html_body),
        ]
    else:
        message.content = [Content("text/plain", body)]

    sg = _get_client()

    try:
        response = sg.send(message)
        message_id = response.headers.get("X-Message-Id", "")

        logger.info(
            "Email sent successfully: to=%s, subject='%s', status=%s, message_id=%s",
            to_email,
            subject,
            response.status_code,
            message_id,
        )

        return {
            "status_code": response.status_code,
            "message_id": message_id,
        }

    except Exception as exc:
        logger.error(
            "SendGrid error sending email to %s: %s",
            to_email,
            str(exc),
        )
        raise

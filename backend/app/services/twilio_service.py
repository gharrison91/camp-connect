"""
Camp Connect - Twilio SMS Service
Sends SMS messages via the Twilio REST API.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from app.config import settings

logger = logging.getLogger(__name__)


def _get_client() -> Client:
    """Create and return a Twilio REST client."""
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise ValueError(
            "Twilio credentials not configured. "
            "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your environment."
        )
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


async def send_sms(to_number: str, body: str) -> Dict[str, Any]:
    """
    Send an SMS message via Twilio.

    Args:
        to_number: The recipient phone number in E.164 format (e.g. +15551234567).
        body: The message text to send.

    Returns:
        Dict with "sid" (Twilio message SID) and "status" (e.g. "queued").

    Raises:
        ValueError: If Twilio credentials or from-number are not configured.
        TwilioRestException: If the Twilio API returns an error.
    """
    if not settings.twilio_from_number:
        raise ValueError(
            "Twilio from-number not configured. "
            "Set TWILIO_FROM_NUMBER in your environment."
        )

    client = _get_client()

    try:
        message = client.messages.create(
            body=body,
            from_=settings.twilio_from_number,
            to=to_number,
        )
        logger.info(
            "SMS sent successfully: sid=%s, to=%s, status=%s",
            message.sid,
            to_number,
            message.status,
        )
        return {"sid": message.sid, "status": message.status}

    except TwilioRestException as exc:
        logger.error(
            "Twilio API error sending SMS to %s: %s (code=%s)",
            to_number,
            exc.msg,
            exc.code,
        )
        raise

"""
Camp Connect - Stripe Service
Stripe integration for checkout sessions, webhooks, and refunds.
Conditionally imports stripe so the app works without the SDK installed.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Conditional import — allows the app to run when stripe is not installed.
try:
    import stripe
except ImportError:
    stripe = None  # type: ignore[assignment]


def _ensure_stripe() -> None:
    """Raise if the stripe SDK is not available or not configured."""
    if stripe is None:
        raise RuntimeError(
            "The 'stripe' package is not installed. "
            "Install it with: pip install stripe"
        )
    if not settings.stripe_secret_key:
        raise ValueError(
            "Stripe secret key not configured. "
            "Set STRIPE_SECRET_KEY in your environment."
        )
    stripe.api_key = settings.stripe_secret_key


async def create_checkout_session(
    *,
    organization_id: Any,
    invoice_id: Any,
    line_items: List[Dict[str, Any]],
    success_url: str,
    cancel_url: str,
) -> Dict[str, Any]:
    """
    Create a Stripe Checkout Session.

    Args:
        organization_id: The tenant org ID (stored in metadata).
        invoice_id: The internal invoice ID (stored in metadata).
        line_items: List of dicts with {name, amount (cents), quantity}.
        success_url: URL to redirect after successful payment.
        cancel_url: URL to redirect if the user cancels.

    Returns:
        Dict with "session_id" and "checkout_url".
    """
    _ensure_stripe()

    stripe_line_items = [
        {
            "price_data": {
                "currency": "usd",
                "product_data": {"name": item["name"]},
                "unit_amount": item["amount"],
            },
            "quantity": item.get("quantity", 1),
        }
        for item in line_items
    ]

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=stripe_line_items,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "organization_id": str(organization_id),
            "invoice_id": str(invoice_id),
        },
    )

    logger.info(
        "Created Stripe Checkout session %s for invoice %s",
        session.id,
        invoice_id,
    )

    return {
        "session_id": session.id,
        "checkout_url": session.url,
    }


async def process_webhook(
    *,
    payload: bytes,
    signature: str,
) -> Dict[str, Any]:
    """
    Verify and process a Stripe webhook event.

    Handles:
        - checkout.session.completed
        - payment_intent.succeeded

    Args:
        payload: Raw request body bytes.
        signature: The Stripe-Signature header value.

    Returns:
        Dict with "event_type" and relevant data from the event.
    """
    _ensure_stripe()

    webhook_secret = settings.stripe_webhook_secret
    if not webhook_secret:
        raise ValueError(
            "Stripe webhook secret not configured. "
            "Set STRIPE_WEBHOOK_SECRET in your environment."
        )

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid Stripe webhook signature")

    event_type = event["type"]
    data_object = event["data"]["object"]

    logger.info("Processing Stripe webhook event: %s", event_type)

    result: Dict[str, Any] = {"event_type": event_type}

    if event_type == "checkout.session.completed":
        result["session_id"] = data_object.get("id")
        result["payment_intent_id"] = data_object.get("payment_intent")
        result["metadata"] = data_object.get("metadata", {})
        result["amount_total"] = data_object.get("amount_total")
        result["currency"] = data_object.get("currency")

    elif event_type == "payment_intent.succeeded":
        result["payment_intent_id"] = data_object.get("id")
        result["amount"] = data_object.get("amount")
        result["currency"] = data_object.get("currency")
        result["metadata"] = data_object.get("metadata", {})

    return result


async def create_refund(
    *,
    payment_intent_id: str,
    amount: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Create a full or partial refund for a payment.

    Args:
        payment_intent_id: The Stripe PaymentIntent ID to refund.
        amount: Amount in cents to refund. None = full refund.

    Returns:
        Dict with refund details.
    """
    _ensure_stripe()

    refund_params: Dict[str, Any] = {
        "payment_intent": payment_intent_id,
    }
    if amount is not None:
        refund_params["amount"] = amount

    refund = stripe.Refund.create(**refund_params)

    logger.info(
        "Created Stripe refund %s for payment_intent %s (amount=%s)",
        refund.id,
        payment_intent_id,
        amount or "full",
    )

    return {
        "refund_id": refund.id,
        "status": refund.status,
        "amount": refund.amount,
        "currency": refund.currency,
        "payment_intent_id": payment_intent_id,
    }

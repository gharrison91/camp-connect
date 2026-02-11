"""
Camp Connect - Store API Router
CRUD for store items, spending accounts, purchases, transaction history,
and e-commerce integration settings (Shopify / WooCommerce / Square).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.models.organization import Organization
from app.schemas.store import (
    StoreItemCreate,
    StoreItemUpdate,
    StoreItemResponse,
    SpendingAccountResponse,
    SpendingAccountUpdate,
    PurchaseRequest,
    StoreTransactionResponse,
)
from app.services import store_service

router = APIRouter(prefix="/store", tags=["Store"])


# -- Store Items ---------------------------------------------------------------

@router.get("/items", response_model=list[StoreItemResponse])
async def list_items(
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """List store items with optional filters."""
    return await store_service.list_items(
        db,
        organization_id=user["organization_id"],
        category=category,
        is_active=is_active,
    )


@router.get("/items/{item_id}", response_model=StoreItemResponse)
async def get_item(
    item_id: uuid.UUID,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single store item."""
    return await store_service.get_item(
        db,
        organization_id=user["organization_id"],
        item_id=item_id,
    )


@router.post("/items", response_model=StoreItemResponse, status_code=201)
async def create_item(
    body: StoreItemCreate,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new store item."""
    return await store_service.create_item(
        db,
        organization_id=user["organization_id"],
        data=body.model_dump(),
    )


@router.put("/items/{item_id}", response_model=StoreItemResponse)
async def update_item(
    item_id: uuid.UUID,
    body: StoreItemUpdate,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Update a store item."""
    return await store_service.update_item(
        db,
        organization_id=user["organization_id"],
        item_id=item_id,
        data=body.model_dump(exclude_unset=True),
    )


@router.delete("/items/{item_id}")
async def delete_item(
    item_id: uuid.UUID,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a store item (hard delete)."""
    return await store_service.delete_item(
        db,
        organization_id=user["organization_id"],
        item_id=item_id,
    )


# -- Spending Accounts ---------------------------------------------------------

@router.get("/accounts/{camper_id}", response_model=SpendingAccountResponse)
async def get_spending_account(
    camper_id: uuid.UUID,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get (or auto-create) a camper's spending account."""
    return await store_service.get_spending_account(
        db,
        organization_id=user["organization_id"],
        camper_id=camper_id,
    )


@router.put("/accounts/{camper_id}", response_model=SpendingAccountResponse)
async def update_spending_account(
    camper_id: uuid.UUID,
    body: SpendingAccountUpdate,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Update a camper's spending account (balance, daily limit)."""
    return await store_service.update_spending_account(
        db,
        organization_id=user["organization_id"],
        camper_id=camper_id,
        data=body.model_dump(exclude_unset=True),
    )


# -- Purchases -----------------------------------------------------------------

@router.post("/purchase", response_model=StoreTransactionResponse, status_code=201)
async def purchase_item(
    body: PurchaseRequest,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Purchase a store item for a camper. Validates stock, balance, and daily spending limit."""
    return await store_service.purchase_item(
        db,
        organization_id=user["organization_id"],
        camper_id=body.camper_id,
        item_id=body.item_id,
        quantity=body.quantity,
        recorded_by=user["id"],
    )


# -- Transactions --------------------------------------------------------------

@router.get("/transactions", response_model=list[StoreTransactionResponse])
async def list_transactions(
    camper_id: Optional[uuid.UUID] = Query(None),
    user: dict = Depends(require_permission("store.transactions.view")),
    db: AsyncSession = Depends(get_db),
):
    """List store transactions, optionally filtered by camper."""
    return await store_service.list_transactions(
        db,
        organization_id=user["organization_id"],
        camper_id=camper_id,
    )


# -- E-Commerce Integration Settings ------------------------------------------

class StoreIntegrationUpdate(BaseModel):
    """Request body for updating e-commerce integration settings."""
    provider: str = Field(..., pattern=r"^(none|shopify|woocommerce|square)$")
    api_key: str = ""
    api_secret: str = ""
    store_url: str = ""
    sync_enabled: bool = False


def _mask_key(key: str) -> str:
    """Mask an API key, showing only the last 4 characters."""
    if not key or len(key) <= 4:
        return "****" if key else ""
    return "*" * (len(key) - 4) + key[-4:]


def _get_integration_settings(org: Organization) -> Dict[str, Any]:
    """Extract e-commerce integration settings from org settings JSONB."""
    settings = org.settings or {}
    integration = settings.get("store_integration", {})
    return {
        "provider": integration.get("provider", "none"),
        "api_key": _mask_key(integration.get("api_key", "")),
        "api_secret": _mask_key(integration.get("api_secret", "")),
        "store_url": integration.get("store_url", ""),
        "sync_enabled": integration.get("sync_enabled", False),
        "last_sync": integration.get("last_sync"),
    }


@router.get("/integration")
async def get_store_integration(
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Get current e-commerce integration settings."""
    result = await db.execute(
        select(Organization).where(Organization.id == user["organization_id"])
    )
    org = result.scalar_one_or_none()
    if org is None:
        return {
            "provider": "none", "api_key": "", "api_secret": "",
            "store_url": "", "sync_enabled": False, "last_sync": None,
        }
    return _get_integration_settings(org)


@router.put("/integration")
async def update_store_integration(
    body: StoreIntegrationUpdate,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Save e-commerce integration settings."""
    result = await db.execute(
        select(Organization).where(Organization.id == user["organization_id"])
    )
    org = result.scalar_one()
    current_settings = dict(org.settings or {})
    existing_integration = current_settings.get("store_integration", {})

    # Only overwrite api_key / api_secret if the user sent a non-masked value
    new_api_key = body.api_key
    if new_api_key.startswith("*") or not new_api_key:
        new_api_key = existing_integration.get("api_key", "")
    new_api_secret = body.api_secret
    if new_api_secret.startswith("*") or not new_api_secret:
        new_api_secret = existing_integration.get("api_secret", "")

    current_settings["store_integration"] = {
        "provider": body.provider,
        "api_key": new_api_key,
        "api_secret": new_api_secret,
        "store_url": body.store_url,
        "sync_enabled": body.sync_enabled,
        "last_sync": existing_integration.get("last_sync"),
    }
    org.settings = current_settings
    await db.commit()
    await db.refresh(org)
    return _get_integration_settings(org)


@router.post("/integration/test")
async def test_store_connection(
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Test connection to the configured e-commerce platform. Returns mock response."""
    result = await db.execute(
        select(Organization).where(Organization.id == user["organization_id"])
    )
    org = result.scalar_one()
    settings = (org.settings or {}).get("store_integration", {})
    provider = settings.get("provider", "none")

    if provider == "none":
        return {
            "success": False,
            "message": "No e-commerce provider configured. Select a provider first.",
            "product_count": None,
        }

    api_key = settings.get("api_key", "")
    store_url = settings.get("store_url", "")
    if not api_key or not store_url:
        return {
            "success": False,
            "message": f"Missing credentials for {provider}. Provide an API key and store URL.",
            "product_count": None,
        }

    provider_names = {"shopify": "Shopify", "woocommerce": "WooCommerce", "square": "Square"}
    display_name = provider_names.get(provider, provider)
    return {
        "success": True,
        "message": f"Successfully connected to {display_name} at {store_url}.",
        "product_count": 42,
    }


@router.post("/integration/sync")
async def sync_store_products(
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Pull products from connected e-commerce platform into Camp Store. Returns mock response."""
    result = await db.execute(
        select(Organization).where(Organization.id == user["organization_id"])
    )
    org = result.scalar_one()
    current_settings = dict(org.settings or {})
    integration = current_settings.get("store_integration", {})
    provider = integration.get("provider", "none")

    if provider == "none":
        return {"synced": 0, "errors": 0, "message": "No e-commerce provider configured."}
    if not integration.get("api_key") or not integration.get("store_url"):
        return {"synced": 0, "errors": 0, "message": "Missing credentials. Configure API key and store URL first."}

    # Update last_sync timestamp
    integration["last_sync"] = datetime.now(timezone.utc).isoformat()
    current_settings["store_integration"] = integration
    org.settings = current_settings
    await db.commit()

    provider_names = {"shopify": "Shopify", "woocommerce": "WooCommerce", "square": "Square"}
    display_name = provider_names.get(provider, provider)
    return {"synced": 12, "errors": 0, "message": f"Successfully synced 12 products from {display_name}."}

"""
Camp Connect - Inventory Service
Business logic for inventory & equipment management.
Uses in-memory storage keyed by org_id (no DB model required).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# In-memory stores (per org)
# ---------------------------------------------------------------------------

_items: Dict[str, Dict[str, Any]] = {}       # item_id -> item dict
_checkouts: Dict[str, Dict[str, Any]] = {}   # checkout_id -> checkout dict


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Items CRUD
# ---------------------------------------------------------------------------

async def get_items(
    *,
    org_id: uuid.UUID,
    category: Optional[str] = None,
    search: Optional[str] = None,
    low_stock_only: bool = False,
) -> List[Dict[str, Any]]:
    """List inventory items with optional filters."""
    org = str(org_id)
    results = []
    for item in _items.values():
        if item["org_id"] != org:
            continue
        if category and item["category"] != category:
            continue
        if search and search.lower() not in item["name"].lower():
            continue
        if low_stock_only and item["quantity"] > item["min_quantity"]:
            continue
        results.append(dict(item))
    results.sort(key=lambda x: x["name"].lower())
    return results


async def get_item(
    *,
    org_id: uuid.UUID,
    item_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single inventory item."""
    item = _items.get(str(item_id))
    if item is None or item["org_id"] != str(org_id):
        return None
    return dict(item)


async def create_item(
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new inventory item."""
    item_id = str(uuid.uuid4())
    now = _now()
    item = {
        "id": item_id,
        "org_id": str(org_id),
        "name": data["name"],
        "category": data.get("category", "other"),
        "sku": data.get("sku"),
        "quantity": data.get("quantity", 0),
        "min_quantity": data.get("min_quantity", 0),
        "location": data.get("location"),
        "condition": data.get("condition", "good"),
        "unit_cost": data.get("unit_cost", 0.0),
        "total_value": data.get("quantity", 0) * data.get("unit_cost", 0.0),
        "notes": data.get("notes"),
        "last_checked": now.isoformat(),
        "created_at": now.isoformat(),
    }
    _items[item_id] = item
    return dict(item)


async def update_item(
    *,
    org_id: uuid.UUID,
    item_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing inventory item."""
    item = _items.get(str(item_id))
    if item is None or item["org_id"] != str(org_id):
        return None
    for key, value in data.items():
        if value is not None:
            item[key] = value
    item["total_value"] = item["quantity"] * item["unit_cost"]
    item["last_checked"] = _now().isoformat()
    return dict(item)


async def delete_item(
    *,
    org_id: uuid.UUID,
    item_id: uuid.UUID,
) -> bool:
    """Delete an inventory item."""
    item = _items.get(str(item_id))
    if item is None or item["org_id"] != str(org_id):
        return False
    del _items[str(item_id)]
    # Also remove related checkouts
    to_remove = [
        cid for cid, co in _checkouts.items() if co["item_id"] == str(item_id)
    ]
    for cid in to_remove:
        del _checkouts[cid]
    return True


# ---------------------------------------------------------------------------
# Checkout / Return
# ---------------------------------------------------------------------------

async def checkout_item(
    *,
    org_id: uuid.UUID,
    item_id: uuid.UUID,
    quantity: int,
    checked_out_by: str,
    checked_out_to: str,
    expected_return: Optional[datetime] = None,
) -> Optional[Dict[str, Any]]:
    """Check out quantity of an item. Decrements available stock."""
    item = _items.get(str(item_id))
    if item is None or item["org_id"] != str(org_id):
        return None
    if item["quantity"] < quantity:
        return None  # Not enough stock

    item["quantity"] -= quantity
    item["total_value"] = item["quantity"] * item["unit_cost"]

    checkout_id = str(uuid.uuid4())
    now = _now()
    checkout = {
        "id": checkout_id,
        "item_id": str(item_id),
        "item_name": item["name"],
        "checked_out_by": checked_out_by,
        "checked_out_to": checked_out_to,
        "quantity_out": quantity,
        "checkout_date": now.isoformat(),
        "expected_return": expected_return.isoformat() if expected_return else None,
        "actual_return": None,
        "status": "out",
        "org_id": str(org_id),
    }
    _checkouts[checkout_id] = checkout
    return dict(checkout)


async def return_item(
    *,
    org_id: uuid.UUID,
    checkout_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Return a checked-out item. Restores stock."""
    checkout = _checkouts.get(str(checkout_id))
    if checkout is None or checkout["org_id"] != str(org_id):
        return None
    if checkout["status"] == "returned":
        return None  # Already returned

    checkout["status"] = "returned"
    checkout["actual_return"] = _now().isoformat()

    # Restore stock
    item = _items.get(checkout["item_id"])
    if item:
        item["quantity"] += checkout["quantity_out"]
        item["total_value"] = item["quantity"] * item["unit_cost"]

    return dict(checkout)


async def get_checkouts(
    *,
    org_id: uuid.UUID,
    status: Optional[str] = None,
    item_id: Optional[uuid.UUID] = None,
) -> List[Dict[str, Any]]:
    """List checkout records with optional filters."""
    org = str(org_id)
    now = _now()
    results = []
    for co in _checkouts.values():
        if co["org_id"] != org:
            continue
        # Auto-mark overdue
        if co["status"] == "out" and co["expected_return"]:
            expected = datetime.fromisoformat(co["expected_return"])
            if expected.tzinfo is None:
                expected = expected.replace(tzinfo=timezone.utc)
            if now > expected:
                co["status"] = "overdue"
        if status and co["status"] != status:
            continue
        if item_id and co["item_id"] != str(item_id):
            continue
        results.append(dict(co))
    results.sort(key=lambda x: x["checkout_date"], reverse=True)
    return results


# ---------------------------------------------------------------------------
# Aggregations
# ---------------------------------------------------------------------------

async def get_low_stock_items(
    *,
    org_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Get items below their minimum quantity threshold."""
    return await get_items(org_id=org_id, low_stock_only=True)


async def get_inventory_stats(
    *,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Compute aggregate inventory statistics."""
    org = str(org_id)
    total_items = 0
    low_stock_count = 0
    total_value = 0.0

    for item in _items.values():
        if item["org_id"] != org:
            continue
        total_items += 1
        total_value += item["total_value"]
        if item["quantity"] <= item["min_quantity"]:
            low_stock_count += 1

    checked_out_count = sum(
        1 for co in _checkouts.values()
        if co["org_id"] == org and co["status"] in ("out", "overdue")
    )

    return {
        "total_items": total_items,
        "low_stock_count": low_stock_count,
        "checked_out_count": checked_out_count,
        "total_value": round(total_value, 2),
    }


async def bulk_update_quantities(
    *,
    org_id: uuid.UUID,
    items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Bulk update quantities for multiple items."""
    updated = []
    org = str(org_id)
    for entry in items:
        item = _items.get(str(entry["id"]))
        if item and item["org_id"] == org:
            item["quantity"] = entry["quantity"]
            item["total_value"] = item["quantity"] * item["unit_cost"]
            item["last_checked"] = _now().isoformat()
            updated.append(dict(item))
    return updated

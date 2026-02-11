"""
Camp Connect - Spending Account Service
Business logic for camper spending accounts and transactions.
Uses in-memory storage keyed by org_id (no DB migration required).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# In-memory stores (per org)
# ---------------------------------------------------------------------------

_accounts: Dict[str, Dict[str, Any]] = {}       # account_id -> account dict
_transactions: Dict[str, Dict[str, Any]] = {}   # transaction_id -> transaction dict


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return _now().isoformat()


# ---------------------------------------------------------------------------
# Accounts
# ---------------------------------------------------------------------------

async def get_accounts(
    org_id: uuid.UUID,
    search: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List all spending accounts for an organization."""
    org = str(org_id)
    results = []
    for acct in _accounts.values():
        if acct["org_id"] != org:
            continue
        if search and search.lower() not in acct["camper_name"].lower():
            continue
        if status == "active" and not acct["is_active"]:
            continue
        if status == "inactive" and acct["is_active"]:
            continue
        results.append(dict(acct))
    results.sort(key=lambda x: x["camper_name"].lower())
    return results


async def get_account(
    org_id: uuid.UUID,
    account_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single spending account."""
    acct = _accounts.get(str(account_id))
    if acct is None or acct["org_id"] != str(org_id):
        return None
    return dict(acct)


async def create_account(
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new spending account for a camper."""
    account_id = str(uuid.uuid4())
    now = _now_iso()
    account = {
        "id": account_id,
        "org_id": str(org_id),
        "camper_id": str(data["camper_id"]),
        "camper_name": data.get("camper_name", "Unknown Camper"),
        "balance": float(data.get("initial_balance", 0)),
        "daily_limit": float(data["daily_limit"]) if data.get("daily_limit") is not None else None,
        "is_active": True,
        "last_transaction_at": None,
        "created_at": now,
    }
    _accounts[account_id] = account

    # If initial balance > 0, create a deposit transaction
    if account["balance"] > 0:
        txn_id = str(uuid.uuid4())
        txn = {
            "id": txn_id,
            "org_id": str(org_id),
            "account_id": account_id,
            "camper_name": account["camper_name"],
            "amount": account["balance"],
            "type": "deposit",
            "description": "Initial deposit",
            "staff_name": data.get("staff_name", "System"),
            "created_at": now,
        }
        _transactions[txn_id] = txn
        account["last_transaction_at"] = now

    return dict(account)


async def add_transaction(
    org_id: uuid.UUID,
    account_id: uuid.UUID,
    data: Dict[str, Any],
    staff_name: str = "Staff",
) -> Dict[str, Any]:
    """Add a transaction to a spending account and update the balance."""
    acct = _accounts.get(str(account_id))
    if acct is None or acct["org_id"] != str(org_id):
        raise ValueError("Account not found")

    amount = float(data["amount"])
    txn_type = data["type"]

    # Calculate balance change
    if txn_type == "purchase":
        if acct["balance"] < amount:
            raise ValueError("Insufficient balance")
        acct["balance"] = round(acct["balance"] - amount, 2)
    elif txn_type in ("deposit", "refund"):
        acct["balance"] = round(acct["balance"] + amount, 2)
    elif txn_type == "adjustment":
        # Adjustment can be positive or negative — treat as add
        acct["balance"] = round(acct["balance"] + amount, 2)

    now = _now_iso()
    txn_id = str(uuid.uuid4())
    txn = {
        "id": txn_id,
        "org_id": str(org_id),
        "account_id": str(account_id),
        "camper_name": acct["camper_name"],
        "amount": amount,
        "type": txn_type,
        "description": data.get("description"),
        "staff_name": staff_name,
        "created_at": now,
    }
    _transactions[txn_id] = txn
    acct["last_transaction_at"] = now

    return txn


async def get_transactions(
    org_id: uuid.UUID,
    account_id: Optional[uuid.UUID] = None,
    page: int = 1,
    per_page: int = 50,
) -> Dict[str, Any]:
    """List transactions, optionally filtered by account."""
    org = str(org_id)
    results = []
    for txn in _transactions.values():
        if txn["org_id"] != org:
            continue
        if account_id and txn["account_id"] != str(account_id):
            continue
        results.append(dict(txn))
    results.sort(key=lambda x: x["created_at"], reverse=True)
    total = len(results)
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "items": results[start:end],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


async def get_summary(org_id: uuid.UUID) -> Dict[str, Any]:
    """Get summary stats for spending accounts."""
    org = str(org_id)
    accounts = [a for a in _accounts.values() if a["org_id"] == org]
    active = [a for a in accounts if a["is_active"]]
    total_balance = sum(a["balance"] for a in accounts)
    avg_balance = total_balance / len(accounts) if accounts else 0

    today = _now().date().isoformat()
    txn_today = sum(
        1 for t in _transactions.values()
        if t["org_id"] == org and t["created_at"][:10] == today
    )

    return {
        "total_accounts": len(accounts),
        "active_accounts": len(active),
        "total_balance": round(total_balance, 2),
        "transactions_today": txn_today,
        "average_balance": round(avg_balance, 2),
    }

"""
Camp Connect - Referral Service
Business logic for the referral tracking system.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table creation (idempotent)
# ---------------------------------------------------------------------------

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    referrer_name VARCHAR(255) NOT NULL,
    referrer_email VARCHAR(255),
    referrer_family_id UUID,
    referred_name VARCHAR(255) NOT NULL,
    referred_email VARCHAR(255),
    referred_phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    source VARCHAR(30) DEFAULT 'word_of_mouth',
    incentive_type VARCHAR(20) DEFAULT 'none',
    incentive_amount FLOAT,
    incentive_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    """Create the referrals table if it does not exist."""
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def list_referrals(
    db: AsyncSession,
    org_id: uuid.UUID,
    *,
    status: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List all referrals for an organization with optional filters."""
    await _ensure_table(db)

    q = "SELECT * FROM referrals WHERE org_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if status:
        q += " AND status = :status"
        params["status"] = status

    if source:
        q += " AND source = :source"
        params["source"] = source

    if search:
        q += " AND (LOWER(referrer_name) LIKE :search OR LOWER(referred_name) LIKE :search OR LOWER(referrer_email) LIKE :search OR LOWER(referred_email) LIKE :search)"
        params["search"] = f"%{search.lower()}%"

    q += " ORDER BY created_at DESC"
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_referral(
    db: AsyncSession,
    org_id: uuid.UUID,
    referral_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single referral by ID."""
    await _ensure_table(db)

    q = "SELECT * FROM referrals WHERE id = :id AND org_id = :org_id"
    result = await db.execute(text(q), {"id": str(referral_id), "org_id": str(org_id)})
    row = result.first()
    return dict(row._mapping) if row else None


async def create_referral(
    db: AsyncSession,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new referral."""
    await _ensure_table(db)

    referral_id = uuid.uuid4()
    q = text("""
        INSERT INTO referrals (
            id, org_id, referrer_name, referrer_email, referrer_family_id,
            referred_name, referred_email, referred_phone,
            status, source, incentive_type, incentive_amount, incentive_status, notes
        ) VALUES (
            :id, :org_id, :referrer_name, :referrer_email, :referrer_family_id,
            :referred_name, :referred_email, :referred_phone,
            :status, :source, :incentive_type, :incentive_amount, :incentive_status, :notes
        )
        RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(referral_id),
        "org_id": str(org_id),
        "referrer_name": data["referrer_name"],
        "referrer_email": data.get("referrer_email"),
        "referrer_family_id": str(data["referrer_family_id"]) if data.get("referrer_family_id") else None,
        "referred_name": data["referred_name"],
        "referred_email": data.get("referred_email"),
        "referred_phone": data.get("referred_phone"),
        "status": data.get("status", "pending"),
        "source": data.get("source", "word_of_mouth"),
        "incentive_type": data.get("incentive_type", "none"),
        "incentive_amount": data.get("incentive_amount"),
        "incentive_status": data.get("incentive_status", "pending"),
        "notes": data.get("notes"),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping)


async def update_referral(
    db: AsyncSession,
    org_id: uuid.UUID,
    referral_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing referral."""
    await _ensure_table(db)

    allowed_fields = [
        "referrer_name", "referrer_email", "referrer_family_id",
        "referred_name", "referred_email", "referred_phone",
        "status", "source", "incentive_type", "incentive_amount",
        "incentive_status", "notes",
    ]
    sets = []
    params: Dict[str, Any] = {"id": str(referral_id), "org_id": str(org_id)}

    for field in allowed_fields:
        if field in data and data[field] is not None:
            if field == "referrer_family_id":
                sets.append(f"{field} = :{field}")
                params[field] = str(data[field])
            else:
                sets.append(f"{field} = :{field}")
                params[field] = data[field]

    if not sets:
        return await get_referral(db, org_id, referral_id)

    sets.append("updated_at = NOW()")
    q = text(f"UPDATE referrals SET {', '.join(sets)} WHERE id = :id AND org_id = :org_id RETURNING *")
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


async def delete_referral(
    db: AsyncSession,
    org_id: uuid.UUID,
    referral_id: uuid.UUID,
) -> bool:
    """Delete a referral."""
    await _ensure_table(db)

    result = await db.execute(
        text("DELETE FROM referrals WHERE id = :id AND org_id = :org_id"),
        {"id": str(referral_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


async def get_stats(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Get referral statistics for an organization."""
    await _ensure_table(db)

    org_str = str(org_id)

    # Total referrals
    r1 = await db.execute(
        text("SELECT COUNT(*) FROM referrals WHERE org_id = :org_id"),
        {"org_id": org_str},
    )
    total = r1.scalar() or 0

    # Converted (registered or completed)
    r2 = await db.execute(
        text("SELECT COUNT(*) FROM referrals WHERE org_id = :org_id AND status IN ('registered', 'completed')"),
        {"org_id": org_str},
    )
    converted = r2.scalar() or 0

    # Conversion rate
    conversion_rate = round((converted / total * 100) if total > 0 else 0.0, 1)

    # Total incentives awarded or redeemed
    r3 = await db.execute(
        text("SELECT COALESCE(SUM(incentive_amount), 0) FROM referrals WHERE org_id = :org_id AND incentive_status IN ('awarded', 'redeemed') AND incentive_amount IS NOT NULL"),
        {"org_id": org_str},
    )
    total_incentives = float(r3.scalar() or 0)

    # By source
    r4 = await db.execute(
        text("SELECT source, COUNT(*) AS cnt FROM referrals WHERE org_id = :org_id GROUP BY source"),
        {"org_id": org_str},
    )
    by_source = {row._mapping["source"]: row._mapping["cnt"] for row in r4}

    # By status
    r5 = await db.execute(
        text("SELECT status, COUNT(*) AS cnt FROM referrals WHERE org_id = :org_id GROUP BY status"),
        {"org_id": org_str},
    )
    by_status = {row._mapping["status"]: row._mapping["cnt"] for row in r5}

    return {
        "total": total,
        "converted": converted,
        "conversion_rate": conversion_rate,
        "total_incentives": total_incentives,
        "by_source": by_source,
        "by_status": by_status,
    }

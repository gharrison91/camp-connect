"""
Camp Connect - Program Evaluation Service
Business logic for program evaluation management using raw SQL.
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
CREATE TABLE IF NOT EXISTS program_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    category VARCHAR(20) DEFAULT 'other',
    evaluator_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    strengths TEXT,
    improvements TEXT,
    camper_engagement VARCHAR(10) DEFAULT 'medium',
    safety_rating INT NOT NULL CHECK (safety_rating >= 1 AND safety_rating <= 5),
    notes TEXT,
    eval_date VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


async def list_evals(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    category: Optional[str] = None,
    min_rating: Optional[int] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List program evaluations for an organization with optional filters."""
    await _ensure_table(db)
    q = "SELECT * FROM program_evaluations WHERE org_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if category:
        q += " AND category = :category"
        params["category"] = category
    if min_rating is not None:
        q += " AND rating >= :min_rating"
        params["min_rating"] = min_rating
    if search:
        q += " AND (program_name ILIKE :search OR evaluator_name ILIKE :search OR notes ILIKE :search)"
        params["search"] = f"%{search}%"

    q += " ORDER BY created_at DESC"
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_eval(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    eval_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single program evaluation by ID."""
    await _ensure_table(db)
    q = "SELECT * FROM program_evaluations WHERE id = :eval_id AND org_id = :org_id"
    result = await db.execute(text(q), {"eval_id": str(eval_id), "org_id": str(org_id)})
    row = result.first()
    return dict(row._mapping) if row else None


async def create_eval(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new program evaluation."""
    await _ensure_table(db)
    eval_id = uuid.uuid4()
    q = text("""
        INSERT INTO program_evaluations (
            id, org_id, program_name, category, evaluator_name,
            rating, strengths, improvements, camper_engagement,
            safety_rating, notes, eval_date
        )
        VALUES (
            :id, :org_id, :program_name, :category, :evaluator_name,
            :rating, :strengths, :improvements, :camper_engagement,
            :safety_rating, :notes, :eval_date
        )
        RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(eval_id),
        "org_id": str(org_id),
        "program_name": data["program_name"],
        "category": data.get("category", "other"),
        "evaluator_name": data["evaluator_name"],
        "rating": data["rating"],
        "strengths": data.get("strengths"),
        "improvements": data.get("improvements"),
        "camper_engagement": data.get("camper_engagement", "medium"),
        "safety_rating": data["safety_rating"],
        "notes": data.get("notes"),
        "eval_date": data.get("eval_date"),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping)


async def update_eval(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    eval_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing program evaluation."""
    await _ensure_table(db)
    fields = [
        "program_name", "category", "evaluator_name", "rating",
        "strengths", "improvements", "camper_engagement",
        "safety_rating", "notes", "eval_date",
    ]
    sets = ["updated_at = NOW()"]
    params: Dict[str, Any] = {"eval_id": str(eval_id), "org_id": str(org_id)}
    for field in fields:
        if field in data and data[field] is not None:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]
    if len(sets) == 1:
        return await get_eval(db, org_id=org_id, eval_id=eval_id)
    q = text(
        f"UPDATE program_evaluations SET {', '.join(sets)} "
        f"WHERE id = :eval_id AND org_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


async def delete_eval(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    eval_id: uuid.UUID,
) -> bool:
    """Delete a program evaluation."""
    await _ensure_table(db)
    result = await db.execute(
        text("DELETE FROM program_evaluations WHERE id = :eval_id AND org_id = :org_id"),
        {"eval_id": str(eval_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


async def get_stats(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Get aggregated program evaluation statistics."""
    await _ensure_table(db)

    # Overall stats
    q = text("""
        SELECT
            COUNT(*) AS total_evals,
            COALESCE(AVG(rating), 0) AS avg_rating,
            COALESCE(AVG(safety_rating), 0) AS avg_safety
        FROM program_evaluations
        WHERE org_id = :org_id
    """)
    result = await db.execute(q, {"org_id": str(org_id)})
    row = result.first()
    if row:
        m = row._mapping
        total_evals = m["total_evals"]
        avg_rating = round(float(m["avg_rating"]), 1)
        avg_safety = round(float(m["avg_safety"]), 1)
    else:
        total_evals = 0
        avg_rating = 0.0
        avg_safety = 0.0

    # Stats by category
    q2 = text("""
        SELECT
            category,
            COUNT(*) AS count,
            ROUND(AVG(rating)::numeric, 1) AS avg_rating,
            ROUND(AVG(safety_rating)::numeric, 1) AS avg_safety
        FROM program_evaluations
        WHERE org_id = :org_id
        GROUP BY category
        ORDER BY count DESC
    """)
    result2 = await db.execute(q2, {"org_id": str(org_id)})
    by_category = {}
    for r in result2:
        rm = r._mapping
        by_category[rm["category"]] = {
            "count": rm["count"],
            "avg_rating": float(rm["avg_rating"]),
            "avg_safety": float(rm["avg_safety"]),
        }

    # Top programs by average rating
    q3 = text("""
        SELECT
            program_name,
            COUNT(*) AS eval_count,
            ROUND(AVG(rating)::numeric, 1) AS avg_rating
        FROM program_evaluations
        WHERE org_id = :org_id
        GROUP BY program_name
        ORDER BY avg_rating DESC, eval_count DESC
        LIMIT 5
    """)
    result3 = await db.execute(q3, {"org_id": str(org_id)})
    top_programs = []
    for r in result3:
        rm = r._mapping
        top_programs.append({
            "program_name": rm["program_name"],
            "eval_count": rm["eval_count"],
            "avg_rating": float(rm["avg_rating"]),
        })

    return {
        "total_evals": total_evals,
        "avg_rating": avg_rating,
        "avg_safety": avg_safety,
        "by_category": by_category,
        "top_programs": top_programs,
    }

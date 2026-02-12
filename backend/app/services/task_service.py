"""
Camp Connect - Task Service
Business logic for task assignments using raw SQL text() queries.
Table: task_assignments
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# In-memory fallback store (used when DB table does not exist yet)
# ---------------------------------------------------------------------------
_tasks: Dict[str, List[Dict[str, Any]]] = {}


def _get_org_tasks(org_id: str) -> List[Dict[str, Any]]:
    return _tasks.setdefault(org_id, [])


# ---------------------------------------------------------------------------
# Helper: try DB first, fall back to in-memory
# ---------------------------------------------------------------------------

async def _table_exists(db: AsyncSession) -> bool:
    """Check if task_assignments table exists."""
    try:
        result = await db.execute(
            text(
                "SELECT EXISTS ("
                "  SELECT 1 FROM information_schema.tables"
                "  WHERE table_schema = 'public' AND table_name = 'task_assignments'"
                ")"
            )
        )
        return result.scalar() or False
    except Exception:
        return False


def _row_to_dict(row: Any) -> Dict[str, Any]:
    """Convert a SQLAlchemy Row to a dict, serialising datetimes to ISO strings."""
    d = dict(row._mapping)
    for k, v in d.items():
        if isinstance(v, datetime):
            d[k] = v.isoformat()
        elif hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
        elif v is None:
            d[k] = v
        else:
            d[k] = str(v) if not isinstance(v, (str, int, float, bool)) else v
    return d


# ---------------------------------------------------------------------------
# CRUD Operations
# ---------------------------------------------------------------------------


async def get_tasks(
    db: AsyncSession,
    org_id: str,
    *,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List task assignments with optional filters."""
    if await _table_exists(db):
        conditions = ["org_id = :org_id"]
        params: Dict[str, Any] = {"org_id": org_id}

        if status:
            conditions.append("status = :status")
            params["status"] = status
        if priority:
            conditions.append("priority = :priority")
            params["priority"] = priority
        if category:
            conditions.append("category = :category")
            params["category"] = category
        if assigned_to:
            conditions.append("assigned_to = :assigned_to")
            params["assigned_to"] = assigned_to
        if search:
            conditions.append("(title ILIKE :search OR description ILIKE :search)")
            params["search"] = f"%{search}%"

        where_clause = " AND ".join(conditions)
        query = text(
            f"SELECT * FROM task_assignments WHERE {where_clause} ORDER BY created_at DESC"
        )
        result = await db.execute(query, params)
        return [_row_to_dict(row) for row in result]

    # In-memory fallback
    items = _get_org_tasks(org_id)
    results = []
    for task in items:
        if status and task["status"] != status:
            continue
        if priority and task["priority"] != priority:
            continue
        if category and task["category"] != category:
            continue
        if assigned_to and task["assigned_to"] != assigned_to:
            continue
        if search:
            q = search.lower()
            if q not in task["title"].lower() and q not in (task.get("description") or "").lower():
                continue
        results.append(task)
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results


async def get_task(
    db: AsyncSession,
    org_id: str,
    task_id: str,
) -> Optional[Dict[str, Any]]:
    """Get a single task by ID."""
    if await _table_exists(db):
        result = await db.execute(
            text("SELECT * FROM task_assignments WHERE id = :id AND org_id = :org_id"),
            {"id": task_id, "org_id": org_id},
        )
        row = result.first()
        return _row_to_dict(row) if row else None

    # In-memory fallback
    for task in _get_org_tasks(org_id):
        if task["id"] == task_id:
            return task
    return None


async def create_task(
    db: AsyncSession,
    org_id: str,
    *,
    data: Dict[str, Any],
    assigned_by: str,
) -> Dict[str, Any]:
    """Create a new task assignment."""
    now = _now_iso()
    task_id = str(uuid.uuid4())

    task = {
        "id": task_id,
        "org_id": org_id,
        "title": data["title"],
        "description": data.get("description"),
        "assigned_to": data["assigned_to"],
        "assigned_by": assigned_by,
        "category": data.get("category", "other"),
        "priority": data.get("priority", "medium"),
        "status": "pending",
        "due_date": data.get("due_date"),
        "completed_at": None,
        "notes": data.get("notes"),
        "created_at": now,
        "updated_at": now,
    }

    if await _table_exists(db):
        await db.execute(
            text(
                "INSERT INTO task_assignments "
                "(id, org_id, title, description, assigned_to, assigned_by, "
                "category, priority, status, due_date, completed_at, notes, created_at, updated_at) "
                "VALUES (:id, :org_id, :title, :description, :assigned_to, :assigned_by, "
                ":category, :priority, :status, :due_date, :completed_at, :notes, :created_at, :updated_at)"
            ),
            task,
        )
        await db.commit()
    else:
        _get_org_tasks(org_id).append(task)

    return task


async def update_task(
    db: AsyncSession,
    org_id: str,
    task_id: str,
    *,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing task assignment."""
    now = _now_iso()

    # Auto-set completed_at when status changes to completed
    if data.get("status") == "completed" and not data.get("completed_at"):
        data["completed_at"] = now

    if await _table_exists(db):
        # Build dynamic SET clause
        set_parts = []
        params: Dict[str, Any] = {"id": task_id, "org_id": org_id, "updated_at": now}
        for key, value in data.items():
            if value is not None:
                set_parts.append(f"{key} = :{key}")
                params[key] = value
        set_parts.append("updated_at = :updated_at")

        set_clause = ", ".join(set_parts)
        await db.execute(
            text(f"UPDATE task_assignments SET {set_clause} WHERE id = :id AND org_id = :org_id"),
            params,
        )
        await db.commit()
        return await get_task(db, org_id, task_id)

    # In-memory fallback
    task = await get_task(db, org_id, task_id)
    if task is None:
        return None
    for key, value in data.items():
        if value is not None and key in task:
            task[key] = value
    task["updated_at"] = now
    return task


async def delete_task(
    db: AsyncSession,
    org_id: str,
    task_id: str,
) -> bool:
    """Delete a task assignment."""
    if await _table_exists(db):
        result = await db.execute(
            text("DELETE FROM task_assignments WHERE id = :id AND org_id = :org_id"),
            {"id": task_id, "org_id": org_id},
        )
        await db.commit()
        return result.rowcount > 0

    # In-memory fallback
    items = _get_org_tasks(org_id)
    for i, task in enumerate(items):
        if task["id"] == task_id:
            items.pop(i)
            return True
    return False


async def get_stats(
    db: AsyncSession,
    org_id: str,
) -> Dict[str, Any]:
    """Get task dashboard statistics."""
    tasks = await get_tasks(db, org_id)
    now = datetime.now(timezone.utc)

    stats = {
        "total": len(tasks),
        "pending": 0,
        "in_progress": 0,
        "completed": 0,
        "overdue": 0,
        "by_priority": {},
        "by_category": {},
    }

    for task in tasks:
        status = task.get("status", "pending")
        priority = task.get("priority", "medium")
        category = task.get("category", "other")

        if status == "pending":
            stats["pending"] += 1
        elif status == "in_progress":
            stats["in_progress"] += 1
        elif status == "completed":
            stats["completed"] += 1

        # Check overdue: has due_date, not completed/cancelled, and past due
        due = task.get("due_date")
        if due and status not in ("completed", "cancelled"):
            try:
                due_dt = datetime.fromisoformat(due.replace("Z", "+00:00")) if "T" in due else datetime.fromisoformat(due + "T23:59:59+00:00")
                if due_dt < now:
                    stats["overdue"] += 1
            except (ValueError, TypeError):
                pass

        stats["by_priority"][priority] = stats["by_priority"].get(priority, 0) + 1
        stats["by_category"][category] = stats["by_category"].get(category, 0) + 1

    return stats

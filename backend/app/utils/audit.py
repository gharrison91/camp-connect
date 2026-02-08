"""
Camp Connect - Audit Logging Utility
Creates audit log entries for tracking all mutations and sensitive reads.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def log_audit(
    session: AsyncSession,
    *,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    Create an audit log entry.

    This is added to the session but NOT committed — the caller
    is responsible for committing along with the rest of the
    transaction. This ensures the audit log is atomic with the
    operation it's logging.

    Args:
        session: Active database session.
        organization_id: Tenant ID.
        user_id: The user who performed the action.
        action: One of "create", "read", "update", "delete".
        resource_type: Entity type (e.g., "user", "role", "location").
        resource_id: ID of the specific resource (optional).
        details: JSONB with change details (e.g., old/new values).
        ip_address: Client IP address.
        user_agent: Client user-agent string.

    Returns:
        The created AuditLog instance (not yet committed).
    """
    entry = AuditLog(
        id=uuid.uuid4(),
        organization_id=organization_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=datetime.now(timezone.utc),
    )
    session.add(entry)
    return entry

"""
Camp Connect - Tenant Context Middleware
Sets PostgreSQL session variable for Row-Level Security (RLS).
"""

from __future__ import annotations

import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def set_tenant_context(
    session: AsyncSession,
    organization_id: uuid.UUID,
) -> None:
    """
    Set the current organization ID in the PostgreSQL session.

    This enables Row-Level Security (RLS) policies which use:
        current_setting('app.current_org_id', true)

    Must be called at the beginning of each request that touches
    tenant-scoped data.

    Args:
        session: The current database session.
        organization_id: The authenticated user's organization ID.
    """
    # SET LOCAL doesn't support parameterized queries in PostgreSQL.
    # We safely format the UUID string (UUIDs are safe — only hex + dashes).
    org_id_str = str(organization_id)
    # Validate it's a proper UUID format to prevent SQL injection
    uuid.UUID(org_id_str)  # Raises ValueError if not valid UUID
    await session.execute(
        text(f"SET LOCAL app.current_org_id = '{org_id_str}'")
    )

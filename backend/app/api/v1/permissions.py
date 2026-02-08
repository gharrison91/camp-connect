"""
Camp Connect - Permissions API Endpoint
Returns the permission registry for UI rendering.
"""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.utils.permissions import (
    PERMISSIONS,
    get_all_permissions,
    get_permissions_grouped,
)

router = APIRouter(prefix="/permissions", tags=["Permissions"])


@router.get("")
async def list_permissions(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Get the full permission registry.

    Returns permissions grouped by module and resource,
    plus a flat list. Used by the frontend to render the
    role permission matrix.
    """
    return {
        "grouped": get_permissions_grouped(),
        "flat": get_all_permissions(),
        "total": len(get_all_permissions()),
    }

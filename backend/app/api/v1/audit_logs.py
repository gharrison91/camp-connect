"""
Camp Connect - Audit Log API Endpoints
List, stats, and manual log creation for audit trail.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.audit_log import (
    AuditLogCreate,
    AuditLogEntry,
    AuditLogListResponse,
)
from app.services import audit_service

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get(
    "",
    response_model=AuditLogListResponse,
)
async def list_audit_logs(
    page: int = Query(default=1, ge=1, description="Page number"),
    per_page: int = Query(default=25, ge=1, le=100, description="Items per page"),
    action: Optional[str] = Query(default=None, description="Filter by action type"),
    resource_type: Optional[str] = Query(default=None, description="Filter by resource type"),
    user_id: Optional[str] = Query(default=None, description="Filter by user ID"),
    date_from: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    search: Optional[str] = Query(default=None, description="Search text"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List audit logs with filters and pagination."""
    return await audit_service.get_audit_logs(
        org_id=current_user["organization_id"],
        page=page,
        per_page=per_page,
        action_filter=action,
        resource_type_filter=resource_type,
        user_id_filter=user_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )


@router.get(
    "/stats",
    response_model=List[Dict[str, Any]],
)
async def get_audit_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get audit action counts for the last 30 days."""
    return await audit_service.get_audit_stats(
        org_id=current_user["organization_id"],
    )


@router.post(
    "",
    response_model=AuditLogEntry,
    status_code=201,
)
async def create_audit_log(
    payload: AuditLogCreate,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually create an audit log entry."""
    ip_address = request.client.host if request.client else None
    user_name = current_user.get("first_name", "") + " " + current_user.get("last_name", "")
    return await audit_service.log_action(
        org_id=current_user["organization_id"],
        user_id=current_user["id"],
        user_name=user_name.strip() or current_user.get("email", "Unknown"),
        action=payload.action.value,
        resource_type=payload.resource_type,
        resource_id=payload.resource_id,
        resource_name=payload.resource_name,
        details=payload.details,
        ip_address=ip_address,
    )

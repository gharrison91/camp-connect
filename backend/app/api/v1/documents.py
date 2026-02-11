"""
Camp Connect - Document Management API Endpoints
Full CRUD for documents and folders.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
    FolderCreate,
    FolderResponse,
)
from app.services import document_service

router = APIRouter(prefix="/documents", tags=["Documents"])


# ── Documents ──────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=List[DocumentResponse],
)
async def list_documents(
    search: Optional[str] = Query(default=None, description="Search by name or description"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    folder_id: Optional[str] = Query(default=None, description="Filter by folder"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """List all documents for the current organization."""
    return await document_service.get_documents(
        org_id=current_user["organization_id"],
        category=category,
        search=search,
        folder_id=folder_id,
        status=status,
    )


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    body: DocumentCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new document."""
    return await document_service.create_document(
        org_id=current_user["organization_id"],
        data=body.model_dump(),
        uploaded_by=str(current_user.get("user_id", "")),
        uploaded_by_name=current_user.get("email", "Unknown"),
    )


@router.put(
    "/{document_id}",
    response_model=DocumentResponse,
)
async def update_document(
    document_id: str,
    body: DocumentUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Update a document."""
    result = await document_service.update_document(
        org_id=current_user["organization_id"],
        document_id=document_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return result


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document."""
    deleted = await document_service.delete_document(
        org_id=current_user["organization_id"],
        document_id=document_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )


@router.post(
    "/{document_id}/archive",
    response_model=DocumentResponse,
)
async def archive_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Archive a document."""
    result = await document_service.archive_document(
        org_id=current_user["organization_id"],
        document_id=document_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return result


@router.get(
    "/expiring",
    response_model=List[DocumentResponse],
)
async def get_expiring_documents(
    days_ahead: int = Query(default=30, ge=1, le=365),
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get documents expiring within the specified number of days."""
    return await document_service.get_expiring_documents(
        org_id=current_user["organization_id"],
        days_ahead=days_ahead,
    )


@router.get(
    "/stats",
    response_model=Dict[str, Any],
)
async def get_document_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get document statistics."""
    return await document_service.get_document_stats(
        org_id=current_user["organization_id"],
    )


# ── Folders ────────────────────────────────────────────────────────────────

@router.get(
    "/folders",
    response_model=List[FolderResponse],
)
async def list_folders(
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """List all document folders for the current organization."""
    return await document_service.get_folders(
        org_id=current_user["organization_id"],
    )


@router.post(
    "/folders",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_folder(
    body: FolderCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.settings.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new document folder."""
    return await document_service.create_folder(
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )

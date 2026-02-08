"""
Camp Connect - Contact API Endpoints
CRUD for parent/guardian contacts.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.contact import ContactCreate, ContactResponse, ContactUpdate
from app.services import contact_service

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get(
    "",
    response_model=List[ContactResponse],
)
async def list_contacts(
    search: Optional[str] = Query(default=None, description="Search by name or email"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all contacts for the current organization."""
    return await contact_service.list_contacts(
        db,
        organization_id=current_user["organization_id"],
        search=search,
    )


@router.get(
    "/{contact_id}",
    response_model=ContactResponse,
)
async def get_contact(
    contact_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single contact by ID."""
    contact = await contact_service.get_contact(
        db,
        organization_id=current_user["organization_id"],
        contact_id=contact_id,
    )
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    return contact


@router.post(
    "",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_contact(
    body: ContactCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new contact (parent/guardian)."""
    return await contact_service.create_contact(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{contact_id}",
    response_model=ContactResponse,
)
async def update_contact(
    contact_id: uuid.UUID,
    body: ContactUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a contact."""
    result = await contact_service.update_contact(
        db,
        organization_id=current_user["organization_id"],
        contact_id=contact_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    return result


@router.delete(
    "/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_contact(
    contact_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) a contact."""
    deleted = await contact_service.delete_contact(
        db,
        organization_id=current_user["organization_id"],
        contact_id=contact_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )

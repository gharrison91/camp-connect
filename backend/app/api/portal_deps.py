"""
Camp Connect - Parent Portal Authentication Dependencies
Verifies that the caller is an authenticated Contact with portal_access enabled.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import verify_supabase_token
from app.middleware.tenant import set_tenant_context
from app.models.camper_contact import CamperContact
from app.models.contact import Contact
from app.models.user import User


async def get_portal_user(
    request: Request,
    token_payload: Dict[str, Any] = Depends(verify_supabase_token),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    FastAPI dependency: authenticate a parent/guardian via their Contact record.

    Flow:
      1. Decode the Supabase JWT to get the supabase_user_id (sub claim).
      2. Look up the internal User by supabase_user_id.
      3. Look up the Contact by user_id matching the internal User.id.
      4. Verify that contact.portal_access is True.
      5. Fetch linked camper IDs from the camper_contacts junction table.

    Returns a dict with portal user context for use in portal endpoints.
    Raises 403 if the contact is not found or portal access is disabled.
    """
    supabase_user_id = token_payload.get("sub")

    # Step 1: Find the internal User by Supabase auth ID
    user_result = await db.execute(
        select(User)
        .where(User.supabase_user_id == supabase_user_id)
        .where(User.deleted_at.is_(None))
    )
    user = user_result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No portal account found. Contact your camp administrator.",
        )

    # Step 2: Find the Contact linked to this User
    contact_result = await db.execute(
        select(Contact)
        .where(Contact.user_id == user.id)
        .where(Contact.deleted_at.is_(None))
    )
    contact = contact_result.scalar_one_or_none()

    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No portal account found. Contact your camp administrator.",
        )

    # Step 3: Verify portal access is enabled
    if not contact.portal_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Portal access is not enabled for this account.",
        )

    # Step 4: Fetch linked camper IDs
    cc_result = await db.execute(
        select(CamperContact.camper_id)
        .where(CamperContact.contact_id == contact.id)
    )
    linked_camper_ids: List[uuid.UUID] = [row[0] for row in cc_result.all()]

    # Set tenant context for RLS
    await set_tenant_context(db, contact.organization_id)

    # Store info on request state for audit logging
    request.state.user_id = user.id
    request.state.organization_id = contact.organization_id

    return {
        "contact_id": contact.id,
        "organization_id": contact.organization_id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "email": contact.email,
        "linked_camper_ids": linked_camper_ids,
    }

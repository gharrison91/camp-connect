"""
Camp Connect - Authentication Service
Handles registration, login, token refresh, and password reset.

Registration flow:
  1. Frontend calls POST /api/v1/auth/register with org + user details
  2. This service creates the Supabase auth user (via Admin API)
  3. Creates the organization in our DB
  4. Creates 8 default roles with permissions
  5. Creates the admin user linked to the Supabase user
  6. Signs the user in to get tokens
  7. Returns tokens + user info

Login flow:
  1. Frontend calls Supabase Auth directly (signInWithPassword)
  2. Frontend then calls our backend with the JWT to load the full user profile
  3. Alternatively, POST /api/v1/auth/login calls Supabase Auth from the backend
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.location import Location
from app.models.organization import Organization
from app.models.role import Role, RolePermission
from app.models.user import User
from app.utils.permissions import DEFAULT_ROLE_PERMISSIONS


async def register_organization(
    db: AsyncSession,
    *,
    org_name: str,
    org_slug: str,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
) -> Dict[str, Any]:
    """
    Register a new organization with an admin user.

    1. Create Supabase auth user via Admin API
    2. Create Organization
    3. Create 8 default roles with permissions
    4. Create admin User linked to Supabase user
    5. Sign in to get tokens
    6. Return tokens + user brief

    Raises:
        ValueError: If slug is taken or Supabase user creation fails.
    """
    # Import supabase client at runtime to avoid import errors when not configured
    from supabase import create_client

    # Check slug uniqueness
    existing = await db.execute(
        select(Organization).where(Organization.slug == org_slug)
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Organization slug '{org_slug}' is already taken")

    # Check email uniqueness in our system
    existing_user = await db.execute(
        select(User).where(User.email == email)
    )
    if existing_user.scalar_one_or_none():
        raise ValueError(f"Email '{email}' is already registered")

    # Step 1: Create Supabase auth user via Admin API
    supabase_admin = create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )

    try:
        auth_response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Auto-confirm on registration
        })
        supabase_user_id = auth_response.user.id
    except Exception as e:
        raise ValueError(f"Failed to create authentication account: {str(e)}")

    try:
        # Step 2: Create Organization
        org = Organization(
            id=uuid.uuid4(),
            name=org_name,
            slug=org_slug,
            settings={},
            enabled_modules=["core"],
            subscription_tier="free",
            marketplace_visible=True,
        )
        db.add(org)
        await db.flush()  # Get org.id without committing

        # Step 3: Create 8 default roles with permissions
        camp_director_role_id = None
        for role_name, perms in DEFAULT_ROLE_PERMISSIONS.items():
            role = Role(
                id=uuid.uuid4(),
                organization_id=org.id,
                name=role_name,
                description=f"Default {role_name} role",
                is_system=True,
            )
            db.add(role)
            await db.flush()  # Get role.id

            # Remember the Camp Director role for the admin user
            if role_name == "Camp Director":
                camp_director_role_id = role.id

            # Add permissions
            for perm in perms:
                rp = RolePermission(
                    id=uuid.uuid4(),
                    role_id=role.id,
                    permission=perm,
                )
                db.add(rp)

        # Step 4: Create admin User
        user = User(
            id=uuid.uuid4(),
            supabase_user_id=str(supabase_user_id),
            organization_id=org.id,
            role_id=camp_director_role_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
        )
        db.add(user)

        await db.commit()

    except Exception as e:
        await db.rollback()
        # Try to clean up the Supabase user if DB operations fail
        try:
            supabase_admin.auth.admin.delete_user(str(supabase_user_id))
        except Exception:
            pass  # Best effort cleanup
        raise ValueError(f"Registration failed: {str(e)}")

    # Step 5: Sign in to get tokens
    supabase_client = create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )

    try:
        sign_in_response = supabase_client.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
        access_token = sign_in_response.session.access_token
        refresh_token = sign_in_response.session.refresh_token
        expires_in = sign_in_response.session.expires_in
    except Exception as e:
        # Registration succeeded but sign-in failed — user can still log in manually
        raise ValueError(
            "Organization created successfully, but auto sign-in failed. "
            "Please log in manually."
        )

    # Step 6: Build response
    # Load permissions for the response
    all_perms = DEFAULT_ROLE_PERMISSIONS.get("Camp Director", [])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": expires_in or 3600,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "organization_id": str(org.id),
            "role_name": "Camp Director",
            "permissions": all_perms,
        },
    }


async def login_user(
    *,
    email: str,
    password: str,
) -> Dict[str, Any]:
    """
    Log in a user via Supabase Auth.

    Note: In the typical flow, the frontend calls Supabase directly.
    This backend endpoint is an alternative for server-side auth.

    Returns tokens from Supabase.
    """
    from supabase import create_client

    supabase_client = create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )

    try:
        response = supabase_client.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
    except Exception as e:
        raise ValueError(f"Invalid email or password")

    if not response.session:
        raise ValueError("Invalid email or password")

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "token_type": "bearer",
        "expires_in": response.session.expires_in or 3600,
    }


async def refresh_tokens(
    *,
    refresh_token: str,
) -> Dict[str, Any]:
    """
    Refresh an access token using a refresh token.
    """
    from supabase import create_client

    supabase_client = create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )

    try:
        response = supabase_client.auth.refresh_session(refresh_token)
    except Exception as e:
        raise ValueError(f"Failed to refresh token: {str(e)}")

    if not response.session:
        raise ValueError("Invalid refresh token")

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "token_type": "bearer",
        "expires_in": response.session.expires_in or 3600,
    }


async def forgot_password(
    *,
    email: str,
) -> Dict[str, str]:
    """
    Trigger a password reset email via Supabase Auth.
    Always returns success (to prevent email enumeration).
    """
    from supabase import create_client

    supabase_client = create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )

    try:
        supabase_client.auth.reset_password_email(email)
    except Exception:
        pass  # Always return success to prevent email enumeration

    return {"message": "If that email exists, a password reset link has been sent."}


async def get_user_profile(
    db: AsyncSession,
    *,
    supabase_user_id: str,
) -> Optional[Dict[str, Any]]:
    """
    Load a user's full profile from our database.
    Used by the frontend after Supabase auth to get permissions, role, etc.
    """
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(User)
        .options(
            selectinload(User.role).selectinload(Role.permissions),
            selectinload(User.organization),
        )
        .where(User.supabase_user_id == supabase_user_id)
        .where(User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()

    if user is None:
        return None

    permissions = [rp.permission for rp in user.role.permissions] if user.role else []

    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "organization_id": str(user.organization_id),
        "role_id": str(user.role_id),
        "role_name": user.role.name if user.role else None,
        "permissions": permissions,
        "is_active": user.is_active,
        "seasonal_access_start": str(user.seasonal_access_start) if user.seasonal_access_start else None,
        "seasonal_access_end": str(user.seasonal_access_end) if user.seasonal_access_end else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }

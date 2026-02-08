"""
Camp Connect - Auth API Endpoints
Registration, login, token refresh, forgot password, and user profile.
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
)
from app.schemas.common import ErrorResponse, MessageResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        409: {"model": ErrorResponse, "description": "Slug or email already taken"},
    },
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new organization with an admin user.

    Creates:
    - A Supabase auth account
    - An organization with the given name and slug
    - 8 default roles (Camp Director, Office Admin, Counselor, etc.)
    - An admin user with Camp Director role

    Returns auth tokens and user info.
    """
    try:
        result = await auth_service.register_organization(
            db,
            org_name=body.org_name,
            org_slug=body.org_slug,
            email=body.email,
            password=body.password,
            first_name=body.first_name,
            last_name=body.last_name,
        )
    except ValueError as e:
        error_msg = str(e)
        if "already taken" in error_msg or "already registered" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )

    return result


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
    },
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Log in with email and password.

    Note: The recommended flow is for the frontend to call Supabase Auth
    directly, then use /auth/me to load the user profile. This endpoint
    is an alternative for server-side authentication.

    Returns auth tokens. Use /auth/me to get the full user profile.
    """
    try:
        tokens = await auth_service.login_user(
            email=body.email,
            password=body.password,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    # Load user profile for the response
    # Decode the token to get supabase_user_id using PyJWT
    import jwt as pyjwt

    supabase_user_id = None
    try:
        # Decode without verification just to extract the sub claim
        # (we already verified via Supabase sign-in above)
        payload = pyjwt.decode(
            tokens["access_token"],
            options={"verify_signature": False},
            algorithms=["ES256", "HS256"],
        )
        supabase_user_id = payload.get("sub")
    except Exception:
        pass

    if supabase_user_id:
        profile = await auth_service.get_user_profile(
            db, supabase_user_id=supabase_user_id
        )
        if profile:
            tokens["user"] = profile

    return tokens


@router.post(
    "/refresh",
    response_model=AuthResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid refresh token"},
    },
)
async def refresh(body: RefreshRequest):
    """
    Refresh an access token using a refresh token.
    """
    try:
        result = await auth_service.refresh_tokens(
            refresh_token=body.refresh_token,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    return result


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
async def forgot_password(body: ForgotPasswordRequest):
    """
    Request a password reset email.

    Always returns success (to prevent email enumeration).
    """
    result = await auth_service.forgot_password(email=body.email)
    return result


@router.get(
    "/me",
    responses={
        401: {"model": ErrorResponse, "description": "Not authenticated"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
async def get_me(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current authenticated user's profile.

    Requires a valid Supabase JWT in the Authorization header.
    Returns user info, role, permissions, and organization ID.
    """
    return current_user

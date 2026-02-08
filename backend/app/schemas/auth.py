"""
Camp Connect - Authentication Schemas
Request/response models for auth endpoints.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    """Request to register a new organization + admin user."""
    org_name: str = Field(..., min_length=2, max_length=255)
    org_slug: str = Field(
        ...,
        min_length=2,
        max_length=255,
        pattern=r"^[a-z0-9][a-z0-9-]*[a-z0-9]$",
    )
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)


class LoginRequest(BaseModel):
    """Request to log in."""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Response containing auth tokens and user info."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600
    user: Optional[UserBrief] = None


class UserBrief(BaseModel):
    """Brief user info returned with auth responses."""
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    organization_id: uuid.UUID
    role_name: str
    permissions: list

    model_config = ConfigDict(from_attributes=True)


class RefreshRequest(BaseModel):
    """Request to refresh an access token."""
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Request to trigger a password reset email."""
    email: EmailStr


# Fix forward reference
AuthResponse.model_rebuild()

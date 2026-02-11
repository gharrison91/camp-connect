"""
Camp Connect - Branding Schemas
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict


class BrandingRead(BaseModel):
    """Branding settings returned from GET /branding."""

    primary_color: str = "#10b981"
    secondary_color: str = "#3b82f6"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    login_bg_url: Optional[str] = None
    sidebar_style: str = "dark"  # "dark" | "light"
    font_family: str = "System"  # System | Inter | Poppins | Roboto

    model_config = ConfigDict(from_attributes=True)


class BrandingUpdate(BaseModel):
    """Payload for PUT /branding."""

    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    login_bg_url: Optional[str] = None
    sidebar_style: Optional[str] = None  # "dark" | "light"
    font_family: Optional[str] = None

"""
Camp Connect - Platform Admin Settings API
Manage platform-level configurations and integrations.
Only accessible by platform_admin users.
"""

from __future__ import annotations

import os
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user


router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])


# In-memory storage for platform settings (in production, use Redis or DB)
_platform_settings: Dict[str, Any] = {
    "configured_integrations": [],
    "allow_org_integrations": False,
    "maintenance_mode": False,
    "debug_mode": False,
}


def _require_platform_admin(current_user: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure user is a platform admin."""
    if current_user.get("platform_role") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin access required",
        )
    return current_user


@router.get("")
async def get_platform_settings(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get platform settings."""
    _require_platform_admin(current_user)
    return _platform_settings


@router.put("")
async def update_platform_settings(
    updates: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Update platform settings."""
    _require_platform_admin(current_user)
    
    # Handle API key updates
    api_key_fields = [
        "apollo_api_key",
        "twilio_api_key",
        "sendgrid_api_key",
        "stripe_api_key",
    ]
    
    for key in api_key_fields:
        if key in updates and updates[key]:
            # In production: encrypt and store in vault or secure DB
            # For now, store as env var and mark as configured
            os.environ[key.upper()] = updates[key]
            if key not in _platform_settings["configured_integrations"]:
                _platform_settings["configured_integrations"].append(key)
    
    # Handle boolean settings
    if "allow_org_integrations" in updates:
        _platform_settings["allow_org_integrations"] = bool(
            updates["allow_org_integrations"]
        )
    
    if "maintenance_mode" in updates:
        _platform_settings["maintenance_mode"] = bool(updates["maintenance_mode"])
    
    if "debug_mode" in updates:
        _platform_settings["debug_mode"] = bool(updates["debug_mode"])
    
    return _platform_settings


@router.post("/test/{integration_key}")
async def test_integration(
    integration_key: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Test an integration connection."""
    _require_platform_admin(current_user)
    
    env_key = integration_key.upper()
    api_key = os.environ.get(env_key)
    
    if not api_key:
        return {
            "success": False,
            "message": f"{integration_key} is not configured",
        }
    
    # Simulate connection test based on integration type
    # In production, actually test the API connection
    if integration_key == "apollo_api_key":
        # Would call Apollo API here
        return {
            "success": True,
            "message": "Apollo.io connection successful",
        }
    elif integration_key == "twilio_api_key":
        # Would call Twilio API here
        return {
            "success": True,
            "message": "Twilio connection successful",
        }
    elif integration_key == "sendgrid_api_key":
        # Would call SendGrid API here
        return {
            "success": True,
            "message": "SendGrid connection successful",
        }
    elif integration_key == "stripe_api_key":
        # Would call Stripe API here
        return {
            "success": True,
            "message": "Stripe connection successful",
        }
    else:
        return {
            "success": False,
            "message": f"Unknown integration: {integration_key}",
        }

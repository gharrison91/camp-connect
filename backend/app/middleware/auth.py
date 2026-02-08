"""
Camp Connect - Authentication Middleware
Verifies Supabase JWT tokens on incoming requests.

Supports both:
  - ES256 (ECC P-256) via JWKS endpoint (current Supabase default)
  - HS256 via legacy JWT secret (fallback)
"""

from __future__ import annotations

from typing import Any, Dict, Optional

import jwt as pyjwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

# HTTPBearer scheme — extracts "Bearer <token>" from Authorization header
security_scheme = HTTPBearer(auto_error=False)

# JWKS client — caches signing keys from Supabase's JWKS endpoint
_jwks_client: Optional[PyJWKClient] = None


def _get_jwks_client() -> Optional[PyJWKClient]:
    """Lazy-init the JWKS client so it's only created once."""
    global _jwks_client
    if _jwks_client is None and settings.supabase_url:
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


async def verify_supabase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    """
    FastAPI dependency: decode and verify a Supabase JWT.

    Returns the decoded token payload which contains:
      - sub: Supabase user ID (auth.users.id)
      - email: user email
      - aud: audience (should be "authenticated")
      - role: Supabase role (usually "authenticated")
      - exp: expiration timestamp
      - iat: issued at timestamp

    Raises 401 if token is missing, expired, or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Try ES256 via JWKS first (current Supabase default)
    jwks_client = _get_jwks_client()
    if jwks_client is not None:
        try:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = pyjwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated",
            )
            return _validate_payload(payload)
        except pyjwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except (pyjwt.InvalidTokenError, Exception):
            # Fall through to HS256 attempt
            pass

    # Fallback: try HS256 with legacy JWT secret
    if settings.supabase_jwt_secret:
        try:
            payload = pyjwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return _validate_payload(payload)
        except pyjwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except pyjwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Authentication not configured (missing JWKS URL and JWT secret)",
    )


def _validate_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure required claims are present."""
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

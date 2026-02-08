"""
Camp Connect - Authentication Middleware
Verifies Supabase JWT tokens on incoming requests.

Supports both:
  - ES256 (ECC P-256) via JWKS endpoint (current Supabase default)
  - HS256 via legacy JWT secret (fallback)

Uses httpx to fetch JWKS keys (handles IPv4/IPv6 better than urllib
in Docker environments like Render).
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import httpx
import jwt as pyjwt
from jwt import PyJWK
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

# HTTPBearer scheme — extracts "Bearer <token>" from Authorization header
security_scheme = HTTPBearer(auto_error=False)

# Cached JWKS keys — fetched once via httpx
_jwks_keys: Optional[List[PyJWK]] = None
_jwks_fetched: bool = False


def _get_jwks_keys() -> Optional[List[PyJWK]]:
    """Fetch and cache JWKS keys from Supabase using httpx."""
    global _jwks_keys, _jwks_fetched
    if _jwks_fetched:
        return _jwks_keys
    _jwks_fetched = True

    if not settings.supabase_url:
        return None

    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        resp = httpx.get(jwks_url, timeout=10.0)
        resp.raise_for_status()
        jwks_data = resp.json()
        _jwks_keys = [PyJWK(key_data) for key_data in jwks_data.get("keys", [])]
        print(f"JWKS: loaded {len(_jwks_keys)} keys from {jwks_url}")
        return _jwks_keys
    except Exception as e:
        print(f"JWKS fetch failed ({type(e).__name__}: {e}), will use HS256 fallback")
        return None


def _find_signing_key(token: str, keys: List[PyJWK]) -> Optional[PyJWK]:
    """Find the matching signing key for a JWT from the JWKS keys."""
    try:
        header = pyjwt.get_unverified_header(token)
        kid = header.get("kid")
        if kid:
            for key in keys:
                if key.key_id == kid:
                    return key
        # No kid match — return first key
        return keys[0] if keys else None
    except Exception:
        return None


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
    jwks_keys = _get_jwks_keys()
    if jwks_keys:
        signing_key = _find_signing_key(token, jwks_keys)
        if signing_key is not None:
            try:
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
            except pyjwt.InvalidTokenError:
                # Fall through to HS256 attempt
                pass
            except Exception as e:
                print(f"ES256 verification failed: {type(e).__name__}: {e}")
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

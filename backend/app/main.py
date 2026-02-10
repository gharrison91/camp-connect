"""
Camp Connect - Registration & Event Management Platform
FastAPI Backend Application
"""

from __future__ import annotations

import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import engine

# API Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as org_router
from app.api.v1.locations import router as locations_router
from app.api.v1.roles import router as roles_router
from app.api.v1.users import router as users_router
from app.api.v1.settings import router as settings_router
from app.api.v1.permissions import router as permissions_router

# Phase 2: Core Registration routers
from app.api.v1.events import router as events_router
from app.api.v1.contacts import router as contacts_router
from app.api.v1.campers import router as campers_router
from app.api.v1.registrations import router as registrations_router
from app.api.v1.dashboard import router as dashboard_router

# Phase 3: Photos, Communications, Health & Safety
from app.api.v1.photos import router as photos_router
from app.api.v1.communications import router as communications_router
from app.api.v1.health_forms import router as health_forms_router

# Phase 4: Staff Onboarding, Staff Directory, Facial Recognition
from app.api.v1.onboarding import router as onboarding_router
from app.api.v1.staff import router as staff_router
from app.api.v1.face_recognition import router as face_recognition_router

# Phase 5: Analytics, Activities, Bunks, Families
from app.api.v1.analytics import router as analytics_router
from app.api.v1.activities import router as activities_router
from app.api.v1.bunks import router as bunks_router
from app.api.v1.families import router as families_router

# Phase 6: Parent Portal
from app.api.v1.portal import router as portal_router

# Phase 7: Scheduling, Payments, Notifications, Reports, Store
from app.api.v1.schedules import router as schedules_router
from app.api.v1.payments import router as payments_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.reports import router as reports_router
from app.api.v1.store import router as store_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup: verify database connectivity
    if engine is not None:
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            print("Database connection verified")
        except Exception as e:
            print(f"Database connection failed: {e}")
    else:
        print("No DATABASE_URL configured - app starting without database")
    yield
    # Shutdown: dispose engine
    if engine is not None:
        await engine.dispose()
        print("Database connections closed")


app = FastAPI(
    title=settings.app_name,
    description="Registration & Event Management Platform",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS middleware — allow Vercel production + all preview/deployment URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://camp-connect(-[a-z0-9]+)?(-gray-harrisons-projects)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(org_router, prefix=settings.api_v1_prefix)
app.include_router(locations_router, prefix=settings.api_v1_prefix)
app.include_router(roles_router, prefix=settings.api_v1_prefix)
app.include_router(users_router, prefix=settings.api_v1_prefix)
app.include_router(settings_router, prefix=settings.api_v1_prefix)
app.include_router(permissions_router, prefix=settings.api_v1_prefix)

# Phase 2: Core Registration
app.include_router(events_router, prefix=settings.api_v1_prefix)
app.include_router(contacts_router, prefix=settings.api_v1_prefix)
app.include_router(campers_router, prefix=settings.api_v1_prefix)
app.include_router(registrations_router, prefix=settings.api_v1_prefix)
app.include_router(dashboard_router, prefix=settings.api_v1_prefix)

# Phase 3: Photos, Communications, Health & Safety
app.include_router(photos_router, prefix=settings.api_v1_prefix)
app.include_router(communications_router, prefix=settings.api_v1_prefix)
app.include_router(health_forms_router, prefix=settings.api_v1_prefix)

# Phase 4: Staff Onboarding, Staff Directory, Facial Recognition
app.include_router(onboarding_router, prefix=settings.api_v1_prefix)
app.include_router(staff_router, prefix=settings.api_v1_prefix)
app.include_router(face_recognition_router, prefix=settings.api_v1_prefix)

# Phase 5: Analytics, Activities, Bunks, Families
app.include_router(analytics_router, prefix=settings.api_v1_prefix)
app.include_router(activities_router, prefix=settings.api_v1_prefix)
app.include_router(bunks_router, prefix=settings.api_v1_prefix)
app.include_router(families_router, prefix=settings.api_v1_prefix)

# Phase 6: Parent Portal
app.include_router(portal_router, prefix=settings.api_v1_prefix)

# Phase 7: Scheduling, Payments, Notifications, Reports, Store
app.include_router(schedules_router, prefix=settings.api_v1_prefix)
app.include_router(payments_router, prefix=settings.api_v1_prefix)
app.include_router(notifications_router, prefix=settings.api_v1_prefix)
app.include_router(reports_router, prefix=settings.api_v1_prefix)
app.include_router(store_router, prefix=settings.api_v1_prefix)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return detailed JSON errors."""
    tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
    print(f"Unhandled exception on {request.url}: {''.join(tb)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {type(exc).__name__}: {str(exc)}",
        },
    )


@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "status": "operational",
    }


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint with connectivity diagnostics."""
    import httpx

    db_ok = engine is not None
    db_live = False
    jwks_ok = False
    errors = []

    # Test DB connectivity
    if engine is not None:
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            db_live = True
        except Exception as e:
            errors.append(f"DB: {type(e).__name__}: {str(e)}")

    # Test JWKS fetch
    if settings.supabase_url:
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        try:
            resp = httpx.get(jwks_url, timeout=10.0)
            resp.raise_for_status()
            jwks_ok = True
        except Exception as e:
            errors.append(f"JWKS: {type(e).__name__}: {str(e)}")

    return {
        "status": "healthy" if db_live else "degraded",
        "database_configured": db_ok,
        "database_live": db_live,
        "jwks_reachable": jwks_ok,
        "supabase_url_set": bool(settings.supabase_url),
        "jwt_secret_set": bool(settings.supabase_jwt_secret),
        "errors": errors,
    }

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
from app.api.v1.cabins import router as cabins_router
from app.api.v1.families import router as families_router

# Phase 6: Parent Portal
from app.api.v1.portal import router as portal_router
from app.api.v1.portal_documents import router as portal_documents_router
from app.api.v1.portal_dashboard import router as portal_dashboard_router

# Phase 7: Scheduling, Payments, Notifications, Reports, Store
from app.api.v1.schedules import router as schedules_router
from app.api.v1.payments import router as payments_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.reports import router as reports_router
from app.api.v1.store import router as store_router
from app.api.v1.forms import router as forms_router
from app.api.v1.workflows import router as workflows_router
from app.api.v1.workflows import assoc_router as contact_assoc_router

# Phase 9: Staff Certifications, Saved Lists
from app.api.v1.staff_certifications import router as staff_certifications_router
from app.api.v1.lists import router as lists_router

# Phase 10: Job Titles, Bunk Buddy Requests, AI Insights
from app.api.v1.job_titles import router as job_titles_router
from app.api.v1.bunk_buddies import router as bunk_buddies_router
from app.api.v1.portal_bunk_buddies import router as portal_bunk_buddies_router
from app.api.v1.ai import router as ai_router

# Phase 11: Camper Messaging, Medicine, Schools, Alerts, Photo Albums
from app.api.v1.camper_messages import router as camper_messages_router
from app.api.v1.medicine import router as medicine_router
from app.api.v1.schools import router as schools_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.photo_albums import router as photo_albums_router

# Phase 12: Financial Features
from app.api.v1.quotes import router as quotes_router
from app.api.v1.payment_plans import router as payment_plans_router


# Phase 13: CRM / Deals
from app.api.v1.deals import router as deals_router

# Phase 14: Camp Directory
from app.api.v1.camp_directory import router as camp_directory_router

# Phase 14: Custom Fields
from app.api.v1.custom_fields import router as custom_fields_router
# Phase 15: Staff Marketplace / Job Board
from app.api.v1.job_listings import router as job_listings_router


# Phase 14: Background Checks
from app.api.v1.background_checks import router as background_checks_router

# Waitlist Management
from app.api.v1.waitlist import router as waitlist_router

# Phase 16: Lead Enrichment
from app.api.v1.lead_enrichment import router as lead_enrichment_router

# Branding / Theme
from app.api.v1.branding import router as branding_router

# Awards & Achievements (Gamification)
from app.api.v1.awards import router as awards_router
# Phase 17: Inventory & Equipment
from app.api.v1.inventory import router as inventory_router

# Transportation
from app.api.v1.transportation import router as transportation_router

# Spending Accounts
from app.api.v1.spending_accounts import router as spending_accounts_router

# Meal Planning
from app.api.v1.meals import router as meals_router

# Incident & Safety Reporting
from app.api.v1.incidents import router as incidents_router

# Emergency Action Plans & Drills
from app.api.v1.emergency import router as emergency_router

# Facility Maintenance
from app.api.v1.maintenance import router as maintenance_router

# Weather Monitoring
from app.api.v1.weather import router as weather_router

# Document Management
from app.api.v1.documents import router as documents_router


# Parent Communication Log & Check-Ins
from app.api.v1.parent_logs import router as parent_logs_router

# Visitor Management
from app.api.v1.visitors import router as visitors_router

# Skill Tracking
from app.api.v1.skill_tracking import router as skill_tracking_router

# Team Chat
from app.api.v1.team_chat import router as team_chat_router

# Attendance Tracking
from app.api.v1.attendance import router as attendance_router

# Volunteer Management
from app.api.v1.volunteers import router as volunteers_router

# Notification Preferences
from app.api.v1.notification_preferences import router as notification_prefs_router

# Global Search
from app.api.v1.search import router as search_router

# Medical Dashboard
from app.api.v1.medical_dashboard import router as medical_dashboard_router

# Medical Logs
from app.api.v1.medical_logs import router as medical_logs_router

# Audit Logs
from app.api.v1.audit_logs import router as audit_logs_router

# Packing Lists
from app.api.v1.packing_lists import router as packing_lists_router

# Permission Slips
from app.api.v1.permission_slips import router as permission_slips_router

# Camp Sessions
from app.api.v1.camp_sessions import router as camp_sessions_router

# Phase 23: Budget, Alumni, Surveys, Resource Booking, Supply Requests
from app.api.v1.budget import router as budget_router
from app.api.v1.alumni import router as alumni_router
from app.api.v1.surveys import router as surveys_router
from app.api.v1.resource_bookings import router as resource_bookings_router
from app.api.v1.supply_requests import router as supply_requests_router

# Phase 24: Carpool, Lost & Found, Allergy Matrix, Group Notes, Check-In/Out
from app.api.v1.carpools import router as carpools_router
from app.api.v1.lost_found import router as lost_found_router
from app.api.v1.allergy_matrix import router as allergy_matrix_router
from app.api.v1.group_notes import router as group_notes_router
from app.api.v1.checkin import router as checkin_router

# Program Evaluation
from app.api.v1.program_eval import router as program_eval_router

# Feedback Collection
from app.api.v1.feedback import router as feedback_router

# Referral Tracking
from app.api.v1.referrals import router as referrals_router

# Behavior Tracking
from app.api.v1.behavior import router as behavior_router

# Staff Scheduling
from app.api.v1.staff_schedule import router as staff_schedule_router
from app.api.v1.dietary import router as dietary_router

# Announcement Board
from app.api.v1.announcements import router as announcements_router

# Task Assignments
from app.api.v1.tasks import router as tasks_router
from app.api.v1.goals import router as goals_router
from app.api.v1.room_booking import router as room_booking_router

# Super Admin Portal
from app.api.v1.admin import router as admin_router

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
app.include_router(cabins_router, prefix=settings.api_v1_prefix)
app.include_router(families_router, prefix=settings.api_v1_prefix)

# Phase 6: Parent Portal
app.include_router(portal_router, prefix=settings.api_v1_prefix)
app.include_router(portal_documents_router, prefix=settings.api_v1_prefix)
app.include_router(portal_dashboard_router, prefix=settings.api_v1_prefix)


# Phase 7: Scheduling, Payments, Notifications, Reports, Store
app.include_router(schedules_router, prefix=settings.api_v1_prefix)
app.include_router(payments_router, prefix=settings.api_v1_prefix)
app.include_router(notifications_router, prefix=settings.api_v1_prefix)
app.include_router(reports_router, prefix=settings.api_v1_prefix)
app.include_router(store_router, prefix=settings.api_v1_prefix)

# Phase 8: Form Builder, Workflows, Contact Associations
app.include_router(forms_router, prefix=settings.api_v1_prefix)
app.include_router(workflows_router, prefix=settings.api_v1_prefix)
app.include_router(contact_assoc_router, prefix=settings.api_v1_prefix)

# Phase 9: Staff Certifications, Saved Lists
app.include_router(staff_certifications_router, prefix=settings.api_v1_prefix)
app.include_router(lists_router, prefix=settings.api_v1_prefix)

# Phase 10: Job Titles, Bunk Buddy Requests, AI Insights
app.include_router(job_titles_router, prefix=settings.api_v1_prefix)
app.include_router(bunk_buddies_router, prefix=settings.api_v1_prefix)
app.include_router(portal_bunk_buddies_router, prefix=settings.api_v1_prefix)
app.include_router(ai_router, prefix=settings.api_v1_prefix)

# Phase 11: Camper Messaging, Medicine, Schools, Alerts, Photo Albums
app.include_router(camper_messages_router, prefix=settings.api_v1_prefix)
app.include_router(medicine_router, prefix=settings.api_v1_prefix)
app.include_router(schools_router, prefix=settings.api_v1_prefix)
app.include_router(alerts_router, prefix=settings.api_v1_prefix)
app.include_router(photo_albums_router, prefix=settings.api_v1_prefix)

# Phase 12: Financial Features
app.include_router(quotes_router, prefix=settings.api_v1_prefix)
app.include_router(payment_plans_router, prefix=settings.api_v1_prefix)


# Phase 13: CRM / Deals
app.include_router(deals_router, prefix=settings.api_v1_prefix)

# Phase 14: Camp Directory
app.include_router(camp_directory_router, prefix=settings.api_v1_prefix)

# Phase 14: Custom Fields
app.include_router(custom_fields_router, prefix=settings.api_v1_prefix)
# Phase 15: Staff Marketplace / Job Board
app.include_router(job_listings_router, prefix=settings.api_v1_prefix)


# Phase 14: Background Checks
app.include_router(background_checks_router, prefix=settings.api_v1_prefix)

# Waitlist Management
app.include_router(waitlist_router, prefix=settings.api_v1_prefix)

# Phase 16: Lead Enrichment
app.include_router(lead_enrichment_router, prefix=settings.api_v1_prefix)

# Branding / Theme
app.include_router(branding_router, prefix=settings.api_v1_prefix)

# Awards & Achievements (Gamification)
app.include_router(awards_router, prefix=settings.api_v1_prefix)

# Phase 17: Inventory & Equipment
app.include_router(inventory_router, prefix=settings.api_v1_prefix)

# Transportation
app.include_router(transportation_router, prefix=settings.api_v1_prefix)

# Meal Planning
app.include_router(meals_router, prefix=settings.api_v1_prefix)

# Incident & Safety Reporting
app.include_router(incidents_router, prefix=settings.api_v1_prefix)

# Emergency Action Plans & Drills
app.include_router(emergency_router, prefix=settings.api_v1_prefix)

# Facility Maintenance
app.include_router(maintenance_router, prefix=settings.api_v1_prefix)

# Weather Monitoring
app.include_router(weather_router, prefix=settings.api_v1_prefix)

# Document Management
app.include_router(documents_router, prefix=settings.api_v1_prefix)

# Parent Communication Log & Check-Ins
app.include_router(parent_logs_router, prefix=settings.api_v1_prefix)

# Visitor Management
app.include_router(visitors_router, prefix=settings.api_v1_prefix)

# Skill Tracking
app.include_router(skill_tracking_router, prefix=settings.api_v1_prefix)

# Team Chat
app.include_router(team_chat_router, prefix=settings.api_v1_prefix)

# Attendance Tracking
app.include_router(attendance_router, prefix=settings.api_v1_prefix)

# Volunteer Management
app.include_router(volunteers_router, prefix=settings.api_v1_prefix)

# Notification Preferences
app.include_router(notification_prefs_router, prefix=settings.api_v1_prefix)

# Global Search
app.include_router(search_router, prefix=settings.api_v1_prefix)

# Medical Dashboard
app.include_router(medical_dashboard_router, prefix=settings.api_v1_prefix)

# Medical Logs
app.include_router(medical_logs_router, prefix=settings.api_v1_prefix)

# Audit Logs
app.include_router(audit_logs_router, prefix=settings.api_v1_prefix)

# Packing Lists
app.include_router(packing_lists_router, prefix=settings.api_v1_prefix)

# Spending Accounts
app.include_router(spending_accounts_router, prefix=settings.api_v1_prefix)

# Permission Slips
app.include_router(permission_slips_router, prefix=settings.api_v1_prefix)

# Camp Sessions
app.include_router(camp_sessions_router, prefix=settings.api_v1_prefix)

# Phase 23: Budget, Alumni, Surveys, Resource Booking, Supply Requests
app.include_router(budget_router, prefix=settings.api_v1_prefix)
app.include_router(alumni_router, prefix=settings.api_v1_prefix)
app.include_router(surveys_router, prefix=settings.api_v1_prefix)
app.include_router(resource_bookings_router, prefix=settings.api_v1_prefix)
app.include_router(supply_requests_router, prefix=settings.api_v1_prefix)

# Phase 24: Carpool, Lost & Found, Allergy Matrix, Group Notes, Check-In/Out
app.include_router(carpools_router, prefix=settings.api_v1_prefix)
app.include_router(lost_found_router, prefix=settings.api_v1_prefix)
app.include_router(allergy_matrix_router, prefix=settings.api_v1_prefix)
app.include_router(group_notes_router, prefix=settings.api_v1_prefix)
app.include_router(checkin_router, prefix=settings.api_v1_prefix)

# Staff Scheduling
app.include_router(staff_schedule_router, prefix=settings.api_v1_prefix)
app.include_router(dietary_router, prefix=settings.api_v1_prefix)

# Task Assignments
app.include_router(tasks_router, prefix=settings.api_v1_prefix)

# Referral Tracking
app.include_router(referrals_router, prefix=settings.api_v1_prefix)

# Behavior Tracking
app.include_router(behavior_router, prefix=settings.api_v1_prefix)

# Program Evaluation
app.include_router(program_eval_router, prefix=settings.api_v1_prefix)

# Announcement Board
app.include_router(announcements_router, prefix=settings.api_v1_prefix)

# Feedback Collection
app.include_router(feedback_router, prefix=settings.api_v1_prefix)

# Goal Setting
app.include_router(goals_router, prefix=settings.api_v1_prefix)

# Room Booking
app.include_router(room_booking_router, prefix=settings.api_v1_prefix)

# Super Admin Portal
app.include_router(admin_router, prefix=settings.api_v1_prefix)

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
        "aws_rekognition_configured": bool(settings.aws_access_key_id),
        "errors": errors,
    }


@app.get("/api/v1/health/db-tables")
async def check_tables():
    """Check which database tables exist. Useful for verifying migrations ran."""
    if engine is None:
        return {"status": "no_engine", "tables": []}
    try:
        async with engine.begin() as conn:
            result = await conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema = 'public' ORDER BY table_name"
                )
            )
            tables = [row[0] for row in result]
        phase8_tables = ["form_templates", "form_submissions", "workflows",
                         "workflow_executions", "workflow_execution_logs",
                         "contact_associations"]
        missing = [t for t in phase8_tables if t not in tables]
        return {
            "status": "ok",
            "total_tables": len(tables),
            "tables": tables,
            "phase8_missing": missing,
        }
    except Exception as e:
        return {"status": "error", "error": f"{type(e).__name__}: {e}"}

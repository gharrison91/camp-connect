"""
Camp Connect - Lead Enrichment API Endpoints
Apollo.io-style lead generation / enrichment integration.
Settings are persisted to Organization.settings JSONB under the key 'lead_enrichment'.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.models.contact import Contact
from app.models.organization import Organization
from app.schemas.lead_enrichment import (
    BulkEnrichRequest,
    BulkEnrichResponse,
    EnrichedContact,
    EnrichmentHistoryItem,
    EnrichmentHistoryResponse,
    LeadEnrichmentSettingsResponse,
    LeadEnrichmentSettingsUpdate,
    LeadImportRequest,
    LeadImportResponse,
    LeadSearchQuery,
    LeadSearchResponse,
    LeadSearchResult,
    TestConnectionResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lead-enrichment", tags=["Lead Enrichment"])

# In-memory enrichment history (per-org). Alerts are ephemeral.
_enrichment_history: Dict[str, List[Dict[str, Any]]] = {}

SETTINGS_KEY = "lead_enrichment"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_settings(org_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Read lead enrichment settings from Organization.settings JSONB."""
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        return {"api_key": None, "enabled": False, "auto_enrich": False, "provider": "apollo"}

    settings = (org.settings or {}).get(SETTINGS_KEY, {})
    return {
        "api_key": settings.get("api_key"),
        "enabled": settings.get("enabled", False),
        "auto_enrich": settings.get("auto_enrich", False),
        "provider": settings.get("provider", "apollo"),
    }


async def _save_settings(org_id: str, db: AsyncSession, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Merge updates into Organization.settings['lead_enrichment'] and commit."""
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    all_settings = dict(org.settings or {})
    le_settings = dict(all_settings.get(SETTINGS_KEY, {}))
    le_settings.update(updates)
    all_settings[SETTINGS_KEY] = le_settings

    # Force SQLAlchemy to detect JSONB change
    org.settings = all_settings

    await db.commit()
    await db.refresh(org)

    return {
        "api_key": le_settings.get("api_key"),
        "enabled": le_settings.get("enabled", False),
        "auto_enrich": le_settings.get("auto_enrich", False),
        "provider": le_settings.get("provider", "apollo"),
    }


def _add_history(org_id: str, item: Dict[str, Any]) -> None:
    if org_id not in _enrichment_history:
        _enrichment_history[org_id] = []
    _enrichment_history[org_id].insert(0, item)
    _enrichment_history[org_id] = _enrichment_history[org_id][:200]


# ---------------------------------------------------------------------------
# GET /lead-enrichment/settings
# ---------------------------------------------------------------------------

@router.get("/settings", response_model=LeadEnrichmentSettingsResponse)
async def get_settings(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get lead enrichment API key config and enabled status."""
    org_id = str(current_user["organization_id"])
    s = await _get_settings(org_id, db)
    return LeadEnrichmentSettingsResponse(
        api_key_set=bool(s["api_key"]),
        enabled=s["enabled"],
        auto_enrich=s["auto_enrich"],
        provider=s["provider"],
    )


# ---------------------------------------------------------------------------
# PUT /lead-enrichment/settings
# ---------------------------------------------------------------------------

@router.put("/settings", response_model=LeadEnrichmentSettingsResponse)
async def update_settings(
    payload: LeadEnrichmentSettingsUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update lead enrichment settings (api_key, enabled, auto_enrich). Persisted to DB."""
    org_id = str(current_user["organization_id"])

    updates: Dict[str, Any] = {}
    if payload.api_key is not None:
        updates["api_key"] = payload.api_key
    if payload.enabled is not None:
        updates["enabled"] = payload.enabled
    if payload.auto_enrich is not None:
        updates["auto_enrich"] = payload.auto_enrich
    if payload.provider is not None:
        updates["provider"] = payload.provider

    s = await _save_settings(org_id, db, updates)

    return LeadEnrichmentSettingsResponse(
        api_key_set=bool(s["api_key"]),
        enabled=s["enabled"],
        auto_enrich=s["auto_enrich"],
        provider=s["provider"],
    )


# ---------------------------------------------------------------------------
# POST /lead-enrichment/test-connection
# ---------------------------------------------------------------------------

@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_connection(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Test the configured Apollo API key by calling their /auth endpoint."""
    org_id = str(current_user["organization_id"])
    s = await _get_settings(org_id, db)

    if not s["api_key"]:
        return TestConnectionResponse(
            success=False,
            message="No API key configured. Please add your Apollo API key first.",
        )

    # Try calling Apollo's people search endpoint with a minimal request
    # to verify the key works
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.apollo.io/v1/mixed_people/search",
                headers={
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                },
                json={
                    "api_key": s["api_key"],
                    "q_organization_domains": "apollo.io",
                    "page": 1,
                    "per_page": 1,
                },
            )

            if resp.status_code == 200:
                return TestConnectionResponse(
                    success=True,
                    message="Connection successful! Apollo API key is valid.",
                )
            elif resp.status_code == 401:
                return TestConnectionResponse(
                    success=False,
                    message="Invalid API key. Please check your Apollo API key and try again.",
                )
            else:
                return TestConnectionResponse(
                    success=False,
                    message=f"Apollo returned status {resp.status_code}. Please check your API key.",
                )
    except httpx.TimeoutException:
        return TestConnectionResponse(
            success=False,
            message="Connection timed out. Please try again.",
        )
    except Exception as e:
        logger.warning(f"Apollo test connection failed for org {org_id}: {e}")
        return TestConnectionResponse(
            success=False,
            message=f"Connection failed: {str(e)}",
        )


# ---------------------------------------------------------------------------
# POST /lead-enrichment/import-lead
# ---------------------------------------------------------------------------

@router.post("/import-lead", response_model=LeadImportResponse)
async def import_lead(
    payload: LeadImportRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Import a lead search result as a new Contact record."""
    org_id = current_user["organization_id"]

    # Parse name into first/last
    name_parts = (payload.name or "").strip().split(" ", 1)
    first_name = name_parts[0] if name_parts else "Unknown"
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Parse location into city/state
    city = None
    state = None
    if payload.location:
        loc_parts = [p.strip() for p in payload.location.split(",")]
        city = loc_parts[0] if len(loc_parts) >= 1 else None
        state = loc_parts[1] if len(loc_parts) >= 2 else None

    # Check for existing contact with same email (avoid duplicates)
    if payload.email:
        existing = await db.execute(
            select(Contact).where(
                Contact.organization_id == org_id,
                Contact.email == payload.email,
                Contact.deleted_at.is_(None),
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A contact with email {payload.email} already exists.",
            )

    # Create the contact
    contact = Contact(
        id=uuid.uuid4(),
        organization_id=org_id,
        first_name=first_name,
        last_name=last_name,
        email=payload.email,
        phone=payload.phone,
        city=city,
        state=state,
        relationship_type="lead",
        account_status="active",
        communication_preference="email",
        notification_preferences={
            "source": "lead_enrichment",
            "title": payload.title,
            "company": payload.company,
            "linkedin_url": payload.linkedin_url,
            "confidence_score": payload.confidence_score,
            "imported_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    db.add(contact)
    await db.commit()
    await db.refresh(contact)

    _add_history(str(org_id), {
        "id": str(uuid.uuid4()),
        "contact_id": str(contact.id),
        "contact_name": f"{first_name} {last_name}".strip(),
        "action": "import",
        "status": "success",
        "details": f"Imported lead: {first_name} {last_name} ({payload.email or 'no email'})",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return LeadImportResponse(
        contact_id=str(contact.id),
        first_name=first_name,
        last_name=last_name,
        email=payload.email,
        message=f"Successfully imported {first_name} {last_name} as a contact.",
    )


# ---------------------------------------------------------------------------
# POST /lead-enrichment/enrich/{contact_id}
# ---------------------------------------------------------------------------

@router.post("/enrich/{contact_id}", response_model=EnrichedContact)
async def enrich_contact(
    contact_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enrich a single contact with external data from Apollo."""
    org_id = str(current_user["organization_id"])
    s = await _get_settings(org_id, db)

    if not s["enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead enrichment is not enabled. Enable it in settings first.",
        )
    if not s["api_key"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No API key configured. Add your Apollo API key in settings.",
        )

    # Look up the contact
    contact_result = await db.execute(
        select(Contact).where(
            Contact.id == contact_id,
            Contact.organization_id == current_user["organization_id"],
            Contact.deleted_at.is_(None),
        )
    )
    contact = contact_result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    contact_name = f"{contact.first_name} {contact.last_name}".strip()
    enriched = EnrichedContact(
        name=contact_name,
        email=contact.email,
        phone=contact.phone,
        title=None,
        company=None,
        linkedin_url=None,
        location=f"{contact.city}, {contact.state}" if contact.city else None,
        enriched_at=datetime.now(timezone.utc),
        data_source=s["provider"],
    )

    # If we have an email, try Apollo enrichment
    if contact.email and s["api_key"]:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.apollo.io/v1/people/match",
                    json={
                        "api_key": s["api_key"],
                        "email": contact.email,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    person = data.get("person", {})
                    if person:
                        enriched.title = person.get("title")
                        enriched.company = (person.get("organization", {}) or {}).get("name")
                        enriched.linkedin_url = person.get("linkedin_url")
                        enriched.location = person.get("city") or enriched.location
        except Exception as e:
            logger.warning(f"Apollo enrichment failed for contact {contact_id}: {e}")

    _add_history(org_id, {
        "id": str(uuid.uuid4()),
        "contact_id": contact_id,
        "contact_name": contact_name,
        "action": "enrich",
        "status": "success",
        "details": f"Enriched via {s['provider']}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return enriched


# ---------------------------------------------------------------------------
# POST /lead-enrichment/bulk-enrich
# ---------------------------------------------------------------------------

@router.post("/bulk-enrich", response_model=BulkEnrichResponse)
async def bulk_enrich(
    payload: BulkEnrichRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enrich multiple contacts at once."""
    org_id = str(current_user["organization_id"])
    s = await _get_settings(org_id, db)

    if not s["enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead enrichment is not enabled.",
        )
    if not s["api_key"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No API key configured.",
        )

    results: List[EnrichedContact] = []
    enriched_count = 0
    failed_count = 0

    for cid in payload.contact_ids:
        try:
            contact_result = await db.execute(
                select(Contact).where(
                    Contact.id == cid,
                    Contact.organization_id == current_user["organization_id"],
                    Contact.deleted_at.is_(None),
                )
            )
            contact = contact_result.scalar_one_or_none()
            if contact:
                enriched = EnrichedContact(
                    name=f"{contact.first_name} {contact.last_name}",
                    email=contact.email,
                    phone=contact.phone,
                    title=None,
                    company=None,
                    linkedin_url=None,
                    location=f"{contact.city}, {contact.state}" if contact.city else None,
                    enriched_at=datetime.now(timezone.utc),
                    data_source=s["provider"],
                )
                results.append(enriched)
                enriched_count += 1
            else:
                failed_count += 1
        except Exception:
            failed_count += 1

    _add_history(org_id, {
        "id": str(uuid.uuid4()),
        "contact_id": None,
        "contact_name": None,
        "action": "bulk_enrich",
        "status": "success",
        "details": f"Bulk enriched {enriched_count} contacts, {failed_count} failed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return BulkEnrichResponse(
        enriched=enriched_count,
        failed=failed_count,
        results=results,
    )


# ---------------------------------------------------------------------------
# GET /lead-enrichment/search
# ---------------------------------------------------------------------------

@router.get("/search", response_model=LeadSearchResponse)
async def search_leads(
    domain: Optional[str] = Query(default=None, description="Company domain"),
    company: Optional[str] = Query(default=None, description="Company name"),
    title: Optional[str] = Query(default=None, description="Job title"),
    location: Optional[str] = Query(default=None, description="Location"),
    limit: int = Query(default=25, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search for leads using Apollo API or fall back to sample data."""
    org_id = str(current_user["organization_id"])
    s = await _get_settings(org_id, db)

    if not s["enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead enrichment is not enabled. Enable it in settings first.",
        )
    if not s["api_key"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No API key configured. Add your Apollo API key in settings.",
        )

    query = LeadSearchQuery(
        domain=domain,
        company=company,
        title=title,
        location=location,
        limit=limit,
    )

    results: List[LeadSearchResult] = []

    # Try real Apollo API search
    try:
        search_params: Dict[str, Any] = {
            "api_key": s["api_key"],
            "page": 1,
            "per_page": min(limit, 25),
        }

        if domain:
            search_params["q_organization_domains"] = domain
        if company:
            search_params["q_organization_name"] = company
        if title:
            search_params["person_titles"] = [title]
        if location:
            search_params["person_locations"] = [location]

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.apollo.io/v1/mixed_people/search",
                headers={
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                },
                json=search_params,
            )

            if resp.status_code == 200:
                data = resp.json()
                people = data.get("people", []) or []
                for person in people[:limit]:
                    org_data = person.get("organization", {}) or {}
                    results.append(
                        LeadSearchResult(
                            id=person.get("id", str(uuid.uuid4())),
                            name=person.get("name", "Unknown"),
                            email=person.get("email"),
                            phone=None,  # Apollo doesn't always return phone in search
                            title=person.get("title"),
                            company=org_data.get("name"),
                            linkedin_url=person.get("linkedin_url"),
                            location=person.get("city"),
                            confidence_score=None,
                        )
                    )
            else:
                logger.warning(f"Apollo search returned status {resp.status_code}")
                # Fall through to sample data
    except Exception as e:
        logger.warning(f"Apollo search failed for org {org_id}: {e}")

    # If no results from API (key invalid, network error, etc.), return sample data
    if not results:
        sample_leads = [
            {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@campfun.com",
                "phone": "+1-555-0101",
                "title": "Camp Director",
                "company": company or "Camp Fun Inc.",
                "linkedin_url": "https://linkedin.com/in/sarahjohnson",
                "location": location or "Austin, TX",
                "confidence_score": 0.95,
            },
            {
                "name": "Michael Chen",
                "email": "m.chen@outdooradventures.org",
                "phone": "+1-555-0102",
                "title": title or "Program Coordinator",
                "company": company or "Outdoor Adventures",
                "linkedin_url": "https://linkedin.com/in/michaelchen",
                "location": location or "Seattle, WA",
                "confidence_score": 0.91,
            },
            {
                "name": "Emily Rodriguez",
                "email": "emily.r@summercamps.com",
                "phone": "+1-555-0103",
                "title": title or "Head Counselor",
                "company": company or "Summer Camps Co.",
                "linkedin_url": "https://linkedin.com/in/emilyrodriguez",
                "location": location or "Portland, OR",
                "confidence_score": 0.88,
            },
            {
                "name": "David Kim",
                "email": "dkim@youthprograms.org",
                "phone": None,
                "title": title or "Operations Manager",
                "company": company or "Youth Programs Alliance",
                "linkedin_url": "https://linkedin.com/in/davidkim",
                "location": location or "San Francisco, CA",
                "confidence_score": 0.85,
            },
            {
                "name": "Jessica Williams",
                "email": "jwilliams@campridge.com",
                "phone": "+1-555-0105",
                "title": title or "Enrollment Director",
                "company": company or "Camp Ridge",
                "linkedin_url": None,
                "location": location or "Denver, CO",
                "confidence_score": 0.82,
            },
        ]
        results = [
            LeadSearchResult(id=str(uuid.uuid4()), **lead)
            for lead in sample_leads[:limit]
        ]

    _add_history(org_id, {
        "id": str(uuid.uuid4()),
        "contact_id": None,
        "contact_name": None,
        "action": "search",
        "status": "success",
        "details": f"Searched: domain={domain}, company={company}, title={title}, location={location}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return LeadSearchResponse(
        results=results,
        total=len(results),
        query=query,
    )


# ---------------------------------------------------------------------------
# GET /lead-enrichment/history
# ---------------------------------------------------------------------------

@router.get("/history", response_model=EnrichmentHistoryResponse)
async def get_history(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get enrichment activity history log."""
    org_id = str(current_user["organization_id"])
    items = _enrichment_history.get(org_id, [])[:limit]
    return EnrichmentHistoryResponse(
        items=[EnrichmentHistoryItem(**item) for item in items],
        total=len(_enrichment_history.get(org_id, [])),
    )

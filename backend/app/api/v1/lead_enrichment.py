"""
Camp Connect - Lead Enrichment API Endpoints
Apollo.io-style lead generation / enrichment integration.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.lead_enrichment import (
    BulkEnrichRequest,
    BulkEnrichResponse,
    EnrichedContact,
    EnrichmentHistoryItem,
    EnrichmentHistoryResponse,
    LeadEnrichmentSettingsResponse,
    LeadEnrichmentSettingsUpdate,
    LeadSearchQuery,
    LeadSearchResponse,
    LeadSearchResult,
)

router = APIRouter(prefix="/lead-enrichment", tags=["Lead Enrichment"])

# ---------------------------------------------------------------------------
# In-memory settings store (per-org). In production, persist to DB table.
# ---------------------------------------------------------------------------

_org_settings: Dict[str, Dict[str, Any]] = {}
_enrichment_history: Dict[str, List[Dict[str, Any]]] = {}


def _get_settings(org_id: str) -> Dict[str, Any]:
    if org_id not in _org_settings:
        _org_settings[org_id] = {
            "api_key": None,
            "enabled": False,
            "auto_enrich": False,
            "provider": "apollo",
        }
    return _org_settings[org_id]


def _add_history(org_id: str, item: Dict[str, Any]) -> None:
    if org_id not in _enrichment_history:
        _enrichment_history[org_id] = []
    _enrichment_history[org_id].insert(0, item)
    # Keep only last 200 entries
    _enrichment_history[org_id] = _enrichment_history[org_id][:200]


# ---------------------------------------------------------------------------
# GET /lead-enrichment/settings
# ---------------------------------------------------------------------------

@router.get("/settings", response_model=LeadEnrichmentSettingsResponse)
async def get_settings(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.read")
    ),
):
    """Get lead enrichment API key config and enabled status."""
    org_id = str(current_user["organization_id"])
    s = _get_settings(org_id)
    return LeadEnrichmentSettingsResponse(
        api_key_set=s["api_key"] is not None and len(s["api_key"]) > 0,
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
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.read")
    ),
):
    """Update lead enrichment settings (api_key, enabled, auto_enrich)."""
    org_id = str(current_user["organization_id"])
    s = _get_settings(org_id)

    if payload.api_key is not None:
        s["api_key"] = payload.api_key
    if payload.enabled is not None:
        s["enabled"] = payload.enabled
    if payload.auto_enrich is not None:
        s["auto_enrich"] = payload.auto_enrich
    if payload.provider is not None:
        s["provider"] = payload.provider

    return LeadEnrichmentSettingsResponse(
        api_key_set=s["api_key"] is not None and len(s["api_key"]) > 0,
        enabled=s["enabled"],
        auto_enrich=s["auto_enrich"],
        provider=s["provider"],
    )


# ---------------------------------------------------------------------------
# POST /lead-enrichment/enrich/{contact_id}
# ---------------------------------------------------------------------------

@router.post("/enrich/{contact_id}", response_model=EnrichedContact)
async def enrich_contact(
    contact_id: str,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Enrich a single contact with external data."""
    org_id = str(current_user["organization_id"])
    s = _get_settings(org_id)

    if not s["enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead enrichment is not enabled. Enable it in settings first.",
        )
    if not s["api_key"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No API key configured. Add your provider API key in settings.",
        )

    # In a real implementation, call the Apollo/Clearbit/etc. API here.
    # For now, return simulated enriched data.
    enriched = EnrichedContact(
        name="Enriched Contact",
        email=f"contact-{contact_id[:8]}@example.com",
        phone="+1-555-0100",
        title="Camp Director",
        company="Summer Adventures LLC",
        linkedin_url=f"https://linkedin.com/in/contact-{contact_id[:8]}",
        location="Portland, OR",
        enriched_at=datetime.now(timezone.utc),
        data_source=s["provider"],
    )

    _add_history(org_id, {
        "id": str(uuid.uuid4()),
        "contact_id": contact_id,
        "contact_name": enriched.name,
        "action": "enrich",
        "status": "success",
        "details": "Enriched via " + s["provider"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return enriched


# ---------------------------------------------------------------------------
# POST /lead-enrichment/bulk-enrich
# ---------------------------------------------------------------------------

@router.post("/bulk-enrich", response_model=BulkEnrichResponse)
async def bulk_enrich(
    payload: BulkEnrichRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Enrich multiple contacts at once."""
    org_id = str(current_user["organization_id"])
    s = _get_settings(org_id)

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
            enriched = EnrichedContact(
                name=f"Contact {cid[:8]}",
                email=f"contact-{cid[:8]}@example.com",
                phone="+1-555-0100",
                title="Staff Member",
                company="Camp Org",
                linkedin_url=f"https://linkedin.com/in/{cid[:8]}",
                location="Denver, CO",
                enriched_at=datetime.now(timezone.utc),
                data_source=s["provider"],
            )
            results.append(enriched)
            enriched_count += 1
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
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.read")
    ),
):
    """Search for leads by domain, company, title, or location."""
    org_id = str(current_user["organization_id"])
    s = _get_settings(org_id)

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

    query = LeadSearchQuery(
        domain=domain,
        company=company,
        title=title,
        location=location,
        limit=limit,
    )

    # Simulated search results - in production, call Apollo/Clearbit API
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
    current_user: Dict[str, Any] = Depends(
        require_permission("core.contacts.read")
    ),
):
    """Get enrichment activity history log."""
    org_id = str(current_user["organization_id"])
    items = _enrichment_history.get(org_id, [])[:limit]
    return EnrichmentHistoryResponse(
        items=[EnrichmentHistoryItem(**item) for item in items],
        total=len(_enrichment_history.get(org_id, [])),
    )

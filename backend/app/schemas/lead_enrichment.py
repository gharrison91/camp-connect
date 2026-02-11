"""
Camp Connect - Lead Enrichment Schemas
Apollo.io-style lead generation / enrichment integration.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class LeadEnrichmentSettingsUpdate(BaseModel):
    api_key: Optional[str] = None
    enabled: Optional[bool] = None
    auto_enrich: Optional[bool] = None
    provider: Optional[str] = None


class LeadEnrichmentSettingsResponse(BaseModel):
    api_key_set: bool
    enabled: bool
    auto_enrich: bool
    provider: str


class EnrichedContact(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    enriched_at: Optional[datetime] = None
    data_source: Optional[str] = None


class LeadSearchQuery(BaseModel):
    domain: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    limit: int = 25


class LeadSearchResult(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    confidence_score: Optional[float] = None


class LeadSearchResponse(BaseModel):
    results: List[LeadSearchResult]
    total: int
    query: LeadSearchQuery


class BulkEnrichRequest(BaseModel):
    contact_ids: List[str]


class BulkEnrichResponse(BaseModel):
    enriched: int
    failed: int
    results: List[EnrichedContact]


class EnrichmentHistoryItem(BaseModel):
    id: str
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    action: str
    status: str
    details: Optional[str] = None
    created_at: datetime


class EnrichmentHistoryResponse(BaseModel):
    items: List[EnrichmentHistoryItem]
    total: int

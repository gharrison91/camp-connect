"""
Camp Connect - SQLAlchemy Models
Import all models here so Alembic can detect them.
"""

from app.models.base import Base, SoftDeleteMixin, TenantMixin, TimestampMixin
from app.models.organization import Organization
from app.models.user import User
from app.models.role import Role, RolePermission
from app.models.location import Location
from app.models.audit_log import AuditLog

# Phase 2: Core Registration models
from app.models.event import Event
from app.models.contact import Contact
from app.models.camper import Camper
from app.models.camper_contact import CamperContact
from app.models.registration import Registration
from app.models.waitlist import Waitlist

__all__ = [
    "Base",
    "TimestampMixin",
    "SoftDeleteMixin",
    "TenantMixin",
    "Organization",
    "User",
    "Role",
    "RolePermission",
    "Location",
    "AuditLog",
    # Phase 2
    "Event",
    "Contact",
    "Camper",
    "CamperContact",
    "Registration",
    "Waitlist",
]

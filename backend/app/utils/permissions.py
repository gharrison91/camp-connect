"""
Camp Connect - Permission Registry & Utilities
Defines all permission strings and provides FastAPI dependency factories.
"""

from __future__ import annotations

from typing import Dict, List

# ---------------------------------------------------------------------------
# Permission registry — Phase 1 permissions
# Format: "module.resource.action"
# ---------------------------------------------------------------------------

PERMISSIONS: Dict[str, Dict[str, List[str]]] = {
    "core": {
        "events": ["create", "read", "update", "delete"],
        "campers": ["read", "update", "delete"],
        "contacts": ["read", "update"],
        "registrations": ["create", "read", "update", "cancel"],
        "roles": ["manage"],
        "users": ["invite", "read", "update", "suspend"],
        "settings": ["manage"],
        "locations": ["create", "read", "update", "delete"],
        "activities": ["read", "update", "delete"],
        "bunks": ["read", "update", "delete"],
        "families": ["read", "update"],
    },
    "health": {
        "forms": ["read", "update"],
        "medications": ["administer", "read"],
        "incidents": ["create", "read"],
    },
    "financial": {
        "payments": ["read", "process", "refund"],
        "discounts": ["create", "manage"],
        "payouts": ["read", "manage"],
        "reports": ["read"],
    },
    "comms": {
        "messages": ["send", "read"],
        "templates": ["manage"],
        "workflows": ["manage"],
    },
    "photos": {
        "media": ["upload", "approve", "delete", "view"],
    },
    "staff": {
        "employees": ["read", "manage"],
        "onboarding": ["manage"],
        "schedules": ["manage"],
        "payroll": ["export"],
    },
    "ai": {
        "assistant": ["use"],
    },
    "analytics": {
        "dashboards": ["create", "read"],
        "reports": ["export", "schedule"],
    },
    "store": {
        "manage": ["manage"],
        "transactions": ["view"],
    },
}


def get_all_permissions() -> List[str]:
    """Return a flat list of all permission strings."""
    perms: List[str] = []
    for module, resources in PERMISSIONS.items():
        for resource, actions in resources.items():
            for action in actions:
                perms.append(f"{module}.{resource}.{action}")
    return perms


def get_permissions_by_module(module: str) -> List[str]:
    """Return all permission strings for a given module."""
    perms: List[str] = []
    resources = PERMISSIONS.get(module, {})
    for resource, actions in resources.items():
        for action in actions:
            perms.append(f"{module}.{resource}.{action}")
    return perms


def get_permissions_grouped() -> Dict[str, Dict[str, List[str]]]:
    """Return permissions grouped by module and resource (for UI display)."""
    return PERMISSIONS


# ---------------------------------------------------------------------------
# Default role permission templates
# Used when creating a new organization (8 default roles)
# ---------------------------------------------------------------------------

DEFAULT_ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "Camp Director": get_all_permissions(),  # All permissions
    "Office Admin": [
        "core.events.create", "core.events.read", "core.events.update",
        "core.campers.read", "core.campers.update",
        "core.contacts.read", "core.contacts.update",
        "core.registrations.create", "core.registrations.read",
        "core.registrations.update", "core.registrations.cancel",
        "core.locations.read",
        "core.users.read",
        "core.activities.read", "core.activities.update",
        "core.bunks.read", "core.bunks.update",
        "core.families.read", "core.families.update",
        "financial.payments.read", "financial.payments.process",
        "financial.discounts.create",
        "comms.messages.send", "comms.messages.read",
        "comms.templates.manage",
        "analytics.dashboards.read",
    ],
    "Counselor": [
        "core.events.read",
        "core.campers.read",
        "core.contacts.read",
        "core.registrations.read",
        "core.locations.read",
        "core.activities.read",
        "core.bunks.read",
        "core.families.read",
        "comms.messages.send", "comms.messages.read",
        "health.incidents.create", "health.incidents.read",
    ],
    "Nurse": [
        "core.campers.read",
        "core.events.read",
        "core.locations.read",
        "health.forms.read", "health.forms.update",
        "health.medications.administer", "health.medications.read",
        "health.incidents.create", "health.incidents.read",
    ],
    "HR Admin": [
        "core.events.read",
        "core.users.read",
        "core.locations.read",
        "staff.employees.read", "staff.employees.manage",
        "staff.onboarding.manage",
        "staff.schedules.manage",
        "staff.payroll.export",
    ],
    "Marketing": [
        "core.events.read",
        "core.campers.read",
        "core.contacts.read",
        "core.locations.read",
        "comms.messages.send", "comms.messages.read",
        "comms.templates.manage",
        "comms.workflows.manage",
        "analytics.dashboards.create", "analytics.dashboards.read",
        "analytics.reports.export", "analytics.reports.schedule",
    ],
    "Finance": [
        "core.events.read",
        "core.registrations.read",
        "core.locations.read",
        "financial.payments.read", "financial.payments.process",
        "financial.payments.refund",
        "financial.discounts.create", "financial.discounts.manage",
        "financial.payouts.read", "financial.payouts.manage",
        "financial.reports.read",
        "analytics.dashboards.read",
        "analytics.reports.export",
    ],
    "Read-Only": [
        "core.events.read",
        "core.campers.read",
        "core.contacts.read",
        "core.registrations.read",
        "core.locations.read",
        "core.activities.read",
        "core.bunks.read",
        "core.families.read",
        "analytics.dashboards.read",
    ],
}

"""
Camp Connect - SQLAlchemy Models
Import all models here so Alembic can detect them.
"""

from app.models.base import Base, SoftDeleteMixin, TenantMixin, TimestampMixin
from app.models.organization import Organization
from app.models.job_title import JobTitle
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

# Phase 3: Photos, Communications, Health & Safety
from app.models.photo import Photo, PhotoAlbum
from app.models.message import Message
from app.models.message_template import MessageTemplate
from app.models.health_form import HealthFormTemplate, HealthForm, HealthFormSubmission

# Phase 4: Staff Onboarding & Facial Recognition
from app.models.staff_onboarding import (
    StaffOnboarding,
    StaffCertification,
    StaffDocument,
    PolicyAcknowledgment,
)
from app.models.photo_face_tag import PhotoFaceTag

# Phase 5: Analytics, Activities, Bunks, Families
from app.models.activity import Activity
from app.models.bunk import Cabin, Bunk, BunkAssignment
from app.models.family import Family

# Phase 7: Scheduling, Payments, Store, Notifications, Event Bunk Config
from app.models.schedule import Schedule, ScheduleAssignment
from app.models.payment import Invoice, Payment
from app.models.notification_config import NotificationConfig
from app.models.store import StoreItem, SpendingAccount, StoreTransaction
from app.models.event_bunk_config import EventBunkConfig

# Phase 8: Form Builder, Workflow Engine, Contact Associations
from app.models.form_builder import FormTemplate, FormSubmission
from app.models.workflow import (
    Workflow,
    WorkflowExecution,
    WorkflowExecutionLog,
    ContactAssociation,
)

# Phase 9: Staff Certification Types, Saved Lists
from app.models.staff_certification import CertificationType, StaffCertificationRecord
from app.models.saved_list import SavedList, SavedListMember

# Phase 10: Job Titles, Bunk Buddy Requests
from app.models.bunk_buddy import BunkBuddyRequest

# Phase 11: Camper Messages, Medicine Schedules, Schools, Contact Alerts
from app.models.camper_message import CamperMessage
from app.models.medicine_schedule import MedicineSchedule, MedicineAdministration
from app.models.school import School
from app.models.contact_alert import ContactAlert

# Phase 12: Financial Features
from app.models.quote import Quote
from app.models.payment_plan import PaymentPlan, PaymentPlanInstallment


# Phase 13: CRM / Deals
from app.models.deal import Deal

# Phase 14: Camp Directory
from app.models.camp_profile import CampProfile

# Phase 14: Custom Fields
from app.models.custom_field import CustomFieldDefinition, CustomFieldValue

# Phase 14: Background Checks
from app.models.background_check import BackgroundCheck
# Phase 15: Staff Marketplace / Job Board
from app.models.job_listing import JobListing, JobApplication


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
    # Phase 3
    "Photo",
    "PhotoAlbum",
    "Message",
    "MessageTemplate",
    "HealthFormTemplate",
    "HealthForm",
    "HealthFormSubmission",
    # Phase 4
    "StaffOnboarding",
    "StaffCertification",
    "StaffDocument",
    "PolicyAcknowledgment",
    "PhotoFaceTag",
    # Phase 5
    "Activity",
    "Cabin",
    "Bunk",
    "BunkAssignment",
    "Family",
    # Phase 7
    "Schedule",
    "ScheduleAssignment",
    "Invoice",
    "Payment",
    "NotificationConfig",
    "StoreItem",
    "SpendingAccount",
    "StoreTransaction",
    "EventBunkConfig",
    # Phase 8
    "FormTemplate",
    "FormSubmission",
    "Workflow",
    "WorkflowExecution",
    "WorkflowExecutionLog",
    "ContactAssociation",
    # Phase 9
    "CertificationType",
    "StaffCertificationRecord",
    "SavedList",
    "SavedListMember",
    # Phase 10
    "JobTitle",
    "BunkBuddyRequest",
    # Phase 11
    "CamperMessage",
    "MedicineSchedule",
    "MedicineAdministration",
    "School",
    "ContactAlert",
    # Phase 12
    "Quote",
    "PaymentPlan",
    "PaymentPlanInstallment",
    # Phase 13
    "Deal",
    # Phase 14
    "CustomFieldDefinition",
    "CustomFieldValue",
    # Phase 14
    "BackgroundCheck",
    # Phase 15
    "JobListing",
    "JobApplication",
    # Camp Directory
    "CampProfile",
]

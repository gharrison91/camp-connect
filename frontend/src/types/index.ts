// ─── Events ──────────────────────────────────────────────────

export interface Event {
  id: string;
  name: string;
  description: string | null;
  location_id: string | null;
  location_name: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  capacity: number;
  enrolled_count: number;
  waitlist_count: number;
  min_age: number | null;
  max_age: number | null;
  gender_restriction: 'all' | 'male' | 'female';
  price: number;
  deposit_amount: number | null;
  deposit_required: boolean;
  tax_rate: number | null;
  status: 'draft' | 'published' | 'full' | 'archived';
  registration_open_date: string | null;
  registration_close_date: string | null;
  cloned_from_event_id: string | null;
  created_at: string;
}

export interface EventCreate {
  name: string;
  description?: string;
  location_id?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  capacity?: number;
  min_age?: number;
  max_age?: number;
  gender_restriction?: 'all' | 'male' | 'female';
  price?: number;
  deposit_amount?: number;
  deposit_required?: boolean;
  tax_rate?: number;
  status?: 'draft' | 'published' | 'full' | 'archived';
  registration_open_date?: string;
  registration_close_date?: string;
}

export interface EventUpdate extends Partial<EventCreate> {}

// ─── Contacts ────────────────────────────────────────────────

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  relationship_type: string;
  notification_preferences: Record<string, boolean> | null;
  account_status: 'active' | 'guest';
  camper_count: number;
  linked_campers: {
    id: string;
    first_name: string;
    last_name: string;
    relationship_type: string;
    is_primary: boolean;
  }[];
  created_at: string;
}

export interface ContactCreate {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  relationship_type?: string;
  notification_preferences?: Record<string, boolean>;
  account_status?: 'active' | 'guest';
}

export interface ContactUpdate extends Partial<ContactCreate> {}

// ─── Campers ─────────────────────────────────────────────────

export interface CamperContactInfo {
  contact_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  relationship_type: string;
  is_primary: boolean;
  is_emergency: boolean;
  is_authorized_pickup: boolean;
}

export interface Camper {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  school: string | null;
  grade: string | null;
  city: string | null;
  state: string | null;
  allergies: string[] | null;
  dietary_restrictions: string[] | null;
  custom_fields: Record<string, unknown> | null;
  reference_photo_url: string | null;
  contacts: CamperContactInfo[];
  registration_count: number;
  created_at: string;
}

export interface CamperContactLink {
  contact_id: string;
  relationship_type?: string;
  is_primary?: boolean;
  is_emergency?: boolean;
  is_authorized_pickup?: boolean;
}

export interface CamperCreate {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  school?: string;
  grade?: string;
  city?: string;
  state?: string;
  allergies?: string[];
  dietary_restrictions?: string[];
  custom_fields?: Record<string, unknown>;
  contacts?: CamperContactLink[];
}

export interface CamperUpdate extends Partial<Omit<CamperCreate, 'contacts'>> {}

export interface PaginatedCampers {
  items: Camper[];
  total: number;
  skip: number;
  limit: number;
}

// ─── Registrations ───────────────────────────────────────────

export interface Registration {
  id: string;
  camper_id: string;
  event_id: string;
  registered_by: string | null;
  camper_name: string | null;
  event_name: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlisted';
  payment_status: 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';
  activity_requests: string[] | null;
  special_requests: string | null;
  registered_at: string;
  created_at: string;
}

export interface RegistrationCreate {
  camper_id: string;
  event_id: string;
  registered_by?: string;
  activity_requests?: string[];
  special_requests?: string;
}

// ─── Waitlist ────────────────────────────────────────────────

export interface WaitlistEntry {
  id: string;
  event_id: string;
  camper_id: string;
  contact_id: string | null;
  camper_name?: string;
  contact_name?: string;
  event_name?: string;
  position: number;
  status: 'waiting' | 'offered' | 'accepted' | 'declined' | 'expired';
  priority: 'normal' | 'high' | 'vip';
  notes: string | null;
  offered_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// ─── Dashboard ───────────────────────────────────────────────

export interface RecentRegistration {
  id: string;
  camper_name: string;
  event_name: string;
  status: string;
  payment_status: string;
  created_at: string;
}

export interface DashboardStats {
  total_campers: number;
  total_events: number;
  upcoming_events: number;
  total_registrations: number;
  recent_registrations: RecentRegistration[];
}

// ─── Photos ─────────────────────────────────────────────────

export interface Photo {
  id: string;
  file_name: string;
  file_path: string;
  url: string;
  file_size: number;
  mime_type: string;
  caption: string | null;
  tags: string[] | null;
  category: 'camper' | 'event' | 'general';
  entity_id: string | null;
  event_id: string | null;
  activity_id: string | null;
  is_profile_photo: boolean;
  uploaded_by: string | null;
  created_at: string;
}

// ─── Communications ─────────────────────────────────────────

export interface Message {
  id: string;
  channel: 'sms' | 'email';
  direction: 'outbound' | 'inbound';
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
  from_address: string;
  to_address: string;
  subject: string | null;
  body: string;
  template_id: string | null;
  recipient_type: string | null;
  related_entity_type: string | null;
  external_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: 'sms' | 'email' | 'both';
  subject: string | null;
  body: string;
  html_body: string | null;
  category: string;
  variables: string[];
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

// ─── Staff Onboarding ──────────────────────────────────────

export interface StaffCertification {
  id: string;
  name: string;
  issuing_authority: string | null;
  certificate_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  status: 'valid' | 'expired' | 'pending_verification';
  created_at: string;
}

export interface StaffDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  notes: string | null;
  created_at: string;
}

export interface PolicyAcknowledgment {
  id: string;
  policy_name: string;
  policy_version: string | null;
  acknowledged_at: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface StaffOnboarding {
  id: string;
  user_id: string;
  organization_id: string;
  status: 'invited' | 'in_progress' | 'completed';
  current_step: number;
  personal_info_completed: boolean;
  emergency_contacts_completed: boolean;
  certifications_completed: boolean;
  policy_acknowledgments_completed: boolean;
  payroll_info_completed: boolean;
  emergency_contacts_data: EmergencyContact[] | null;
  completed_at: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  certifications: StaffCertification[];
  documents: StaffDocument[];
  acknowledgments: PolicyAcknowledgment[];
}

export interface OnboardingListResponse {
  items: StaffOnboarding[];
  total: number;
}

// ─── Staff Directory ────────────────────────────────────────

export interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  department: string | null;
  role_name: string | null;
  is_active: boolean;
  status: 'active' | 'inactive' | 'onboarding' | null;
  created_at: string;
}

export interface StaffProfile extends StaffMember {
  hire_date: string | null;
  certifications: StaffCertification[];
  emergency_contacts: EmergencyContact[];
  onboarding: StaffOnboarding | null;
  seasonal_access_start: string | null;
  seasonal_access_end: string | null;
}

export interface StaffListResponse {
  items: StaffMember[];
  total: number;
}

// ─── Face Recognition ───────────────────────────────────────

export interface FaceTag {
  id: string;
  photo_id: string;
  camper_id: string | null;
  camper_name: string | null;
  face_id: string | null;
  bounding_box: {
    Width: number;
    Height: number;
    Left: number;
    Top: number;
  } | null;
  confidence: number | null;
  similarity: number | null;
  created_at: string;
}

export interface PhotoFaceTagsResponse {
  photo_id: string;
  face_tags: FaceTag[];
}

export interface CamperPhotoMatch {
  photo_id: string;
  photo_url: string;
  file_name: string;
  similarity: number;
  confidence: number;
  created_at: string;
}

// ─── Activities ─────────────────────────────────────────────

export interface Activity {
  id: string;
  name: string;
  description: string | null;
  category: 'sports' | 'arts' | 'nature' | 'water' | 'education' | 'other';
  location: string | null;
  capacity: number | null;
  min_age: number | null;
  max_age: number | null;
  duration_minutes: number | null;
  staff_required: number;
  equipment_needed: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface ActivityCreate {
  name: string;
  description?: string;
  category?: string;
  location?: string;
  capacity?: number;
  min_age?: number;
  max_age?: number;
  duration_minutes?: number;
  staff_required?: number;
  equipment_needed?: string[];
  is_active?: boolean;
}

export interface ActivityUpdate extends Partial<ActivityCreate> {}

// ─── Bunks ──────────────────────────────────────────────────

export interface Bunk {
  id: string;
  name: string;
  capacity: number;
  gender_restriction: string | null;
  min_age: number | null;
  max_age: number | null;
  location: string | null;
  counselor_user_id: string | null;
  counselor_name: string | null;
  created_at: string;
}

export interface BunkAssignment {
  id: string;
  bunk_id: string;
  camper_id: string;
  event_id: string;
  bed_number: number | null;
  camper_name: string;
  camper_age: number | null;
  camper_gender: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface BunkCreate {
  name: string;
  capacity: number;
  gender_restriction?: string;
  min_age?: number | null;
  max_age?: number | null;
  location?: string;
  counselor_user_id?: string | null;
}

export interface BunkUpdate extends Partial<BunkCreate> {}

// ─── Families ───────────────────────────────────────────────

export interface Family {
  id: string;
  family_name: string;
  camper_count: number;
  contact_count: number;
  campers: FamilyMemberCamper[];
  contacts: FamilyMemberContact[];
  created_at: string;
}

export interface FamilyMemberCamper {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string | null;
}

export interface FamilyMemberContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  relationship_type: string;
  user_id: string | null;
}

export interface FamilyCreate {
  family_name: string;
}

export interface FamilyUpdate {
  family_name?: string;
}

// ─── Analytics ──────────────────────────────────────────────

export interface EnrollmentTrendItem {
  date: string;
  count: number;
}

export interface RevenuePeriodItem {
  period: string;
  total: number;
  paid: number;
  unpaid: number;
}

export interface EventCapacityItem {
  event_id: string;
  event_name: string;
  capacity: number;
  enrolled: number;
  fill_rate: number;
}

export interface RegistrationStatusBreakdown {
  status: string;
  count: number;
}

export interface CommunicationStatsItem {
  channel: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface DemographicItem {
  label: string;
  count: number;
}

// ─── Schedules ──────────────────────────────────────────────

export interface Schedule {
  id: string;
  organization_id: string;
  event_id: string;
  activity_id: string;
  activity_name?: string;
  activity_category?: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  staff_user_ids: string[] | null;
  max_capacity: number | null;
  notes: string | null;
  is_cancelled: boolean;
  assignments?: ScheduleAssignment[];
  created_at: string;
}

export interface ScheduleCreate {
  event_id: string;
  activity_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  staff_user_ids?: string[];
  max_capacity?: number;
  notes?: string;
}

export interface ScheduleUpdate extends Partial<Omit<ScheduleCreate, 'event_id'>> {}

export interface ScheduleAssignment {
  id: string;
  schedule_id: string;
  camper_id: string | null;
  bunk_id: string | null;
  assigned_by: string | null;
  camper_name?: string;
  bunk_name?: string;
  created_at: string;
}

export interface ScheduleAssignmentCreate {
  schedule_id: string;
  camper_id?: string;
  bunk_id?: string;
}

export interface DailyViewSlot {
  time: string;
  sessions: Schedule[];
}

// ─── Staff Schedule View ────────────────────────────────────

export interface StaffScheduleSession {
  schedule_id: string;
  activity_name: string;
  start_time: string;
  end_time: string;
  location: string | null;
}

export interface StaffScheduleEntry {
  user_id: string;
  first_name: string;
  last_name: string;
  sessions: StaffScheduleSession[];
}

// ─── Event Bunk Config ──────────────────────────────────────

export interface EventBunkConfig {
  id: string;
  event_id: string;
  bunk_id: string;
  bunk_name?: string;
  is_active: boolean;
  event_capacity: number | null;
  counselor_user_ids: string[] | null;
  notes: string | null;
  created_at: string;
}

export interface EventBunkConfigCreate {
  event_id: string;
  bunk_id: string;
  is_active?: boolean;
  event_capacity?: number;
  counselor_user_ids?: string[];
  notes?: string;
}

export interface EventBunkConfigUpdate {
  is_active?: boolean;
  event_capacity?: number;
  counselor_user_ids?: string[];
  notes?: string;
}

// ─── Payments & Invoices ────────────────────────────────────

export interface InvoiceLineItem {
  description: string;
  amount: number;
  quantity: number;
}

export interface Invoice {
  id: string;
  organization_id: string;
  family_id: string | null;
  contact_id: string | null;
  contact_name?: string;
  family_name?: string;
  registration_ids: string[] | null;
  line_items: InvoiceLineItem[] | null;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string | null;
  paid_at: string | null;
  stripe_invoice_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface InvoiceCreate {
  family_id?: string;
  contact_id?: string;
  registration_ids?: string[];
  line_items?: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  status?: string;
  due_date?: string;
  notes?: string;
}

export interface InvoiceUpdate extends Partial<InvoiceCreate> {}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  registration_id: string | null;
  contact_id: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  refund_amount: number | null;
  paid_at: string | null;
  created_at: string;
}

// ─── Notifications ──────────────────────────────────────────

export type NotificationTriggerType =
  | 'registration_confirmed'
  | 'health_form_reminder'
  | 'payment_received'
  | 'waitlist_promoted'
  | 'event_reminder';

export type NotificationChannel = 'email' | 'sms' | 'both';

export interface NotificationConfig {
  id: string;
  organization_id: string;
  trigger_type: NotificationTriggerType;
  channel: NotificationChannel;
  is_active: boolean;
  template_id: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationConfigCreate {
  trigger_type: NotificationTriggerType;
  channel: NotificationChannel;
  is_active?: boolean;
  template_id?: string;
  config?: Record<string, unknown>;
}

export interface NotificationConfigUpdate extends Partial<NotificationConfigCreate> {}

// ─── Store ──────────────────────────────────────────────────

export interface StoreItem {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  quantity_in_stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StoreItemCreate {
  name: string;
  description?: string;
  category?: string;
  price: number;
  quantity_in_stock?: number;
  image_url?: string;
  is_active?: boolean;
}

export interface StoreItemUpdate extends Partial<StoreItemCreate> {}

export interface SpendingAccount {
  id: string;
  organization_id: string;
  camper_id: string;
  camper_name?: string;
  balance: number;
  daily_limit: number | null;
  created_at: string;
}

export interface SpendingAccountUpdate {
  balance?: number;
  daily_limit?: number;
}

export interface StoreTransaction {
  id: string;
  organization_id: string;
  camper_id: string;
  item_id: string;
  camper_name?: string;
  item_name?: string;
  quantity: number;
  unit_price: number;
  total: number;
  transaction_date: string;
  recorded_by: string | null;
  created_at: string;
}

// ─── Portal ─────────────────────────────────────────────────

export interface PortalCamper {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string | null;
  upcoming_events: string[];
  balance_due: number;
}

export interface PortalInvoice extends Invoice {
  camper_names?: string[];
}


// ─── Deals / CRM Pipeline ─────────────────────────────────

export interface Deal {
  id: string;
  organization_id: string;
  contact_id: string | null;
  family_id: string | null;
  contact_name?: string;
  family_name?: string;
  title: string;
  description: string | null;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  priority: 'low' | 'medium' | 'high';
  source: string | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  assigned_to: string | null;
  assigned_to_name?: string;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DealCreate {
  title: string;
  contact_id?: string;
  family_id?: string;
  description?: string;
  value?: number;
  stage?: string;
  priority?: string;
  source?: string;
  expected_close_date?: string;
  assigned_to?: string;
  notes?: string;
}

export interface DealUpdate extends Partial<DealCreate> {
  actual_close_date?: string;
  position?: number;
}

export interface DealPipeline {
  stages: {
    stage: string;
    label: string;
    deals: Deal[];
    count: number;
    total_value: number;
  }[];
  total_deals: number;
  total_value: number;
}


// ─── Background Checks ──────────────────────────────────────
export interface BackgroundCheck {
  id: string;
  organization_id: string;
  staff_user_id: string;
  staff_name?: string;
  provider: string;
  external_id: string | null;
  package: 'basic' | 'standard' | 'professional';
  status: 'pending' | 'processing' | 'complete' | 'failed' | 'flagged';
  result: 'clear' | 'consider' | 'suspended' | null;
  report_url: string | null;
  details: Record<string, unknown> | null;
  initiated_by: string | null;
  completed_at: string | null;
  expires_at: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackgroundCheckCreate {
  staff_user_id: string;
  package?: string;
  notes?: string;
}

export interface BackgroundCheckUpdate {
  status?: string;
  result?: string;
  notes?: string;
  report_url?: string;
  details?: Record<string, unknown>;
  is_archived?: boolean;
}

export interface BackgroundCheckSettings {
  provider: string;
  api_key_configured: boolean;
  api_key_last4: string | null;
  webhook_url: string | null;
}


// ─── Job Listings / Staff Marketplace ────────────────────────
export interface JobListing {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
  employment_type: 'seasonal' | 'full_time' | 'part_time' | 'volunteer';
  pay_rate: number | null;
  pay_type: 'hourly' | 'weekly' | 'seasonal' | 'stipend';
  start_date: string | null;
  end_date: string | null;
  requirements: string[] | null;
  certifications_required: string[] | null;
  min_age: number | null;
  positions_available: number;
  positions_filled: number;
  status: 'draft' | 'published' | 'closed' | 'filled';
  is_featured: boolean;
  application_deadline: string | null;
  application_count?: number;
  created_at: string;
  updated_at: string;
}

export interface JobListingCreate {
  title: string;
  description?: string;
  department?: string;
  location?: string;
  employment_type?: string;
  pay_rate?: number;
  pay_type?: string;
  start_date?: string;
  end_date?: string;
  requirements?: string[];
  certifications_required?: string[];
  min_age?: number;
  positions_available?: number;
  is_featured?: boolean;
  application_deadline?: string;
}

export interface JobApplication {
  id: string;
  listing_id: string;
  listing_title?: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  experience_years: number | null;
  certifications: string[] | null;
  availability_start: string | null;
  availability_end: string | null;
  status: 'submitted' | 'reviewing' | 'interview' | 'offered' | 'hired' | 'rejected';
  notes: string | null;
  created_at: string;
}


// ─── Custom Fields ──────────────────────────────────────────

export interface CustomFieldDefinition {
  id: string;
  organization_id: string;
  entity_type: string;
  field_name: string;
  field_key: string;
  field_type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi_select' | 'url' | 'email' | 'phone';
  description: string | null;
  is_required: boolean;
  options: string[] | null;
  default_value: string | null;
  sort_order: number;
  is_active: boolean;
  show_in_list: boolean;
  show_in_detail: boolean;
  created_at: string;
}

export interface CustomFieldValue {
  id: string | null;
  field_definition_id: string;
  field_name?: string;
  field_key?: string;
  field_type?: string;
  description?: string | null;
  is_required?: boolean;
  options?: string[] | null;
  default_value?: string | null;
  show_in_list?: boolean;
  show_in_detail?: boolean;
  entity_id: string;
  entity_type: string;
  value: string | null;
}

export interface CustomFieldDefinitionCreate {
  entity_type: string;
  field_name: string;
  field_key: string;
  field_type: string;
  description?: string;
  is_required?: boolean;
  options?: string[];
  default_value?: string;
  show_in_list?: boolean;
  show_in_detail?: boolean;
}


// ─── Camp Directory ─────────────────────────────────────────

export interface CampProfile {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  camp_type: string[] | null;
  age_range_min: number | null;
  age_range_max: number | null;
  amenities: string[] | null;
  activities: string[] | null;
  accreditations: string[] | null;
  price_range_min: number | null;
  price_range_max: number | null;
  session_dates: { name: string; start: string; end: string; price: number }[] | null;
  social_links: { facebook?: string; instagram?: string; twitter?: string; youtube?: string } | null;
  is_published: boolean;
  is_featured: boolean;
  rating: number | null;
  review_count: number;
  created_at: string;
}

export interface CampProfileUpdate {
  name?: string;
  slug?: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  gallery_urls?: string[];
  website_url?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  camp_type?: string[];
  age_range_min?: number;
  age_range_max?: number;
  amenities?: string[];
  activities?: string[];
  accreditations?: string[];
  price_range_min?: number;
  price_range_max?: number;
  session_dates?: { name: string; start: string; end: string; price: number }[];
  social_links?: { facebook?: string; instagram?: string; twitter?: string; youtube?: string };
}

export interface DirectorySearchResult {
  items: CampProfile[];
  total: number;
  skip: number;
  limit: number;
}


// Schools
export interface School {
  id: string;
  name: string;
  nces_id: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  district: string | null;
  is_custom: boolean;
}


// Lead Enrichment
export interface LeadEnrichmentSettings { api_key_set: boolean; enabled: boolean; auto_enrich: boolean; provider: string; }
export interface EnrichedLead { name: string; email: string; phone: string | null; title: string; company: string; linkedin_url: string | null; location: string | null; }

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
  camper_name: string | null;
  contact_name: string | null;
  position: number;
  status: 'waiting' | 'offered' | 'expired' | 'enrolled';
  notified_at: string | null;
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
  issued_date: string | null;
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
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  department: string | null;
  role_name: string | null;
  is_active: boolean;
  onboarding_status: 'invited' | 'onboarding' | 'active' | null;
  created_at: string;
}

export interface StaffProfile extends StaffMember {
  certifications: StaffCertification[];
  onboarding: StaffOnboarding | null;
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

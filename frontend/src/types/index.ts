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

export interface DashboardStats {
  totalCampers: number;
  totalEvents: number;
  totalRevenue: number;
  capacityUtilization: number;
  upcomingEvents: number;
  pendingForms: number;
}

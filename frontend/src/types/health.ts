// ─── Health & Safety ────────────────────────────────────────

export interface FormFieldDefinition {
  id: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'radio'
    | 'section'
    | 'signature';
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: Record<string, unknown>;
  order: number;
  section?: string;
  conditional?: { field_id: string; value: string };
}

export interface HealthFormTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fields: FormFieldDefinition[];
  is_system: boolean;
  is_active: boolean;
  version: number;
  required_for_registration: boolean;
  created_at: string;
}

export interface HealthFormTemplateCreate {
  name: string;
  description?: string;
  category?: string;
  fields: FormFieldDefinition[];
  required_for_registration?: boolean;
}

export interface HealthFormTemplateUpdate {
  name?: string;
  description?: string;
  category?: string;
  fields?: FormFieldDefinition[];
  is_active?: boolean;
  required_for_registration?: boolean;
}

export interface HealthForm {
  id: string;
  template_id: string;
  template_name: string;
  template_category: string;
  camper_id: string;
  camper_name: string;
  event_id: string | null;
  event_name: string | null;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';
  due_date: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  fields?: FormFieldDefinition[];
}

export interface HealthFormAssign {
  template_id: string;
  camper_id: string;
  event_id?: string;
  due_date?: string;
}

export interface HealthFormSubmission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  signature: string | null;
  signed_at: string | null;
  created_at: string;
}

export interface HealthFormSubmit {
  data: Record<string, unknown>;
  signature?: string;
}

export interface HealthFormReview {
  status: 'approved' | 'rejected';
  review_notes?: string;
}

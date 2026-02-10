/**
 * Camp Connect - Workflow Automation React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Types ──────────────────────────────────────────────────

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'manual' | 'form_submitted'
  event_type?: string
  form_template_id?: string
  schedule?: string
  conditions?: Record<string, unknown>
}

export interface WorkflowStep {
  id: string
  type:
    | 'send_email'
    | 'send_sms'
    | 'delay'
    | 'if_else'
    | 'update_record'
    | 'create_task'
    | 'send_form'
    | 'add_tag'
    | 'webhook'
    | 'enroll_in_workflow'
  config: Record<string, unknown>
  delay?: string | null
  conditions?: Record<string, unknown> | null
}

export interface Workflow {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'paused' | 'archived'
  trigger: WorkflowTrigger
  steps: WorkflowStep[]
  enrollment_type: 'automatic' | 'manual'
  re_enrollment: boolean
  total_enrolled: number
  total_completed: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowListItem {
  id: string
  name: string
  description: string | null
  status: string
  trigger_type: string | null
  step_count: number
  total_enrolled: number
  total_completed: number
  created_at: string
}

export interface WorkflowCreate {
  name: string
  description?: string
  trigger?: WorkflowTrigger
  steps?: WorkflowStep[]
  enrollment_type?: string
  re_enrollment?: boolean
  status?: string
}

export interface WorkflowUpdate extends Partial<WorkflowCreate> {}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  workflow_name: string | null
  entity_type: string
  entity_id: string
  status: string
  current_step_id: string | null
  started_at: string
  next_step_at: string | null
  completed_at: string | null
  error_message: string | null
}

export interface WorkflowExecutionLog {
  id: string
  step_id: string
  step_type: string
  status: string
  input_data: Record<string, unknown> | null
  output_data: Record<string, unknown> | null
  error_message: string | null
  executed_at: string
  duration_ms: number | null
}

// ─── Contact Association Types ──────────────────────────────

export interface ContactAssociation {
  id: string
  contact_id: string
  related_contact_id: string
  relationship_type: string
  related_contact_name: string | null
  related_contact_email: string | null
  notes: string | null
  created_at: string
}

export interface ContactAssociationCreate {
  related_contact_id: string
  relationship_type: string
  notes?: string
}

// ─── Template Types ────────────────────────────────────────

export interface WorkflowTemplate {
  key: string
  name: string
  description: string
  category: string
  trigger: Record<string, unknown>
  steps: Record<string, unknown>[]
  step_count: number
}

// ─── Workflow Hooks ─────────────────────────────────────────

export function useWorkflows(filters?: { status?: string }) {
  return useQuery<WorkflowListItem[]>({
    queryKey: ['workflows', filters],
    queryFn: () =>
      api.get('/workflows', { params: filters }).then((r) => r.data),
  })
}

export function useWorkflow(id: string | undefined) {
  return useQuery<Workflow>({
    queryKey: ['workflows', id],
    queryFn: () => api.get(`/workflows/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WorkflowCreate) =>
      api.post('/workflows', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkflowUpdate }) =>
      api.put(`/workflows/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

// ─── Template Hooks ─────────────────────────────────────────

export function useWorkflowTemplates() {
  return useQuery<WorkflowTemplate[]>({
    queryKey: ['workflow-templates'],
    queryFn: () =>
      api.get('/workflows/templates').then((r) => r.data),
  })
}

export function useCreateFromTemplate() {
  const queryClient = useQueryClient()
  return useMutation<Workflow, Error, string>({
    mutationFn: (templateKey: string) =>
      api
        .post(`/workflows/from-template/${templateKey}`)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })
}

// ─── Execution Hooks ────────────────────────────────────────

export function useWorkflowExecutions(workflowId: string | undefined) {
  return useQuery<WorkflowExecution[]>({
    queryKey: ['workflow-executions', workflowId],
    queryFn: () =>
      api.get(`/workflows/${workflowId}/executions`).then((r) => r.data),
    enabled: !!workflowId,
  })
}

export function useWorkflowExecutionLogs(
  workflowId: string | undefined,
  executionId: string | undefined
) {
  return useQuery<WorkflowExecutionLog[]>({
    queryKey: ['workflow-execution-logs', executionId],
    queryFn: () =>
      api
        .get(`/workflows/${workflowId}/executions/${executionId}/logs`)
        .then((r) => r.data),
    enabled: !!workflowId && !!executionId,
  })
}

// ─── Contact Association Hooks ──────────────────────────────

export function useContactAssociations(contactId: string | undefined) {
  return useQuery<ContactAssociation[]>({
    queryKey: ['contact-associations', contactId],
    queryFn: () =>
      api.get(`/contacts/${contactId}/associations`).then((r) => r.data),
    enabled: !!contactId,
  })
}

export function useCreateContactAssociation(contactId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ContactAssociationCreate) =>
      api
        .post(`/contacts/${contactId}/associations`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['contact-associations', contactId],
      })
    },
  })
}

export function useDeleteContactAssociation(contactId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (associationId: string) =>
      api.delete(`/contacts/${contactId}/associations/${associationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['contact-associations', contactId],
      })
    },
  })
}

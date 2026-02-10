/**
 * Camp Connect - Workflow Editor Page
 * HubSpot-style visual workflow builder with trigger config,
 * step pipeline, and execution monitoring.
 */

import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  X,
  Zap,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  RefreshCw,
  Tag,
  Globe,
  ClipboardList,
  FileText,
  Play,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useWorkflow,
  useUpdateWorkflow,
  useWorkflowExecutions,
} from '@/hooks/useWorkflows'
import type {
  WorkflowTrigger,
  WorkflowStep,
  WorkflowUpdate,
} from '@/hooks/useWorkflows'
import { useToast } from '@/components/ui/Toast'
import { useFormTemplates } from '@/hooks/useForms'

// ─── Step Type Definitions ───────────────────────────────────

interface StepTypeConfig {
  type: string
  label: string
  icon: React.ElementType
  color: string
  description: string
}

const STEP_TYPES: StepTypeConfig[] = [
  {
    type: 'send_email',
    label: 'Send Email',
    icon: Mail,
    color: 'text-blue-500 bg-blue-50',
    description: 'Send an email to the enrolled contact',
  },
  {
    type: 'send_sms',
    label: 'Send SMS',
    icon: MessageSquare,
    color: 'text-green-500 bg-green-50',
    description: 'Send an SMS message',
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: Clock,
    color: 'text-amber-500 bg-amber-50',
    description: 'Wait for a specified duration',
  },
  {
    type: 'if_else',
    label: 'If/Else Branch',
    icon: GitBranch,
    color: 'text-purple-500 bg-purple-50',
    description: 'Branch based on conditions',
  },
  {
    type: 'update_record',
    label: 'Update Record',
    icon: RefreshCw,
    color: 'text-orange-500 bg-orange-50',
    description: 'Update a contact or camper record',
  },
  {
    type: 'create_task',
    label: 'Create Task',
    icon: ClipboardList,
    color: 'text-indigo-500 bg-indigo-50',
    description: 'Create a task for staff',
  },
  {
    type: 'send_form',
    label: 'Send Form',
    icon: FileText,
    color: 'text-teal-500 bg-teal-50',
    description: 'Send a form template to the contact',
  },
  {
    type: 'add_tag',
    label: 'Add Tag',
    icon: Tag,
    color: 'text-pink-500 bg-pink-50',
    description: 'Add a tag to the contact',
  },
  {
    type: 'webhook',
    label: 'Webhook',
    icon: Globe,
    color: 'text-gray-500 bg-gray-50',
    description: 'Call an external webhook URL',
  },
  {
    type: 'enroll_in_workflow',
    label: 'Enroll in Workflow',
    icon: Zap,
    color: 'text-yellow-500 bg-yellow-50',
    description: 'Enroll the contact in another workflow',
  },
]

function generateStepId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const TRIGGER_TYPES: { value: string; label: string; description: string }[] = [
  { value: 'manual', label: 'Manual Enrollment', description: 'Manually enroll contacts into this workflow' },
  { value: 'event', label: 'Event Triggered', description: 'Triggered when a specific event occurs (registration, form submission, etc.)' },
  { value: 'schedule', label: 'Scheduled', description: 'Run on a recurring schedule (daily, weekly, etc.)' },
  { value: 'form_submitted', label: 'Form Submission', description: 'Triggered when a specific form is submitted' },
]

// ─── Step Config Panel ───────────────────────────────────────

function StepConfigPanel({
  step,
  onUpdate,
  onClose,
}: {
  step: WorkflowStep
  onUpdate: (updates: Partial<WorkflowStep>) => void
  onClose: () => void
}) {
  const stepType = STEP_TYPES.find((st) => st.type === step.type)
  const { data: publishedForms = [] } = useFormTemplates({ status: 'published' })

  return (
    <div className="border-l border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {stepType?.label ?? step.type}
        </h3>
        <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {/* Delay config */}
        {step.type === 'delay' && (
          <div>
            <label className="block text-xs font-medium text-gray-600">Delay Duration</label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                min="1"
                value={(step.config.amount as number) || 1}
                onChange={(e) =>
                  onUpdate({
                    config: { ...step.config, amount: parseInt(e.target.value) || 1 },
                  })
                }
                className="w-20 rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
              <select
                value={(step.config.unit as string) || 'hours'}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, unit: e.target.value } })
                }
                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          </div>
        )}

        {/* Email config */}
        {step.type === 'send_email' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600">Subject</label>
              <input
                type="text"
                value={(step.config.subject as string) || ''}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, subject: e.target.value } })
                }
                placeholder="Email subject line"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Body</label>
              <textarea
                value={(step.config.body as string) || ''}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, body: e.target.value } })
                }
                placeholder="Email body content..."
                rows={5}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {/* SMS config */}
        {step.type === 'send_sms' && (
          <div>
            <label className="block text-xs font-medium text-gray-600">Message</label>
            <textarea
              value={(step.config.message as string) || ''}
              onChange={(e) =>
                onUpdate({ config: { ...step.config, message: e.target.value } })
              }
              placeholder="SMS message text..."
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">
              {((step.config.message as string) || '').length}/160 characters
            </p>
          </div>
        )}

        {/* If/Else config */}
        {step.type === 'if_else' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600">Condition Field</label>
              <input
                type="text"
                value={(step.config.field as string) || ''}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, field: e.target.value } })
                }
                placeholder="e.g. contact.email, camper.age"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Operator</label>
              <select
                value={(step.config.operator as string) || 'equals'}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, operator: e.target.value } })
                }
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="is_set">Is Set</option>
                <option value="is_not_set">Is Not Set</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Value</label>
              <input
                type="text"
                value={(step.config.value as string) || ''}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, value: e.target.value } })
                }
                placeholder="Comparison value"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {/* Tag config */}
        {step.type === 'add_tag' && (
          <div>
            <label className="block text-xs font-medium text-gray-600">Tag Name</label>
            <input
              type="text"
              value={(step.config.tag as string) || ''}
              onChange={(e) =>
                onUpdate({ config: { ...step.config, tag: e.target.value } })
              }
              placeholder="e.g. first-time-camper, vip"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Webhook config */}
        {step.type === 'webhook' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600">URL</label>
              <input
                type="url"
                value={(step.config.url as string) || ''}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, url: e.target.value } })
                }
                placeholder="https://..."
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Method</label>
              <select
                value={(step.config.method as string) || 'POST'}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, method: e.target.value } })
                }
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
          </>
        )}

        {/* Create Task config */}
        {step.type === 'create_task' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600">Task Title</label>
              <input
                type="text"
                value={(step.config.title as string) || ''}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, title: e.target.value } })
                }
                placeholder="Follow up with contact"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Due In (Days)</label>
              <input
                type="number"
                min="0"
                value={(step.config.due_days as number) || 1}
                onChange={(e) =>
                  onUpdate({
                    config: { ...step.config, due_days: parseInt(e.target.value) || 1 },
                  })
                }
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {/* Update Record config */}
        {step.type === 'update_record' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600">Field to Update</label>
              <input
                type="text"
                value={(step.config.field as string) || ''}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, field: e.target.value } })
                }
                placeholder="e.g. status, tags"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">New Value</label>
              <input
                type="text"
                value={(step.config.value as string) || ''}
                onChange={(e) =>
                  onUpdate({ config: { ...step.config, value: e.target.value } })
                }
                placeholder="New field value"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {/* Send Form config */}
        {step.type === 'send_form' && (
          <div>
            <label className="block text-xs font-medium text-gray-600">Form Template</label>
            <select
              value={(step.config.template_id as string) || ''}
              onChange={(e) =>
                onUpdate({ config: { ...step.config, template_id: e.target.value } })
              }
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select a form...</option>
              {publishedForms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              The form will be sent to the enrolled contact.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Workflow Editor ────────────────────────────────────

export function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const { data: workflow, isLoading, error } = useWorkflow(id)
  const updateWorkflow = useUpdateWorkflow()
  const { data: executions = [] } = useWorkflowExecutions(id)
  const { data: publishedForms = [] } = useFormTemplates({ status: 'published' })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<string>('draft')
  const [trigger, setTrigger] = useState<WorkflowTrigger>({ type: 'manual' })
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [enrollmentType, setEnrollmentType] = useState<string>('automatic')
  const [reEnrollment, setReEnrollment] = useState(false)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [showAddStep, setShowAddStep] = useState(false)
  const [activeTab, setActiveTab] = useState<'builder' | 'executions'>('builder')
  const [initialized, setInitialized] = useState(false)

  // Initialize from loaded workflow
  if (workflow && !initialized) {
    setName(workflow.name)
    setDescription(workflow.description || '')
    setStatus(workflow.status)
    setTrigger(workflow.trigger || { type: 'manual' })
    setSteps(workflow.steps || [])
    setEnrollmentType(workflow.enrollment_type)
    setReEnrollment(workflow.re_enrollment)
    setInitialized(true)
  }

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null

  const addStep = useCallback(
    (typeConfig: StepTypeConfig) => {
      const newStep: WorkflowStep = {
        id: generateStepId(),
        type: typeConfig.type as WorkflowStep['type'],
        config: {},
        delay: null,
        conditions: null,
      }
      setSteps((prev) => [...prev, newStep])
      setShowAddStep(false)
      setSelectedStepId(newStep.id)
    },
    []
  )

  const updateStep = useCallback(
    (stepId: string, updates: Partial<WorkflowStep>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
      )
    },
    []
  )

  const deleteStep = useCallback(
    (stepId: string) => {
      setSteps((prev) => prev.filter((s) => s.id !== stepId))
      if (selectedStepId === stepId) setSelectedStepId(null)
    },
    [selectedStepId]
  )

  const handleSave = async () => {
    if (!id) return
    try {
      const data: WorkflowUpdate = {
        name,
        description: description || undefined,
        trigger,
        steps,
        enrollment_type: enrollmentType,
        re_enrollment: reEnrollment,
        status,
      }
      await updateWorkflow.mutateAsync({ id, data })
      toast({ type: 'success', message: 'Workflow saved' })
    } catch {
      toast({ type: 'error', message: 'Failed to save workflow' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/workflows"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workflows
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load workflow. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/app/workflows"
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-0 bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
            placeholder="Workflow Name"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('builder')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium',
                activeTab === 'builder'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Builder
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium',
                activeTab === 'executions'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Executions ({executions.length})
            </button>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={handleSave}
            disabled={updateWorkflow.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {updateWorkflow.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Settings */}
          <div className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Trigger
            </h3>
            <div className="mt-3 space-y-2">
              {TRIGGER_TYPES.map((tt) => (
                <button
                  key={tt.value}
                  onClick={() => setTrigger({ ...trigger, type: tt.value as WorkflowTrigger['type'] })}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-all',
                    trigger.type === tt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <span className="text-sm font-medium text-gray-900">{tt.label}</span>
                  <p className="mt-0.5 text-xs text-gray-500">{tt.description}</p>
                </button>
              ))}
            </div>

            {/* Event type for event trigger */}
            {trigger.type === 'event' && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600">Event Type</label>
                <select
                  value={trigger.event_type || ''}
                  onChange={(e) => setTrigger({ ...trigger, event_type: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Select event...</option>
                  <option value="contact_created">Contact Created</option>
                  <option value="registration_created">Registration Created</option>
                  <option value="registration_confirmed">Registration Confirmed</option>
                  <option value="payment_received">Payment Received</option>
                  <option value="form_submitted">Form Submitted</option>
                  <option value="camper_checked_in">Camper Checked In</option>
                </select>
              </div>
            )}

            {/* Schedule for schedule trigger */}
            {trigger.type === 'schedule' && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600">Schedule (Cron)</label>
                <input
                  type="text"
                  value={trigger.schedule || ''}
                  onChange={(e) => setTrigger({ ...trigger, schedule: e.target.value })}
                  placeholder="0 9 * * 1 (Mon 9am)"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">Standard cron expression</p>
              </div>
            )}

            {/* Form ID for form_submitted trigger */}
            {trigger.type === 'form_submitted' && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600">Form Template</label>
                <select
                  value={trigger.form_template_id || ''}
                  onChange={(e) => setTrigger({ ...trigger, form_template_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Select a form...</option>
                  {publishedForms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.category})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Workflow triggers when this form is submitted.
                </p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Enrollment Settings
              </h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Enrollment Type</label>
                  <select
                    value={enrollmentType}
                    onChange={(e) => setEnrollmentType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Allow Re-enrollment</label>
                  <button
                    onClick={() => setReEnrollment(!reEnrollment)}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                      reEnrollment ? 'bg-blue-600' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                        reEnrollment ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this workflow..."
                rows={3}
                className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Center: Step Pipeline */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
            <div className="mx-auto max-w-lg">
              {/* Trigger node */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <div>
                    <span className="text-sm font-semibold text-amber-800">
                      {TRIGGER_TYPES.find((tt) => tt.value === trigger.type)?.label ?? 'Trigger'}
                    </span>
                    {trigger.type === 'event' && trigger.event_type && (
                      <p className="text-xs text-amber-600">{trigger.event_type}</p>
                    )}
                    {trigger.type === 'form_submitted' && trigger.form_template_id && (
                      <p className="text-xs text-amber-600">
                        {publishedForms.find((f) => f.id === trigger.form_template_id)?.name || 'Selected form'}
                      </p>
                    )}
                  </div>
                </div>
                {steps.length > 0 && (
                  <div className="flex h-8 items-center">
                    <ArrowDown className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Steps */}
              {steps.map((step, index) => {
                const stepType = STEP_TYPES.find((st) => st.type === step.type)
                const Icon = stepType?.icon ?? Zap
                const isSelected = selectedStepId === step.id

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      onClick={() => setSelectedStepId(step.id)}
                      className={cn(
                        'group relative w-full max-w-md cursor-pointer rounded-xl border-2 bg-white p-4 shadow-sm transition-all',
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            stepType?.color ?? 'bg-gray-50 text-gray-500'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {stepType?.label ?? step.type}
                          </span>
                          <p className="text-xs text-gray-500">
                            {step.type === 'send_email' && (step.config.subject as string)
                              ? (step.config.subject as string)
                              : step.type === 'delay'
                                ? `Wait ${(step.config.amount as number) || '?'} ${(step.config.unit as string) || 'hours'}`
                                : step.type === 'add_tag'
                                  ? (step.config.tag as string) || 'Configure tag...'
                                  : step.type === 'send_form' && (step.config.template_id as string)
                                    ? publishedForms.find((f) => f.id === step.config.template_id)?.name || 'Selected form'
                                    : stepType?.description}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteStep(step.id)
                          }}
                          className="rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex h-8 items-center">
                        <ArrowDown className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add Step Button */}
              <div className="flex flex-col items-center">
                {steps.length > 0 && (
                  <div className="flex h-8 items-center">
                    <ArrowDown className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                {showAddStep ? (
                  <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">Add Step</h4>
                      <button
                        onClick={() => setShowAddStep(false)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {STEP_TYPES.map((st) => {
                        const Icon = st.icon
                        return (
                          <button
                            key={st.type}
                            onClick={() => addStep(st)}
                            className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-200"
                          >
                            <Icon
                              className={cn('h-4 w-4 shrink-0', st.color.split(' ')[0])}
                            />
                            <span className="truncate">{st.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddStep(true)}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
                  >
                    <Plus className="h-4 w-4" />
                    Add Step
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Step Config */}
          {selectedStep && (
            <div className="w-72 shrink-0 overflow-y-auto">
              <StepConfigPanel
                step={selectedStep}
                onUpdate={(updates) => updateStep(selectedStep.id, updates)}
                onClose={() => setSelectedStepId(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* Executions / Enrollments Tab */}
      {activeTab === 'executions' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            {/* Stats Cards */}
            {executions.length > 0 && (
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500">Total Enrolled</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{executions.length}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500">Running</p>
                  <p className="mt-1 text-2xl font-semibold text-blue-600">
                    {executions.filter((e) => e.status === 'running').length}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500">Completed</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-600">
                    {executions.filter((e) => e.status === 'completed').length}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500">Failed</p>
                  <p className="mt-1 text-2xl font-semibold text-red-600">
                    {executions.filter((e) => e.status === 'failed').length}
                  </p>
                </div>
              </div>
            )}

            {executions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
                <Play className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-900">No enrollments yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Activate this workflow and enroll contacts to see enrollments here.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        <th className="px-6 py-3">Entity</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="hidden px-6 py-3 sm:table-cell">Current Step</th>
                        <th className="hidden px-6 py-3 md:table-cell">Started</th>
                        <th className="hidden px-6 py-3 lg:table-cell">Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {executions.map((exec) => (
                        <tr key={exec.id} className="transition-colors hover:bg-gray-50/80">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {exec.entity_name ?? exec.entity_id.slice(0, 8) + '...'}
                              </p>
                              {exec.entity_email && (
                                <p className="text-xs text-gray-500">{exec.entity_email}</p>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20 capitalize">
                              {exec.entity_type}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {exec.status === 'completed' ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : exec.status === 'failed' ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              ) : exec.status === 'paused' ? (
                                <Clock className="h-4 w-4 text-amber-500" />
                              ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              )}
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize',
                                  exec.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                    : exec.status === 'failed'
                                      ? 'bg-red-50 text-red-700 ring-red-600/20'
                                      : exec.status === 'paused'
                                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                                        : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                )}
                              >
                                {exec.status}
                              </span>
                            </div>
                            {exec.error_message && (
                              <p className="mt-1 max-w-xs truncate text-xs text-red-500" title={exec.error_message}>
                                {exec.error_message}
                              </p>
                            )}
                          </td>
                          <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 sm:table-cell">
                            {exec.current_step_id
                              ? steps.find((s) => s.id === exec.current_step_id)
                                ? STEP_TYPES.find((st) => st.type === steps.find((s) => s.id === exec.current_step_id)?.type)?.label ?? exec.current_step_id
                                : exec.current_step_id
                              : exec.status === 'completed'
                                ? '✓ Done'
                                : '--'}
                          </td>
                          <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                            {new Date(exec.started_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 lg:table-cell">
                            {exec.completed_at
                              ? new Date(exec.completed_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

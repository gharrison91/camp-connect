/**
 * Camp Connect - PortalForms
 * Form assignments list for parent portal with inline form completion.
 */

import { useState } from 'react'
import {
  ClipboardList, CheckCircle2, Clock, AlertTriangle,
  Loader2, X, ChevronRight, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePortalForms, usePortalCampers, useSubmitPortalForm } from '@/hooks/usePortal'
import { useToast } from '@/components/ui/Toast'
import type { PortalFormAssignmentItem } from '@/hooks/usePortal'

function getStatusConfig(status: string) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', iconColor: 'text-emerald-500' }
    case 'overdue':
      return { label: 'Overdue', icon: AlertTriangle, badge: 'bg-red-50 text-red-700 ring-red-600/20', iconColor: 'text-red-500' }
    default:
      return { label: 'Pending', icon: Clock, badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', iconColor: 'text-amber-500' }
  }
}

function FormFieldRenderer({ field, value, onChange }: { field: any; value: any; onChange: (val: any) => void }) {
  const cls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'
  switch (field.type) {
    case 'heading': return <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
    case 'paragraph': return <p className="text-sm text-gray-600">{field.label}</p>
    case 'divider': return <hr className="border-gray-200" />
    case 'textarea':
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <textarea value={value || ''} onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''} required={field.required} rows={4} className={cls} />
        </div>
      )
    case 'select':
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <select value={value || ''} onChange={(e) => onChange(e.target.value)}
            required={field.required} className={cls}>
            <option value="">Select...</option>
            {(field.options || []).map((opt: any) => (
              <option key={opt.value || opt.label} value={opt.value || opt.label}>{opt.label}</option>
            ))}
          </select>
        </div>
      )
    case 'checkbox':
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="space-y-2">
            {(field.options || []).map((opt: any) => {
              const ov = opt.value || opt.label
              const ck = Array.isArray(value) ? value.includes(ov) : false
              return (
                <label key={ov} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={ck}
                    onChange={(e) => {
                      const a = Array.isArray(value) ? [...value] : []
                      if (e.target.checked) a.push(ov)
                      else { const i = a.indexOf(ov); if (i > -1) a.splice(i, 1) }
                      onChange(a)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  {opt.label}
                </label>
              )
            })}
          </div>
        </div>
      )
    case 'radio':
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="space-y-2">
            {(field.options || []).map((opt: any) => {
              const ov = opt.value || opt.label
              return (
                <label key={ov} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="radio" name={field.id} checked={value === ov}
                    onChange={() => onChange(ov)}
                    className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  {opt.label}
                </label>
              )
            })}
          </div>
        </div>
      )
    case 'date':
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)}
            required={field.required} className={cls} />
        </div>
      )
    case 'number':
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <input type="number" value={value || ''} onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''} required={field.required} className={cls} />
        </div>
      )
    default:
      return (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}{field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <input type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            value={value || ''} onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''} required={field.required} className={cls} />
        </div>
      )
  }
}

function FormModal({ form, onClose }: { form: PortalFormAssignmentItem; onClose: () => void }) {
  const { toast } = useToast()
  const submitForm = useSubmitPortalForm()
  const [answers, setAnswers] = useState<Record<string, any>>({})

  function updateAnswer(fieldId: string, value: any) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const reqFields = (form.fields || []).filter(
      (f: any) => f.required && !['heading', 'paragraph', 'divider'].includes(f.type)
    )
    const missing = reqFields.filter((f: any) => {
      const v = answers[f.id]
      if (v === undefined || v === null || v === '') return true
      if (Array.isArray(v) && v.length === 0) return true
      return false
    })
    if (missing.length > 0) {
      toast({ type: 'warning', message: 'Please fill required fields: ' + missing.map((f: any) => f.label).join(', ') })
      return
    }
    try {
      await submitForm.mutateAsync({ templateId: form.template_id, answers })
      toast({ type: 'success', message: 'Form submitted successfully!' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to submit form. Please try again.' })
    }
  }

  const renderableFields = (form.fields || []).filter(
    (f: any) => f.type !== 'custom_html' && f.type !== 'file' && f.type !== 'signature'
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{form.form_name}</h2>
            {form.description && (
              <p className="mt-0.5 text-sm text-gray-500">{form.description}</p>
            )}
          </div>
          <button onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {renderableFields.map((field: any) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(val) => updateAnswer(field.id, val)}
            />
          ))}

          {/* Submit */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitForm.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
              {submitForm.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function PortalForms() {
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCamperId, setSelectedCamperId] = useState('')
  const [activeForm, setActiveForm] = useState<PortalFormAssignmentItem | null>(null)

  const { data: campers = [] } = usePortalCampers()
  const { data: formData, isLoading } = usePortalForms({
    camper_id: selectedCamperId || undefined,
    status_filter: statusFilter || undefined,
  })

  const forms = formData?.items ?? []

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Forms</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          value={selectedCamperId}
          onChange={(e) => setSelectedCamperId(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"
        >
          <option value="">All Campers</option>
          {campers.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Form list */}
      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <ClipboardList className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No forms assigned</p>
          <p className="mt-1 text-sm text-gray-500">
            Form assignments from your camp will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => {
            const sc = getStatusConfig(form.status)
            const StatusIcon = sc.icon
            return (
              <div
                key={form.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50', sc.iconColor)}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{form.form_name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ring-1 ring-inset',
                        sc.badge
                      )}>
                        {sc.label}
                      </span>
                      {form.camper_name && <span>{form.camper_name}</span>}
                      {form.due_date && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>Due {new Date(form.due_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {form.status !== 'completed' ? (
                  <button
                    onClick={() => setActiveForm(form)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                  >
                    Fill Out
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Submitted {form.submitted_at ? new Date(form.submitted_at).toLocaleDateString() : ''}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Form modal */}
      {activeForm && (
        <FormModal form={activeForm} onClose={() => setActiveForm(null)} />
      )}
    </div>
  )
}

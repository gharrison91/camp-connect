import { useState } from 'react'
import {
  X,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import {
  useHealthForm,
  useHealthFormSubmission,
  useSubmitHealthForm,
  useReviewHealthForm,
} from '@/hooks/useHealthForms'
import type { HealthForm, FormFieldDefinition } from '@/types/health'

interface Props {
  form: HealthForm
  onClose: () => void
}

export function HealthFormViewModal({ form, onClose }: Props) {
  const { data: fullForm } = useHealthForm(form.id)
  const { data: submission } = useHealthFormSubmission(
    form.status !== 'pending' ? form.id : undefined
  )
  const { hasPermission } = usePermissions()

  const fields = fullForm?.fields || []
  const isPending = form.status === 'pending'
  const canReview =
    form.status === 'submitted' && hasPermission('health.forms.manage')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {form.template_name}
            </h2>
            <p className="text-sm text-gray-500">
              {form.camper_name}
              {form.event_name && ` - ${form.event_name}`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {isPending ? (
            <FormFiller
              fields={fields}
              formId={form.id}
              onClose={onClose}
            />
          ) : (
            <FormViewer
              fields={fields}
              data={submission?.data || {}}
              signature={submission?.signature}
            />
          )}
        </div>

        {/* Review Actions */}
        {canReview && (
          <ReviewActions formId={form.id} onClose={onClose} />
        )}
      </div>
    </div>
  )
}

// ─── Form Filler (for pending forms) ─────────────────────────

function FormFiller({
  fields,
  formId,
  onClose,
}: {
  fields: FormFieldDefinition[]
  formId: string
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [signature, setSignature] = useState('')
  const submitForm = useSubmitHealthForm()

  const updateValue = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async () => {
    await submitForm.mutateAsync({
      id: formId,
      data: {
        data: formData,
        signature: signature || undefined,
      },
    })
    onClose()
  }

  return (
    <div className="space-y-4">
      {fields
        .sort((a, b) => a.order - b.order)
        .map((field) => {
          // Check conditional visibility
          if (field.conditional) {
            const depValue = formData[field.conditional.field_id]
            if (String(depValue).toLowerCase() !== field.conditional.value.toLowerCase()) {
              return null
            }
          }

          if (field.type === 'section') {
            return (
              <div key={field.id} className="pt-4">
                <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-800">
                  {field.label}
                </h3>
              </div>
            )
          }

          return (
            <FieldInput
              key={field.id}
              field={field}
              value={formData[field.id]}
              onChange={(val) => updateValue(field.id, val)}
            />
          )
        })}

      {/* Signature */}
      {fields.some((f) => f.type === 'signature') && (
        <div className="pt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Signature (type your full name) *
          </label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full legal name"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm italic focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={submitForm.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitForm.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Form
        </button>
      </div>
    </div>
  )
}

// ─── Field Input Component ───────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormFieldDefinition
  value: unknown
  onChange: (val: unknown) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      {field.description && (
        <p className="mb-1 text-xs text-gray-400">{field.description}</p>
      )}

      {field.type === 'text' && (
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          value={(value as number) || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      )}

      {field.type === 'date' && (
        <input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      )}

      {field.type === 'select' && (
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="space-y-1">
          {field.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name={field.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          {field.label}
        </label>
      )}

      {field.type === 'multiselect' && (
        <div className="space-y-1">
          {field.options?.map((opt) => {
            const selected = Array.isArray(value) ? (value as string[]).includes(opt) : false
            return (
              <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? (value as string[]) : []
                    if (e.target.checked) {
                      onChange([...current, opt])
                    } else {
                      onChange(current.filter((v) => v !== opt))
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                {opt}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Form Viewer (read-only) ─────────────────────────────────

function FormViewer({
  fields,
  data,
  signature,
}: {
  fields: FormFieldDefinition[]
  data: Record<string, unknown>
  signature?: string | null
}) {
  return (
    <div className="space-y-3">
      {fields
        .sort((a, b) => a.order - b.order)
        .map((field) => {
          if (field.type === 'section') {
            return (
              <div key={field.id} className="pt-3">
                <h3 className="border-b border-gray-200 pb-1 text-sm font-semibold text-gray-800">
                  {field.label}
                </h3>
              </div>
            )
          }

          const val = data[field.id]
          const displayValue = Array.isArray(val)
            ? (val as string[]).join(', ')
            : val === true
            ? 'Yes'
            : val === false
            ? 'No'
            : String(val || '-')

          return (
            <div key={field.id} className="flex items-start justify-between">
              <span className="text-sm text-gray-500">{field.label}</span>
              <span className="text-sm font-medium text-gray-900">{displayValue}</span>
            </div>
          )
        })}

      {signature && (
        <div className="border-t border-gray-200 pt-3">
          <span className="text-sm text-gray-500">Signature:</span>
          <p className="mt-1 text-sm font-medium italic text-gray-900">{signature}</p>
        </div>
      )}
    </div>
  )
}

// ─── Review Actions ──────────────────────────────────────────

function ReviewActions({
  formId,
  onClose,
}: {
  formId: string
  onClose: () => void
}) {
  const [notes, setNotes] = useState('')
  const reviewForm = useReviewHealthForm()

  const handleReview = async (status: 'approved' | 'rejected') => {
    await reviewForm.mutateAsync({
      id: formId,
      data: { status, review_notes: notes || undefined },
    })
    onClose()
  }

  return (
    <div className="border-t border-gray-100 px-6 py-4">
      <div className="mb-3">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Review Notes (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={() => handleReview('rejected')}
          disabled={reviewForm.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>
        <button
          onClick={() => handleReview('approved')}
          disabled={reviewForm.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {reviewForm.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Approve
        </button>
      </div>
    </div>
  )
}

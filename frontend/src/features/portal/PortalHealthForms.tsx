/**
 * Camp Connect - PortalHealthForms
 * List and submit health forms for parent portal.
 */

import { useState } from 'react'
import { Heart, Loader2, CheckCircle } from 'lucide-react'
import { useSubmitHealthForm } from '@/hooks/usePortal'
import { useToast } from '@/components/ui/Toast'

interface PortalHealthFormsProps {
  forms: any[]
}

export function PortalHealthForms({ forms }: PortalHealthFormsProps) {
  const { toast } = useToast()
  const submitForm = useSubmitHealthForm()
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set())

  async function handleSubmit(formId: string) {
    try {
      await submitForm.mutateAsync({ healthFormId: formId, formData: { completed: true } })
      setSubmittedIds((prev) => new Set(prev).add(formId))
      toast({ type: 'success', message: 'Health form submitted!' })
    } catch {
      toast({ type: 'error', message: 'Failed to submit form.' })
    }
  }

  if (!forms || forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
        <Heart className="h-8 w-8 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-900">No health forms</p>
        <p className="mt-1 text-sm text-gray-500">All forms are up to date.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {forms.map((form: any) => (
        <div
          key={form.id}
          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              {form.template_name || 'Health Form'}
            </h4>
            <p className="mt-0.5 text-xs text-gray-500">
              Status: {form.status || 'pending'}
              {form.due_date && ` | Due: ${form.due_date}`}
            </p>
          </div>
          {submittedIds.has(form.id) || form.status === 'submitted' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              Submitted
            </span>
          ) : (
            <button
              onClick={() => handleSubmit(form.id)}
              disabled={submitForm.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitForm.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Submit
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

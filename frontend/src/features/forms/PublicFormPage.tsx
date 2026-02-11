/**
 * Camp Connect - Public Form Renderer
 * Standalone page (no app chrome/sidebar) that renders a form
 * fetched from the public API for external embedding.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
  description?: string
}

interface PublicFormData {
  id: string
  name: string
  description: string | null
  fields: FormField[]
  settings?: {
    submit_button_text?: string
    success_message?: string
    brand_color?: string
  }
}

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<PublicFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string | boolean | string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { url: string; file_name: string }>>({})

  // Fetch form definition
  useEffect(() => {
    async function fetchForm() {
      try {
        const res = await api.get(`/forms/public/${id}`)
        setForm(res.data)
        // Initialize default values
        const defaults: Record<string, string | boolean | string[]> = {}
        for (const field of res.data.fields || []) {
          if (field.type === 'checkbox' || field.type === 'toggle') {
            defaults[field.id] = false
          } else {
            defaults[field.id] = ''
          }
        }
        setValues(defaults)
      } catch {
        setError('This form is not available or has been unpublished.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchForm()
  }, [id])

  function handleChange(fieldId: string, value: string | boolean) {
    setValues(prev => ({ ...prev, [fieldId]: value }))
    // Clear error on change
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  async function handleFileUpload(fieldId: string, file: File) {
    setUploadingFiles(prev => ({ ...prev, [fieldId]: true }))
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/forms/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadedFiles(prev => ({ ...prev, [fieldId]: res.data }))
      setValues(prev => ({ ...prev, [fieldId]: res.data.url }))
    } catch {
      setFieldErrors(prev => ({ ...prev, [fieldId]: 'Failed to upload file. Please try again.' }))
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldId]: false }))
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}
    for (const field of form?.fields || []) {
      if (field.required) {
        const val = values[field.id]
        if (val === '' || val === undefined || val === null) {
          errors[field.id] = `${field.label} is required`
        }
      }
      if (field.type === 'email' && values[field.id]) {
        const emailVal = String(values[field.id])
        if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
          errors[field.id] = 'Please enter a valid email address'
        }
      }
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await api.post(`/forms/public/${id}/submit`, { answers: values })
      setSubmitted(true)
    } catch {
      setError('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // Error state
  if (error && !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Form Unavailable</h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            {form?.settings?.success_message || 'Form Submitted Successfully!'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Thank you for your submission. We&apos;ll be in touch soon.
          </p>
        </div>
        <div className="fixed bottom-4 left-0 right-0 text-center">
          <a
            href="https://camp-connect.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Powered by Camp Connect
          </a>
        </div>
      </div>
    )
  }

  // Form renderer
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8">
          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{form?.name}</h1>
            {form?.description && (
              <p className="mt-2 text-sm text-gray-500">{form.description}</p>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {form?.fields?.map((field) => (
              <div key={field.id}>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </label>
                {field.description && (
                  <p className="mb-1.5 text-xs text-gray-500">{field.description}</p>
                )}

                {/* Text input */}
                {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number') && (
                  <input
                    type={field.type === 'phone' ? 'tel' : field.type}
                    value={String(values[field.id] || '')}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1',
                      fieldErrors[field.id]
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                    )}
                  />
                )}

                {/* Textarea */}
                {field.type === 'textarea' && (
                  <textarea
                    value={String(values[field.id] || '')}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1',
                      fieldErrors[field.id]
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                    )}
                  />
                )}

                {/* Date */}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={String(values[field.id] || '')}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1',
                      fieldErrors[field.id]
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                    )}
                  />
                )}

                {/* Select */}
                {field.type === 'select' && (
                  <select
                    value={String(values[field.id] || '')}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1',
                      fieldErrors[field.id]
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                    )}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {/* Radio */}
                {field.type === 'radio' && (
                  <div className="space-y-2">
                    {field.options?.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name={field.id}
                          value={opt}
                          checked={values[field.id] === opt}
                          onChange={() => handleChange(field.id, opt)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(values[field.id])}
                      onChange={(e) => handleChange(field.id, e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    {field.placeholder || 'Yes'}
                  </label>
                )}

                {/* Toggle */}
                {field.type === 'toggle' && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(values[field.id])}
                    onClick={() => handleChange(field.id, !values[field.id])}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                      values[field.id] ? 'bg-emerald-500' : 'bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                      values[field.id] ? 'translate-x-5' : 'translate-x-0'
                    )} />
                  </button>
                )}

                {/* File Upload */}
                {field.type === 'file' && (
                  <div>
                    {uploadedFiles[field.id] ? (
                      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm text-emerald-800">{uploadedFiles[field.id].file_name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFiles(prev => {
                              const next = { ...prev }
                              delete next[field.id]
                              return next
                            })
                            setValues(prev => ({ ...prev, [field.id]: '' }))
                          }}
                          className="ml-auto text-xs text-emerald-600 hover:text-emerald-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className={cn(
                        'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors hover:bg-gray-50',
                        fieldErrors[field.id] ? 'border-red-300' : 'border-gray-200'
                      )}>
                        {uploadingFiles[field.id] ? (
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                        ) : (
                          <Upload className="h-6 w-6 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-500">
                          {uploadingFiles[field.id] ? 'Uploading...' : 'Click or drag to upload'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(field.id, file)
                          }}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* Field Error */}
                {fieldErrors[field.id] && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors[field.id]}</p>
                )}
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  form?.settings?.submit_button_text || 'Submit'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Powered by footer */}
        <div className="mt-6 text-center">
          <a
            href="https://camp-connect.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Powered by Camp Connect
          </a>
        </div>
      </div>
    </div>
  )
}

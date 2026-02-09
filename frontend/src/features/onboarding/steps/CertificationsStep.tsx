/**
 * Camp Connect - Certifications Step
 * Step 3 of the onboarding wizard.
 */

import { useState } from 'react'
import { Plus, Trash2, Award, Loader2 } from 'lucide-react'
import { useAddCertification, useDeleteCertification } from '@/hooks/useOnboarding'
import type { OnboardingRecord, CertificationPayload } from '@/hooks/useOnboarding'

interface CertificationsStepProps {
  onboarding: OnboardingRecord
  onNext: () => void
}

const EMPTY_CERT: CertificationPayload = {
  name: '',
  issuing_authority: '',
  certificate_number: '',
  issue_date: '',
  expiry_date: '',
}

export function CertificationsStep({ onboarding, onNext }: CertificationsStepProps) {
  const addCertification = useAddCertification()
  const deleteCertification = useDeleteCertification()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CertificationPayload>({ ...EMPTY_CERT })

  const certifications = onboarding.certifications ?? []

  async function handleAddCert(e: React.FormEvent) {
    e.preventDefault()
    await addCertification.mutateAsync(formData)
    setFormData({ ...EMPTY_CERT })
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    await deleteCertification.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Certifications</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add any relevant certifications you hold (e.g., CPR, First Aid, Lifeguard).
          You may skip this step if you have none.
        </p>
      </div>

      {/* Current Certifications */}
      {certifications.length > 0 ? (
        <div className="space-y-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-500">
                    {cert.issuing_authority}
                    {cert.expiry_date && (
                      <span className="ml-2">
                        Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(cert.id)}
                disabled={deleteCertification.isPending}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-8">
          <Award className="h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No certifications added yet.</p>
        </div>
      )}

      {/* Add Certification Form */}
      {showForm ? (
        <form
          onSubmit={handleAddCert}
          className="rounded-lg border border-blue-100 bg-blue-50/30 p-4 space-y-4"
        >
          <h3 className="text-sm font-medium text-gray-900">Add Certification</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Certification Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="CPR Certification"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Issuing Authority
              </label>
              <input
                type="text"
                required
                value={formData.issuing_authority}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, issuing_authority: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="American Red Cross"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Certificate Number
              </label>
              <input
                type="text"
                value={formData.certificate_number ?? ''}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, certificate_number: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Issue Date
              </label>
              <input
                type="date"
                required
                value={formData.issue_date}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, issue_date: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date ?? ''}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, expiry_date: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {addCertification.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to add certification. Please try again.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={addCertification.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {addCertification.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Add Certification
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setFormData({ ...EMPTY_CERT })
              }}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
        >
          <Plus className="h-4 w-4" />
          Add Certification
        </button>
      )}

      {/* Mark step complete */}
      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Mark Step Complete & Continue
        </button>
      </div>
    </div>
  )
}

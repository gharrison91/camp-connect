/**
 * Camp Connect - Certifications Settings Page
 * Manage organization-level certification types (CPR, First Aid, etc.)
 */

import { useState } from 'react'
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useCertificationTypes,
  useCreateCertificationType,
  useUpdateCertificationType,
  useDeleteCertificationType,
} from '@/hooks/useCertifications'
import type { CertificationType, CertificationTypeCreate } from '@/hooks/useCertifications'
import { useToast } from '@/components/ui/Toast'

// ─── Modal ──────────────────────────────────────────────────

function CertificationTypeModal({
  certType,
  onClose,
}: {
  certType: CertificationType | null // null = create mode
  onClose: () => void
}) {
  const [name, setName] = useState(certType?.name ?? '')
  const [description, setDescription] = useState(certType?.description ?? '')
  const [isRequired, setIsRequired] = useState(certType?.is_required ?? false)
  const [expiryDays, setExpiryDays] = useState<string>(
    certType?.expiry_days != null ? String(certType.expiry_days) : ''
  )

  const createMutation = useCreateCertificationType()
  const updateMutation = useUpdateCertificationType()
  const { toast } = useToast()

  const isEdit = certType !== null
  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const data: CertificationTypeCreate = {
      name: name.trim(),
      description: description.trim() || undefined,
      is_required: isRequired,
      expiry_days: expiryDays ? parseInt(expiryDays, 10) : undefined,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: certType.id, data })
        toast({ type: 'success', message: 'Certification type updated!' })
      } else {
        await createMutation.mutateAsync(data)
        toast({ type: 'success', message: 'Certification type created!' })
      }
      onClose()
    } catch {
      toast({ type: 'error', message: `Failed to ${isEdit ? 'update' : 'create'} certification type.` })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Certification Type' : 'New Certification Type'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CPR Certification"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of this certification"
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Required toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Required for all staff</p>
              <p className="text-xs text-gray-500">Staff must obtain this certification</p>
            </div>
            <button
              type="button"
              onClick={() => setIsRequired(!isRequired)}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                isRequired ? 'bg-blue-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  isRequired ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Expiry Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Expiry Period (days)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="e.g. 365"
                min="1"
                className="w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-gray-500">
                {expiryDays
                  ? `Expires ${parseInt(expiryDays, 10) >= 365 ? `${Math.round(parseInt(expiryDays, 10) / 365)} year(s)` : `${expiryDays} days`} after issue`
                  : 'Leave empty for no expiration'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ──────────────────────────────

function DeleteConfirmModal({
  certTypeName,
  onConfirm,
  onClose,
  isPending,
}: {
  certTypeName: string
  onConfirm: () => void
  onClose: () => void
  isPending: boolean
}) {
  const [confirmText, setConfirmText] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Delete Certification Type</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Are you sure you want to delete <strong>{certTypeName}</strong>? Any staff certification records of this type will lose their type reference.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'DELETE' || isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────

export function CertificationsSettingsPage() {
  const { data: certTypes = [], isLoading } = useCertificationTypes()
  const deleteMutation = useDeleteCertificationType()
  const { toast } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editingCertType, setEditingCertType] = useState<CertificationType | null>(null)
  const [deletingCertType, setDeletingCertType] = useState<CertificationType | null>(null)

  const handleEdit = (certType: CertificationType) => {
    setEditingCertType(certType)
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditingCertType(null)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deletingCertType) return
    try {
      await deleteMutation.mutateAsync(deletingCertType.id)
      toast({ type: 'success', message: 'Certification type deleted!' })
      setDeletingCertType(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete certification type.' })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Certification Types</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Define the certifications your organization tracks for staff members.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Certification
        </button>
      </div>

      {/* Certification Types List */}
      {certTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
          <Award className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No certification types</p>
          <p className="mt-1 text-sm text-gray-500">Create your first certification type to get started.</p>
          <button
            onClick={handleCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add Certification
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Certification</th>
                <th className="hidden px-6 py-3 sm:table-cell">Required</th>
                <th className="hidden px-6 py-3 md:table-cell">Expiry</th>
                <th className="hidden px-6 py-3 lg:table-cell">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {certTypes.map((ct) => (
                <tr key={ct.id} className="transition-colors hover:bg-gray-50/80">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <Award className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ct.name}</p>
                        {ct.description && (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{ct.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                    {ct.is_required ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        <Shield className="h-3 w-3" />
                        Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 md:table-cell">
                    {ct.expiry_days ? (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {ct.expiry_days >= 365
                          ? `${Math.round(ct.expiry_days / 365)} year${Math.round(ct.expiry_days / 365) !== 1 ? 's' : ''}`
                          : `${ct.expiry_days} days`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        No expiry
                      </span>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 lg:table-cell">
                    {new Date(ct.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(ct)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCertType(ct)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Certification Type Modal */}
      {showModal && (
        <CertificationTypeModal
          certType={editingCertType}
          onClose={() => {
            setShowModal(false)
            setEditingCertType(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCertType && (
        <DeleteConfirmModal
          certTypeName={deletingCertType.name}
          onConfirm={handleDelete}
          onClose={() => setDeletingCertType(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

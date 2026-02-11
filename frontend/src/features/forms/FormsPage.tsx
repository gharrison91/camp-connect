/**
 * Camp Connect - Form Builder List Page
 * Lists all form templates with category sub-tabs, filtering, creation,
 * trash/recycle bin, and safe delete confirmation (type DELETE to confirm).
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  FileText,
  Copy,
  Trash2,
  Loader2,
  PenTool,
  MoreHorizontal,
  Eye,
  Edit,
  ClipboardList,
  AlertTriangle,
  X,
  RotateCcw,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useFormTemplates,
  useDuplicateFormTemplate,
  useDeleteFormTemplate,
  useTrashedForms,
  useRestoreFormTemplate,
  usePermanentDeleteFormTemplate,
} from '@/hooks/useForms'
import { useToast } from '@/components/ui/Toast'
import { useOrgSettings } from '@/hooks/useOrganization'

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  },
  published: {
    label: 'Published',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-50 text-gray-500 ring-gray-400/20',
  },
}

// Default form categories (used if org has none configured)
const DEFAULT_CATEGORIES = [
  { key: 'registration', label: 'Registration' },
  { key: 'health', label: 'Health & Safety' },
  { key: 'consent', label: 'Consent' },
  { key: 'hr', label: 'HR' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'application', label: 'Application' },
  { key: 'other', label: 'Other' },
]

// --- Delete Confirmation Modal ---

function DeleteConfirmModal({
  formName,
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
  permanent,
}: {
  formName: string
  isOpen: boolean
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
  permanent?: boolean
}) {
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (isOpen) setConfirmText('')
  }, [isOpen])

  if (!isOpen) return null

  const canConfirm = confirmText === 'DELETE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {permanent ? 'Permanently Delete Form' : 'Delete Form'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {permanent ? (
                <>
                  This will <span className="font-semibold text-red-600">permanently delete</span>{' '}
                  <span className="font-semibold text-gray-900">{formName}</span>{' '}
                  and all of its submissions. This action cannot be undone.
                </>
              ) : (
                <>
                  This will move{' '}
                  <span className="font-semibold text-gray-900">{formName}</span>{' '}
                  to the trash. You can restore it within 30 days.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700">
            Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE here"
            autoFocus
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isDeleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? 'Deleting...' : permanent ? 'Delete Permanently' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Trash days remaining helper ---
function daysUntilPermanentDelete(deletedAt: string): number {
  const deleted = new Date(deletedAt)
  const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000)
  const now = new Date()
  return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

// --- Main Component ---

export function FormsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
    permanent?: boolean
  } | null>(null)

  // Category from URL params or default to 'all'
  const categoryFilter = searchParams.get('category') || 'all'
  const setCategoryFilter = (cat: string) => {
    if (cat === 'all') {
      searchParams.delete('category')
    } else {
      searchParams.set('category', cat)
    }
    setSearchParams(searchParams, { replace: true })
  }

  // Fetch org settings for custom form categories
  const { data: orgSettings } = useOrgSettings()
  const rawCategories = (orgSettings?.settings as Record<string, unknown>)?.form_categories
  const formCategories: { key: string; label: string }[] =
    Array.isArray(rawCategories) && rawCategories.length > 0
      ? (rawCategories as { key: string; label: string }[])
      : DEFAULT_CATEGORIES

  const isTrashView = statusFilter === 'trash'

  const {
    data: templates = [],
    isLoading,
    error,
  } = useFormTemplates({
    status: statusFilter !== 'all' && statusFilter !== 'trash' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  })

  const {
    data: trashedTemplates = [],
    isLoading: isLoadingTrash,
    error: trashError,
  } = useTrashedForms()

  const duplicateTemplate = useDuplicateFormTemplate()
  const deleteTemplate = useDeleteFormTemplate()
  const restoreTemplate = useRestoreFormTemplate()
  const permanentDeleteTemplate = usePermanentDeleteFormTemplate()

  const displayedTemplates = isTrashView ? trashedTemplates : templates
  const filteredTemplates = displayedTemplates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentLoading = isTrashView ? isLoadingTrash : isLoading
  const currentError = isTrashView ? trashError : error

  // Issue 1 fix: just navigate to the editor with `new` id - no API call
  const handleCreate = () => {
    navigate('/app/forms/new')
  }

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateTemplate.mutateAsync(id)
      toast({ type: 'success', message: 'Form duplicated' })
      setOpenMenuId(null)
    } catch {
      toast({ type: 'error', message: 'Failed to duplicate form' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.permanent) {
        await permanentDeleteTemplate.mutateAsync(deleteTarget.id)
        toast({ type: 'success', message: 'Form permanently deleted' })
      } else {
        await deleteTemplate.mutateAsync(deleteTarget.id)
        toast({ type: 'success', message: 'Form moved to trash' })
      }
      setDeleteTarget(null)
      setOpenMenuId(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete form' })
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreTemplate.mutateAsync(id)
      toast({ type: 'success', message: 'Form restored' })
      setOpenMenuId(null)
    } catch {
      toast({ type: 'error', message: 'Failed to restore form' })
    }
  }

  // Build category label lookup
  const categoryLabels: Record<string, string> = Object.fromEntries(
    formCategories.map((c) => [c.key, c.label])
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Form Builder
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage custom forms with drag-and-drop fields, e-signatures, and more.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New Form
        </button>
      </div>

      {/* Category Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        <button
          onClick={() => setCategoryFilter('all')}
          className={cn(
            'shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
            categoryFilter === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          )}
        >
          All
        </button>
        {formCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
              categoryFilter === cat.key
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
          <option value="trash">Trash</option>
        </select>
      </div>

      {/* Trash banner */}
      {isTrashView && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Trash2 className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Trash
            </p>
            <p className="text-xs text-amber-600">
              Items in the trash are automatically permanently deleted after 30 days.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {currentLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {currentError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load forms. Please try again.
        </div>
      )}

      {/* Forms Grid */}
      {!currentLoading && !currentError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const status = statusConfig[template.status] ?? statusConfig.draft
            const isTrashed = isTrashView

            return (
              <div
                key={template.id}
                className={cn(
                  'group relative rounded-xl border bg-white shadow-sm transition-all hover:shadow-md',
                  isTrashed
                    ? 'border-gray-200 opacity-75 hover:opacity-100'
                    : 'border-gray-100 hover:border-gray-200'
                )}
              >
                <div className="p-5">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => !isTrashed && navigate(`/app/forms/${template.id}`)}
                    >
                      <h3 className={cn(
                        'text-base font-semibold',
                        isTrashed
                          ? 'text-gray-500'
                          : 'text-gray-900 group-hover:text-blue-600'
                      )}>
                        {template.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isTrashed && (
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      )}
                      {/* Actions menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === template.id ? null : template.id
                            )
                          }
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenuId === template.id && (
                          <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            {isTrashed ? (
                              <>
                                <button
                                  onClick={() => handleRestore(template.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Restore
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({
                                      id: template.id,
                                      name: template.name,
                                      permanent: true,
                                    })
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete Permanently
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    navigate(`/app/forms/${template.id}`)
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDuplicate(template.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Duplicate
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({
                                      id: template.id,
                                      name: template.name,
                                    })
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* Trash info */}
                  {isTrashed && template.deleted_at && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                      <Clock className="h-3.5 w-3.5" />
                      {daysUntilPermanentDelete(template.deleted_at)} days until permanent deletion
                    </div>
                  )}

                  {/* Meta */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" />
                      {template.field_count} field{template.field_count !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {template.submission_count} submission{template.submission_count !== 1 ? 's' : ''}
                    </span>
                    {template.require_signature && (
                      <span className="inline-flex items-center gap-1 text-amber-500">
                        <PenTool className="h-3.5 w-3.5" />
                        E-Sign
                      </span>
                    )}
                  </div>

                  {/* Category + Date */}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {categoryLabels[template.category] ?? template.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(template.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!currentLoading && !currentError && filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          {isTrashView ? (
            <>
              <Trash2 className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                Trash is empty
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Deleted forms will appear here for 30 days before being permanently removed.
              </p>
            </>
          ) : (
            <>
              <FileText className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                No forms found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first form to get started.'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        formName={deleteTarget?.name ?? ''}
        isOpen={deleteTarget !== null}
        isDeleting={deleteTemplate.isPending || permanentDeleteTemplate.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        permanent={deleteTarget?.permanent}
      />
    </div>
  )
}

/**
 * Camp Connect - Form Builder List Page
 * Lists all form templates with filtering and creation.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useFormTemplates,
  useCreateFormTemplate,
  useDuplicateFormTemplate,
  useDeleteFormTemplate,
} from '@/hooks/useForms'
import { useToast } from '@/components/ui/Toast'

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

const categoryLabels: Record<string, string> = {
  registration: 'Registration',
  health: 'Health & Safety',
  consent: 'Consent',
  feedback: 'Feedback',
  application: 'Application',
  other: 'Other',
}

export function FormsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const {
    data: templates = [],
    isLoading,
    error,
  } = useFormTemplates({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  })

  const createTemplate = useCreateFormTemplate()
  const duplicateTemplate = useDuplicateFormTemplate()
  const deleteTemplate = useDeleteFormTemplate()

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = async () => {
    try {
      const result = await createTemplate.mutateAsync({
        name: 'Untitled Form',
        description: '',
        category: 'other',
        status: 'draft',
        fields: [],
      })
      navigate(`/app/forms/${result.id}`)
    } catch {
      toast({ type: 'error', message: 'Failed to create form' })
    }
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

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id)
      toast({ type: 'success', message: 'Form deleted' })
      setOpenMenuId(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete form' })
    }
  }

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
          disabled={createTemplate.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New Form
        </button>
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
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="registration">Registration</option>
          <option value="health">Health & Safety</option>
          <option value="consent">Consent</option>
          <option value="feedback">Feedback</option>
          <option value="application">Application</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load forms. Please try again.
        </div>
      )}

      {/* Forms Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const status = statusConfig[template.status] ?? statusConfig.draft

            return (
              <div
                key={template.id}
                className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
              >
                <div className="p-5">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/app/forms/${template.id}`)}
                    >
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                        {template.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
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
                          <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
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
                              onClick={() => handleDelete(template.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
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
      {!isLoading && !error && filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <FileText className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No forms found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first form to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}

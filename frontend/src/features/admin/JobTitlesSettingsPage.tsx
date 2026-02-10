/**
 * Camp Connect - Job Titles Settings Page
 * Manage custom job titles for staff members.
 */

import { useState } from 'react'
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Users,
} from 'lucide-react'
import {
  useJobTitles,
  useCreateJobTitle,
  useUpdateJobTitle,
  useDeleteJobTitle,
} from '@/hooks/useStaff'
import type { JobTitle } from '@/hooks/useStaff'
import { useToast } from '@/components/ui/Toast'

export function JobTitlesSettingsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<JobTitle | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { data: titles = [], isLoading } = useJobTitles()
  const createTitle = useCreateJobTitle()
  const updateTitle = useUpdateJobTitle()
  const deleteTitle = useDeleteJobTitle()
  const { toast } = useToast()

  const handleDelete = async (id: string) => {
    try {
      await deleteTitle.mutateAsync(id)
      toast({ type: 'success', message: 'Job title deleted' })
      setDeletingId(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete job title' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Job Titles</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create custom job titles to classify your staff members.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add Job Title
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {!isLoading && titles.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16">
          <Briefcase className="h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-900">
            No job titles yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Create job titles like "Head Counselor", "Lifeguard", etc.
          </p>
        </div>
      )}

      {!isLoading && titles.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                  Staff
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {titles.map((title) => (
                <tr key={title.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {title.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {title.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" /> {title.staff_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!title.is_system && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(title)
                            setShowForm(true)
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(title.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {title.is_system && (
                      <span className="text-xs text-slate-400">System</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <JobTitleFormModal
          existing={editing}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSave={async (name, description) => {
            try {
              if (editing) {
                await updateTitle.mutateAsync({
                  id: editing.id,
                  data: { name, description },
                })
                toast({ type: 'success', message: 'Job title updated' })
              } else {
                await createTitle.mutateAsync({ name, description })
                toast({ type: 'success', message: 'Job title created' })
              }
              setShowForm(false)
              setEditing(null)
            } catch {
              toast({
                type: 'error',
                message: `Failed to ${editing ? 'update' : 'create'} job title`,
              })
            }
          }}
          isPending={createTitle.isPending || updateTitle.isPending}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Delete Job Title
                </h3>
                <p className="text-xs text-slate-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Staff members with this title will have it unset. Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteTitle.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTitle.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Form Modal ---

function JobTitleFormModal({
  existing,
  onClose,
  onSave,
  isPending,
}: {
  existing: JobTitle | null
  onClose: () => void
  onSave: (name: string, description: string | null) => Promise<void>
  isPending: boolean
}) {
  const [name, setName] = useState(existing?.name || '')
  const [description, setDescription] = useState(existing?.description || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {existing ? 'Edit' : 'Add'} Job Title
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Title Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Head Counselor, Lifeguard"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description of this role..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name, description || null)}
            disabled={!name.trim() || isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {existing ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

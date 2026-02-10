/**
 * Camp Connect - Saved Lists / Custom Segments Page
 * Browse, create, and manage saved lists of contacts and campers.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ListChecks,
  Plus,
  Loader2,
  Users,
  Filter,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useSavedLists,
  useCreateSavedList,
  useDeleteSavedList,
} from '@/hooks/useLists'
import { useToast } from '@/components/ui/Toast'

export function ListsPage() {
  const { toast } = useToast()
  const { data: lists = [], isLoading } = useSavedLists()
  const createList = useCreateSavedList()
  const deleteList = useDeleteSavedList()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newListType, setNewListType] = useState<'static' | 'dynamic'>('static')
  const [newEntityType, setNewEntityType] = useState('contact')
  const [search, setSearch] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await createList.mutateAsync({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        list_type: newListType,
        entity_type: newEntityType,
      })
      toast({ type: 'success', message: 'List created!' })
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
    } catch {
      toast({ type: 'error', message: 'Failed to create list' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== 'DELETE') return
    try {
      await deleteList.mutateAsync(deleteTarget.id)
      toast({ type: 'success', message: 'List deleted' })
      setDeleteTarget(null)
      setDeleteConfirm('')
    } catch {
      toast({ type: 'error', message: 'Failed to delete list' })
    }
  }

  const filteredLists = lists.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Lists</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create saved segments of contacts and campers for retargeting and communications.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New List
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search lists..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Create New List</h3>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. 2026 Unpaid Campers"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description..."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">List Type</label>
              <select
                value={newListType}
                onChange={(e) => setNewListType(e.target.value as 'static' | 'dynamic')}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="static">Static (Manual Members)</option>
                <option value="dynamic">Dynamic (Filter-based)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Entity Type</label>
              <select
                value={newEntityType}
                onChange={(e) => setNewEntityType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="contact">Contacts</option>
                <option value="camper">Campers</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || createList.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {createList.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create List
          </button>
        </div>
      )}

      {/* Lists Grid */}
      {filteredLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <ListChecks className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No lists yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first saved list to segment contacts and campers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLists.map((list) => (
            <div
              key={list.id}
              className="group relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
            >
              <Link
                to={`/app/lists/${list.id}`}
                className="absolute inset-0 z-10"
              />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      list.list_type === 'dynamic'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-blue-50 text-blue-600'
                    )}
                  >
                    {list.list_type === 'dynamic' ? (
                      <Filter className="h-5 w-5" />
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{list.name}</h3>
                    {list.description && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                        {list.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDeleteTarget({ id: list.id, name: list.name })
                  }}
                  className="relative z-20 rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize',
                    list.list_type === 'dynamic'
                      ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
                      : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                  )}
                >
                  {list.list_type}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20 capitalize">
                  {list.entity_type}s
                </span>
                <span className="text-xs text-gray-500">
                  {list.member_count} member{list.member_count !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Updated {new Date(list.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete List</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This
              action cannot be undone. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteTarget(null)
                  setDeleteConfirm('')
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== 'DELETE' || deleteList.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteList.isPending ? 'Deleting...' : 'Delete List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

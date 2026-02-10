/**
 * Camp Connect - List Detail Page
 * View and manage members of a saved list.
 */

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  Users,
  Plus,
  Trash2,
  Filter,
  X,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useSavedList,
  useAddListMember,
  useRemoveListMember,
  useUpdateSavedList,
} from '@/hooks/useLists'
import { useToast } from '@/components/ui/Toast'

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const { data: list, isLoading, error } = useSavedList(id)
  const addMember = useAddListMember()
  const removeMember = useRemoveListMember()
  const updateList = useUpdateSavedList()

  const [showAddMember, setShowAddMember] = useState(false)
  const [newEntityId, setNewEntityId] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const handleAddMember = async () => {
    if (!id || !newEntityId.trim()) return
    try {
      await addMember.mutateAsync({
        listId: id,
        data: {
          entity_type: list?.entity_type || 'contact',
          entity_id: newEntityId.trim(),
        },
      })
      toast({ type: 'success', message: 'Member added!' })
      setNewEntityId('')
      setShowAddMember(false)
    } catch {
      toast({ type: 'error', message: 'Failed to add member' })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return
    try {
      await removeMember.mutateAsync({ listId: id, memberId })
      toast({ type: 'success', message: 'Member removed' })
    } catch {
      toast({ type: 'error', message: 'Failed to remove member' })
    }
  }

  const handleUpdateName = async () => {
    if (!id || !editName.trim()) return
    try {
      await updateList.mutateAsync({
        id,
        data: { name: editName.trim(), description: editDescription.trim() || undefined },
      })
      toast({ type: 'success', message: 'List updated' })
      setEditingName(false)
    } catch {
      toast({ type: 'error', message: 'Failed to update list' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/lists"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lists
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load list. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <Link
        to="/app/lists"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Lists
      </Link>

      <div className="flex items-start justify-between">
        <div>
          {editingName ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-2xl font-semibold text-gray-900 border-b-2 border-blue-500 outline-none"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description..."
                className="block text-sm text-gray-500 border-b border-gray-300 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateName}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1
                onClick={() => {
                  setEditName(list.name)
                  setEditDescription(list.description || '')
                  setEditingName(true)
                }}
                className="cursor-pointer text-2xl font-semibold tracking-tight text-gray-900 hover:text-blue-600"
              >
                {list.name}
              </h1>
              {list.description && (
                <p className="mt-1 text-sm text-gray-500">{list.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize',
                    list.list_type === 'dynamic'
                      ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
                      : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                  )}
                >
                  {list.list_type === 'dynamic' ? (
                    <Filter className="mr-1 h-3 w-3" />
                  ) : (
                    <Users className="mr-1 h-3 w-3" />
                  )}
                  {list.list_type}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20 capitalize">
                  {list.entity_type}s
                </span>
                <span className="text-sm text-gray-500">
                  {list.member_count} member{list.member_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {list.list_type === 'static' && (
          <button
            onClick={() => setShowAddMember(!showAddMember)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {showAddMember ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Member
              </>
            )}
          </button>
        )}
      </div>

      {/* Add Member Form */}
      {showAddMember && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600">
                {list.entity_type === 'contact' ? 'Contact' : 'Camper'} ID
              </label>
              <input
                type="text"
                value={newEntityId}
                onChange={(e) => setNewEntityId(e.target.value)}
                placeholder={`Paste ${list.entity_type} ID...`}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAddMember}
              disabled={!newEntityId.trim() || addMember.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </button>
          </div>
        </div>
      )}

      {/* Dynamic List Filter Display */}
      {list.list_type === 'dynamic' && list.filter_criteria && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-purple-900">Filter Criteria</h3>
          </div>
          <pre className="text-xs text-purple-800 bg-white rounded-lg p-3 border border-purple-100 overflow-x-auto">
            {JSON.stringify(list.filter_criteria, null, 2)}
          </pre>
        </div>
      )}

      {/* Members Table */}
      {list.members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Users className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No members yet</p>
          <p className="mt-1 text-sm text-gray-500">
            {list.list_type === 'static'
              ? 'Add members manually to this list.'
              : 'Configure filter criteria to populate this list.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="hidden px-6 py-3 sm:table-cell">Email</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="hidden px-6 py-3 md:table-cell">Added</th>
                  {list.list_type === 'static' && <th className="px-6 py-3 w-12"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.members.map((member) => (
                  <tr key={member.id} className="group transition-colors hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">
                          {(member.entity_name ?? '??')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {member.entity_name ?? member.entity_id.slice(0, 8) + '...'}
                        </span>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 sm:table-cell">
                      {member.entity_email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {member.entity_email}
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20 capitalize">
                        {member.entity_type}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-600 md:table-cell">
                      {new Date(member.added_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    {list.list_type === 'static' && (
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="rounded p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

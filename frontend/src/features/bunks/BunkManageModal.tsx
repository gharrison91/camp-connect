/**
 * Camp Connect - BunkManageModal
 * CRUD modal for managing cabins and bunk/room definitions (not assignments).
 * Two tabs: Cabins and Bunks. Bunks can be assigned to a cabin.
 */

import { useState } from 'react'
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  BedDouble,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useBunks,
  useCreateBunk,
  useUpdateBunk,
  useDeleteBunk,
} from '@/hooks/useBunks'
import type { Bunk, BunkCreate } from '@/hooks/useBunks'
import {
  useCabins,
  useCreateCabin,
  useUpdateCabin,
  useDeleteCabin,
} from '@/hooks/useCabins'
import type { Cabin, CabinCreate } from '@/hooks/useCabins'
import { useToast } from '@/components/ui/Toast'
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal'

interface BunkManageModalProps {
  onClose: () => void
}

type ModalTab = 'bunks' | 'cabins'

const emptyBunkForm: BunkCreate = {
  name: '',
  capacity: 8,
  gender_restriction: 'all',
  min_age: null,
  max_age: null,
  location: '',
  counselor_user_id: null,
  cabin_id: null,
}

const emptyCabinForm: CabinCreate = {
  name: '',
  description: '',
  location: '',
  total_capacity: 0,
  gender_restriction: 'all',
  is_active: true,
}

export function BunkManageModal({ onClose }: BunkManageModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('cabins')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Manage Cabins & Bunks
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100 px-6 pt-2">
          <button
            onClick={() => setActiveTab('cabins')}
            className={cn(
              'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'cabins'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Building2 className="mr-1.5 inline h-4 w-4" />
            Cabins
          </button>
          <button
            onClick={() => setActiveTab('bunks')}
            className={cn(
              'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'bunks'
                ? 'border-b-2 border-blue-600 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <BedDouble className="mr-1.5 inline h-4 w-4" />
            Bunks
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'cabins' && <CabinTab />}
          {activeTab === 'bunks' && <BunkTab />}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- CabinTab ----

function CabinTab() {
  const { data: cabins = [], isLoading } = useCabins(true)
  const createCabin = useCreateCabin()
  const updateCabin = useUpdateCabin()
  const deleteCabin = useDeleteCabin()
  const { toast } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CabinCreate>({ ...emptyCabinForm })
  const [deletingCabin, setDeletingCabin] = useState<Cabin | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyCabinForm })
    setShowForm(true)
  }

  function openEdit(cabin: Cabin) {
    setEditingId(cabin.id)
    setForm({
      name: cabin.name,
      description: cabin.description ?? '',
      location: cabin.location ?? '',
      total_capacity: cabin.total_capacity,
      gender_restriction: cabin.gender_restriction,
      is_active: cabin.is_active,
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyCabinForm })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: CabinCreate = {
      ...form,
      description: form.description || undefined,
      location: form.location || undefined,
    }
    try {
      if (editingId) {
        await updateCabin.mutateAsync({ id: editingId, data: payload })
        toast({ type: 'success', message: 'Cabin updated successfully!' })
      } else {
        await createCabin.mutateAsync(payload)
        toast({ type: 'success', message: 'Cabin created successfully!' })
      }
      cancelForm()
    } catch {
      toast({
        type: 'error',
        message: editingId ? 'Failed to update cabin.' : 'Failed to create cabin.',
      })
    }
  }

  async function handleDelete() {
    if (!deletingCabin) return
    try {
      await deleteCabin.mutateAsync(deletingCabin.id)
      toast({ type: 'success', message: 'Cabin deleted.' })
      setDeletingCabin(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete cabin.' })
    }
  }

  const isSaving = createCabin.isPending || updateCabin.isPending

  return (
    <>
      {/* Add button */}
      {!showForm && (
        <button
          onClick={openCreate}
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add Cabin
        </button>
      )}

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4"
        >
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            {editingId ? 'Edit Cabin' : 'New Cabin'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Eagle Lodge, Lakeside Cabin"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Total Capacity
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.total_capacity ?? 0}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      total_capacity: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Gender Restriction
                </label>
                <select
                  value={form.gender_restriction ?? 'all'}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gender_restriction: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={form.location ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g., North Field, Waterfront"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Cabin'}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Cabin list */}
      {!isLoading && cabins.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-10">
          <Building2 className="h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            No cabins yet. Click &quot;Add Cabin&quot; to create one.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {cabins.map((cabin) => (
          <div
            key={cabin.id}
            className={cn(
              'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
              editingId === cabin.id
                ? 'border-emerald-200 bg-emerald-50/30'
                : 'border-gray-100 bg-white hover:border-gray-200'
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-medium text-gray-900">{cabin.name}</p>
                {!cabin.is_active && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                    Inactive
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>Capacity: {cabin.total_capacity}</span>
                <span>{cabin.bunk_count} bunks</span>
                {cabin.location && <span>{cabin.location}</span>}
                {cabin.description && (
                  <span className="truncate max-w-[200px]">{cabin.description}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEdit(cabin)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Edit cabin"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeletingCabin(cabin)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                title="Delete cabin"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      {deletingCabin && (
        <DeleteConfirmModal
          title="Delete Cabin"
          message={`Are you sure you want to delete "${deletingCabin.name}"? Bunks inside will become unassigned (not deleted). This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCabin(null)}
          isDeleting={deleteCabin.isPending}
        />
      )}
    </>
  )
}

// ---- BunkTab ----

function BunkTab() {
  const { data: bunks = [], isLoading } = useBunks()
  const { data: cabins = [] } = useCabins(true)
  const createBunk = useCreateBunk()
  const updateBunk = useUpdateBunk()
  const deleteBunk = useDeleteBunk()
  const { toast } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BunkCreate>({ ...emptyBunkForm })
  const [deletingBunk, setDeletingBunk] = useState<Bunk | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyBunkForm })
    setShowForm(true)
  }

  function openEdit(bunk: Bunk) {
    setEditingId(bunk.id)
    setForm({
      name: bunk.name,
      capacity: bunk.capacity,
      gender_restriction: bunk.gender_restriction ?? 'all',
      min_age: bunk.min_age,
      max_age: bunk.max_age,
      location: bunk.location ?? '',
      counselor_user_id: bunk.counselor_user_id,
      cabin_id: bunk.cabin_id,
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyBunkForm })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: BunkCreate = {
      ...form,
      min_age: form.min_age ?? undefined,
      max_age: form.max_age ?? undefined,
      location: form.location || undefined,
      gender_restriction:
        form.gender_restriction === 'all' ? undefined : form.gender_restriction,
      cabin_id: form.cabin_id || undefined,
    }
    try {
      if (editingId) {
        await updateBunk.mutateAsync({ id: editingId, data: payload })
        toast({ type: 'success', message: 'Bunk updated successfully!' })
      } else {
        await createBunk.mutateAsync(payload)
        toast({ type: 'success', message: 'Bunk created successfully!' })
      }
      cancelForm()
    } catch {
      toast({
        type: 'error',
        message: editingId ? 'Failed to update bunk.' : 'Failed to create bunk.',
      })
    }
  }

  async function handleDelete() {
    if (!deletingBunk) return
    try {
      await deleteBunk.mutateAsync(deletingBunk.id)
      toast({ type: 'success', message: 'Bunk deleted.' })
      setDeletingBunk(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete bunk.' })
    }
  }

  const isSaving = createBunk.isPending || updateBunk.isPending

  return (
    <>
      {/* Add button */}
      {!showForm && (
        <button
          onClick={openCreate}
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
        >
          <Plus className="h-4 w-4" />
          Add Bunk
        </button>
      )}

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4"
        >
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            {editingId ? 'Edit Bunk' : 'New Bunk'}
          </h3>
          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Room A, Hawk Nest"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Cabin selector */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cabin
              </label>
              <select
                value={form.cabin_id ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    cabin_id: e.target.value || null,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">No cabin (unassigned)</option>
                {cabins.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Capacity + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacity: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Gender Restriction
                </label>
                <select
                  value={form.gender_restriction ?? 'all'}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gender_restriction: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
              </div>
            </div>

            {/* Age range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Min Age
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.min_age ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      min_age: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Max Age
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.max_age ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      max_age: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={form.location ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g., North Field, Lakeside"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Form actions */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Bunk'}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}

      {/* Bunk list */}
      {!isLoading && bunks.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-10">
          <BedDouble className="h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            No bunks yet. Click &quot;Add Bunk&quot; to create one.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {bunks.map((bunk) => (
          <div
            key={bunk.id}
            className={cn(
              'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
              editingId === bunk.id
                ? 'border-blue-200 bg-blue-50/30'
                : 'border-gray-100 bg-white hover:border-gray-200'
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {bunk.name}
                </p>
                {bunk.cabin_name && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <Building2 className="h-2.5 w-2.5" />
                    {bunk.cabin_name}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                    bunk.gender_restriction?.toLowerCase() === 'male'
                      ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                      : bunk.gender_restriction?.toLowerCase() === 'female'
                        ? 'bg-pink-50 text-pink-700 ring-pink-600/20'
                        : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                  )}
                >
                  {bunk.gender_restriction?.toLowerCase() === 'male'
                    ? 'Male'
                    : bunk.gender_restriction?.toLowerCase() === 'female'
                      ? 'Female'
                      : 'All'}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>Capacity: {bunk.capacity}</span>
                {(bunk.min_age != null || bunk.max_age != null) && (
                  <span>
                    Ages {bunk.min_age ?? '?'}-{bunk.max_age ?? '?'}
                  </span>
                )}
                {bunk.location && <span>{bunk.location}</span>}
                {bunk.counselor_name && (
                  <span>Counselor: {bunk.counselor_name}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEdit(bunk)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Edit bunk"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeletingBunk(bunk)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                title="Delete bunk"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      {deletingBunk && (
        <DeleteConfirmModal
          title="Delete Bunk"
          message={`Are you sure you want to delete "${deletingBunk.name}"? All camper assignments for this bunk will also be removed. This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingBunk(null)}
          isDeleting={deleteBunk.isPending}
        />
      )}
    </>
  )
}

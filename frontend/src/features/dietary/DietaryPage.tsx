/**
 * Camp Connect - Dietary Restrictions Page
 * Track camper dietary restrictions with stats, filters, grouped table, and create/edit modal.
 */

import { useState, useMemo } from 'react'
import {
  UtensilsCrossed,
  Plus,
  Search,
  Loader2,
  X,
  AlertTriangle,
  Users,
  BarChart3,
  Pencil,
  Trash2,
  Wheat,
  Heart,
  Star,
  Cross,
  Ban,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useCampers } from '@/hooks/useCampers'
import {
  useDietaryRestrictions,
  useDietaryStats,
  useCreateDietary,
  useUpdateDietary,
  useDeleteDietary,
} from '@/hooks/useDietary'
import type { DietaryRestriction } from '@/hooks/useDietary'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RESTRICTION_TYPES = [
  { value: 'food_allergy', label: 'Food Allergy', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  { value: 'intolerance', label: 'Intolerance', color: 'bg-orange-100 text-orange-700', icon: Ban },
  { value: 'preference', label: 'Preference', color: 'bg-blue-100 text-blue-700', icon: Star },
  { value: 'medical', label: 'Medical', color: 'bg-purple-100 text-purple-700', icon: Heart },
  { value: 'religious', label: 'Religious', color: 'bg-amber-100 text-amber-700', icon: Cross },
] as const

const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  { value: 'severe', label: 'Severe', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
] as const

function getTypeConfig(type: string) {
  return RESTRICTION_TYPES.find((t) => t.value === type) || RESTRICTION_TYPES[0]
}

function getSeverityConfig(severity: string) {
  return SEVERITY_LEVELS.find((s) => s.value === severity) || SEVERITY_LEVELS[1]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Modal Component
// ---------------------------------------------------------------------------

interface DietaryModalProps {
  open: boolean
  onClose: () => void
  editing: DietaryRestriction | null
}

function DietaryModal({ open, onClose, editing }: DietaryModalProps) {
  const { toast } = useToast()
  const createDietary = useCreateDietary()
  const updateDietary = useUpdateDietary()
  const { data: camperData } = useCampers({ limit: 500 })
  const campers = camperData?.items || []

  const [form, setForm] = useState({
    camper_id: editing?.camper_id || '',
    restriction_type: editing?.restriction_type || 'food_allergy',
    restriction: editing?.restriction || '',
    severity: editing?.severity || 'moderate',
    alternatives: editing?.alternatives || '',
    meal_notes: editing?.meal_notes || '',
  })

  // Reset form when editing changes
  useState(() => {
    setForm({
      camper_id: editing?.camper_id || '',
      restriction_type: editing?.restriction_type || 'food_allergy',
      restriction: editing?.restriction || '',
      severity: editing?.severity || 'moderate',
      alternatives: editing?.alternatives || '',
      meal_notes: editing?.meal_notes || '',
    })
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.camper_id || !form.restriction.trim()) {
      toast({ type: 'error', message: 'Please select a camper and enter a restriction.' })
      return
    }

    try {
      if (editing) {
        await updateDietary.mutateAsync({
          id: editing.id,
          data: {
            restriction_type: form.restriction_type,
            restriction: form.restriction.trim(),
            severity: form.severity,
            alternatives: form.alternatives.trim() || null,
            meal_notes: form.meal_notes.trim() || null,
          },
        })
        toast({ type: 'success', message: 'Dietary restriction updated.' })
      } else {
        await createDietary.mutateAsync({
          camper_id: form.camper_id,
          restriction_type: form.restriction_type,
          restriction: form.restriction.trim(),
          severity: form.severity,
          alternatives: form.alternatives.trim() || null,
          meal_notes: form.meal_notes.trim() || null,
        })
        toast({ type: 'success', message: 'Dietary restriction added.' })
      }
      onClose()
    } catch {
      toast({ type: 'error', message: editing ? 'Failed to update restriction.' : 'Failed to add restriction.' })
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {editing ? 'Edit Dietary Restriction' : 'Add Dietary Restriction'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Camper select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Camper</label>
            <select
              value={form.camper_id}
              onChange={(e) => handleChange('camper_id', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
              disabled={!!editing}
            >
              <option value="">Select a camper...</option>
              {(campers as any[]).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Restriction Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Restriction Type</label>
            <select
              value={form.restriction_type}
              onChange={(e) => handleChange('restriction_type', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {RESTRICTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Restriction */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Restriction</label>
            <input
              type="text"
              value={form.restriction}
              onChange={(e) => handleChange('restriction', e.target.value)}
              placeholder="e.g. Peanuts, Gluten, Dairy..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Severity */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Severity</label>
            <div className="flex gap-2">
              {SEVERITY_LEVELS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => handleChange('severity', s.value)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    form.severity === s.value
                      ? s.color
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alternatives */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Alternatives</label>
            <input
              type="text"
              value={form.alternatives}
              onChange={(e) => handleChange('alternatives', e.target.value)}
              placeholder="Safe food alternatives..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Meal Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Meal Notes</label>
            <textarea
              value={form.meal_notes}
              onChange={(e) => handleChange('meal_notes', e.target.value)}
              placeholder="Special instructions for kitchen staff..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createDietary.isPending || updateDietary.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {(createDietary.isPending || updateDietary.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {editing ? 'Save Changes' : 'Add Restriction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

interface DeleteConfirmProps {
  open: boolean
  restriction: DietaryRestriction | null
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

function DeleteConfirmModal({ open, restriction, onClose, onConfirm, isPending }: DeleteConfirmProps) {
  if (!open || !restriction) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Delete Restriction</h3>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium">{restriction.restriction}</span> for{' '}
          <span className="font-medium">{restriction.camper_name}</span>? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function DietaryPage() {
  const { toast } = useToast()

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<DietaryRestriction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DietaryRestriction | null>(null)

  // Data
  const { data: restrictions = [], isLoading } = useDietaryRestrictions({
    restriction_type: typeFilter || undefined,
    severity: severityFilter || undefined,
    search: search || undefined,
  })
  const { data: stats } = useDietaryStats()
  const deleteDietary = useDeleteDietary()

  // Group restrictions by camper
  const grouped = useMemo(() => {
    const map: Record<string, { camper_id: string; camper_name: string; items: DietaryRestriction[] }> = {}
    for (const r of restrictions) {
      if (!map[r.camper_id]) {
        map[r.camper_id] = { camper_id: r.camper_id, camper_name: r.camper_name, items: [] }
      }
      map[r.camper_id].items.push(r)
    }
    return Object.values(map)
  }, [restrictions])

  function openCreate() {
    setEditing(null)
    setShowModal(true)
  }

  function openEdit(restriction: DietaryRestriction) {
    setEditing(restriction)
    setShowModal(true)
  }

  function handleCloseModal() {
    setShowModal(false)
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteDietary.mutateAsync(deleteTarget.id)
      toast({ type: 'success', message: 'Dietary restriction deleted.' })
      setDeleteTarget(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete restriction.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Wheat className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dietary Restrictions</h1>
            <p className="text-sm text-gray-500">Track and manage camper dietary needs</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add Restriction
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Total Restrictions',
              value: stats.total_restrictions,
              icon: UtensilsCrossed,
              color: 'text-emerald-600',
              bg: 'bg-emerald-100',
            },
            {
              label: 'Campers Affected',
              value: stats.campers_affected,
              icon: Users,
              color: 'text-blue-600',
              bg: 'bg-blue-100',
            },
            {
              label: 'Severe Restrictions',
              value: stats.severe_count,
              icon: AlertTriangle,
              color: 'text-red-600',
              bg: 'bg-red-100',
            },
            {
              label: 'Restriction Types',
              value: Object.keys(stats.by_type).length,
              icon: BarChart3,
              color: 'text-purple-600',
              bg: 'bg-purple-100',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', s.bg)}>
                  <s.icon className={cn('h-4 w-4', s.color)} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Type breakdown pills */}
      {stats && Object.keys(stats.by_type).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.by_type).map(([type, count]) => {
            const cfg = getTypeConfig(type)
            return (
              <span
                key={type}
                className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', cfg.color)}
              >
                <cfg.icon className="h-3 w-3" />
                {cfg.label}: {count}
              </span>
            )
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search restrictions or campers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Types</option>
          {RESTRICTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Severities</option>
          {SEVERITY_LEVELS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && restrictions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <UtensilsCrossed className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">No dietary restrictions</h3>
          <p className="mt-1 text-sm text-gray-500">Add a restriction to start tracking dietary needs.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Add Restriction
          </button>
        </div>
      )}

      {/* Grouped Restriction Cards */}
      {!isLoading && grouped.length > 0 && (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div
              key={group.camper_id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {/* Camper header */}
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-5 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {group.camper_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{group.camper_name}</p>
                  <p className="text-xs text-gray-500">
                    {group.items.length} restriction{group.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Restriction rows */}
              <div className="divide-y divide-gray-100">
                {group.items.map((item) => {
                  const typeCfg = getTypeConfig(item.restriction_type)
                  const sevCfg = getSeverityConfig(item.severity)
                  const TypeIcon = typeCfg.icon

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Type badge */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                          typeCfg.color
                        )}
                      >
                        <TypeIcon className="h-3 w-3" />
                        {typeCfg.label}
                      </span>

                      {/* Restriction name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.restriction}</p>
                        {item.alternatives && (
                          <p className="text-xs text-gray-500 truncate">
                            Alt: {item.alternatives}
                          </p>
                        )}
                        {item.meal_notes && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {item.meal_notes}
                          </p>
                        )}
                      </div>

                      {/* Severity */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                          sevCfg.color
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', sevCfg.dot)} />
                        {sevCfg.label}
                      </span>

                      {/* Date */}
                      <span className="hidden text-xs text-gray-400 sm:block">
                        {formatDate(item.created_at)}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <DietaryModal open={showModal} onClose={handleCloseModal} editing={editing} />
      <DeleteConfirmModal
        open={!!deleteTarget}
        restriction={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isPending={deleteDietary.isPending}
      />
    </div>
  )
}

/**
 * Camp Connect - Allergy Matrix Page
 * Visual allergy matrix with stats, severity color coding, filters, and add modal.
 */

import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Plus,
  Search,
  Loader2,
  X,
  ShieldAlert,
  Users,
  Syringe,
  ListChecks,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useCampers } from '@/hooks/useCampers'
import {
  useAllergyStats,
  useAllergyMatrix,
  useCreateAllergy,
  useDeleteAllergy,
} from '@/hooks/useAllergyMatrix'
import type { AllergyEntry } from '@/hooks/useAllergyMatrix'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLERGY_TYPES = [
  { value: 'food', label: 'Food', color: 'bg-orange-100 text-orange-700' },
  { value: 'environmental', label: 'Environmental', color: 'bg-green-100 text-green-700' },
  { value: 'medication', label: 'Medication', color: 'bg-blue-100 text-blue-700' },
  { value: 'insect', label: 'Insect', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
] as const

const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  { value: 'severe', label: 'Severe', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  { value: 'life_threatening', label: 'Life Threatening', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
] as const

function getSeverityConfig(severity: string) {
  return SEVERITY_LEVELS.find((s) => s.value === severity) || SEVERITY_LEVELS[1]
}

function getAllergyTypeConfig(type: string) {
  return ALLERGY_TYPES.find((t) => t.value === type) || ALLERGY_TYPES[4]
}

// ---------------------------------------------------------------------------
// Add Allergy Modal
// ---------------------------------------------------------------------------

interface AddAllergyModalProps {
  open: boolean
  onClose: () => void
}

function AddAllergyModal({ open, onClose }: AddAllergyModalProps) {
  const { toast } = useToast()
  const createAllergy = useCreateAllergy()
  const { data: camperData } = useCampers({ limit: 500 })
  const campers = camperData?.items || []

  const [form, setForm] = useState({
    camper_id: '',
    allergy_type: 'food',
    allergen: '',
    severity: 'moderate',
    treatment: '',
    epipen_required: false,
    notes: '',
  })

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.camper_id || !form.allergen.trim()) {
      toast({ type: 'error', message: 'Please select a camper and enter an allergen.' })
      return
    }
    try {
      await createAllergy.mutateAsync({
        camper_id: form.camper_id,
        allergy_type: form.allergy_type,
        allergen: form.allergen.trim(),
        severity: form.severity,
        treatment: form.treatment.trim() || undefined,
        epipen_required: form.epipen_required,
        notes: form.notes.trim() || undefined,
      })
      toast({ type: 'success', message: 'Allergy entry added successfully.' })
      setForm({
        camper_id: '',
        allergy_type: 'food',
        allergen: '',
        severity: 'moderate',
        treatment: '',
        epipen_required: false,
        notes: '',
      })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to add allergy entry.' })
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
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Allergy Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Camper select */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Camper</label>
            <select
              value={form.camper_id}
              onChange={(e) => handleChange('camper_id', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            >
              <option value="">Select a camper...</option>
              {(campers as any[]).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Allergen */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Allergen</label>
            <input
              type="text"
              value={form.allergen}
              onChange={(e) => handleChange('allergen', e.target.value)}
              placeholder="e.g. Peanuts, Bee stings, Penicillin..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Type + Severity row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <select
                value={form.allergy_type}
                onChange={(e) => handleChange('allergy_type', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {ALLERGY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {SEVERITY_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Treatment */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Treatment</label>
            <input
              type="text"
              value={form.treatment}
              onChange={(e) => handleChange('treatment', e.target.value)}
              placeholder="e.g. Administer EpiPen, Benadryl 25mg..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* EpiPen toggle */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.epipen_required}
              onChange={(e) => handleChange('epipen_required', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700">EpiPen Required</span>
          </label>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              placeholder="Additional notes..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAllergy.isPending}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {createAllergy.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Allergy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Severity cell for the matrix
// ---------------------------------------------------------------------------

function SeverityCell({ entry }: { entry: AllergyEntry }) {
  const cfg = getSeverityConfig(entry.severity)
  return (
    <div
      className={cn(
        'group relative flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium',
        cfg.color
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
      {entry.allergen}
      {entry.epipen_required && (
        <Syringe className="h-3 w-3 shrink-0" />
      )}
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg group-hover:block">
        <p className="text-xs font-semibold text-gray-900">{entry.allergen}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {getSeverityConfig(entry.severity).label} &middot; {getAllergyTypeConfig(entry.allergy_type).label}
        </p>
        {entry.treatment && (
          <p className="mt-1 text-xs text-gray-600">
            <span className="font-medium">Treatment:</span> {entry.treatment}
          </p>
        )}
        {entry.epipen_required && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
            <Syringe className="h-3 w-3" /> EpiPen Required
          </p>
        )}
        {entry.notes && (
          <p className="mt-1 text-xs text-gray-500">{entry.notes}</p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function AllergyMatrixPage() {
  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [search, setSearch] = useState('')

  const matrixFilters = useMemo(() => {
    const f: { allergy_type?: string; severity?: string } = {}
    if (filterType) f.allergy_type = filterType
    if (filterSeverity) f.severity = filterSeverity
    return f
  }, [filterType, filterSeverity])

  const { data: stats, isLoading: statsLoading } = useAllergyStats()
  const { data: matrixData, isLoading: matrixLoading } = useAllergyMatrix(matrixFilters)
  const deleteAllergy = useDeleteAllergy()

  // Filter matrix rows by search
  const filteredMatrix = useMemo(() => {
    if (!matrixData) return []
    if (!search.trim()) return matrixData
    const q = search.toLowerCase()
    return matrixData.filter(
      (row) =>
        row.camper_name.toLowerCase().includes(q) ||
        row.allergies.some((a) => a.allergen.toLowerCase().includes(q))
    )
  }, [matrixData, search])


  async function handleDelete(entry: AllergyEntry) {
    if (!window.confirm(`Remove ${entry.allergen} allergy for ${entry.camper_name}?`)) return
    try {
      await deleteAllergy.mutateAsync(entry.id)
      toast({ type: 'success', message: 'Allergy entry removed.' })
    } catch {
      toast({ type: 'error', message: 'Failed to remove allergy entry.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Allergy Matrix</h1>
            <p className="text-sm text-gray-500">
              Track and visualize all camper allergies at a glance
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Allergy
        </button>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Total Entries',
              value: stats.total_entries,
              icon: ListChecks,
              iconColor: 'text-blue-600',
              bg: 'bg-blue-100',
            },
            {
              label: 'Campers w/ Allergies',
              value: stats.campers_with_allergies,
              icon: Users,
              iconColor: 'text-emerald-600',
              bg: 'bg-emerald-100',
            },
            {
              label: 'Severe / Life-Threatening',
              value: stats.severe_count,
              icon: AlertTriangle,
              iconColor: 'text-orange-600',
              bg: 'bg-orange-100',
            },
            {
              label: 'EpiPen Required',
              value: stats.epipen_count,
              icon: Syringe,
              iconColor: 'text-red-600',
              bg: 'bg-red-100',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    s.bg
                  )}
                >
                  <s.icon className={cn('h-4 w-4', s.iconColor)} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Top Allergens */}
      {stats && stats.top_allergens.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Top Allergens</h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_allergens.map((a) => (
              <span
                key={a.allergen}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
              >
                {a.allergen}
                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                  {a.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campers or allergens..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Types</option>
            {ALLERGY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Severities</option>
            {SEVERITY_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {(filterType || filterSeverity) && (
            <button
              onClick={() => {
                setFilterType('')
                setFilterSeverity('')
              }}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Severity Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="font-medium">Severity:</span>
        {SEVERITY_LEVELS.map((s) => (
          <span key={s.value} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', s.dot)} />
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 ml-2">
          <Syringe className="h-3 w-3 text-red-500" />
          EpiPen
        </span>
      </div>

      {/* Matrix Table */}
      {matrixLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : filteredMatrix.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No allergy entries found</p>
          <p className="mt-1 text-xs text-gray-400">
            Click &quot;Add Allergy&quot; to start tracking camper allergies
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Camper
                </th>
                {ALLERGY_TYPES.map((t) => (
                  <th
                    key={t.value}
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    <span className={cn('inline-block rounded-full px-2 py-0.5', t.color)}>
                      {t.label}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMatrix.map((row) => {
                // Group allergies by type for this camper
                const byType: Record<string, AllergyEntry[]> = {}
                ALLERGY_TYPES.forEach((t) => { byType[t.value] = [] })
                row.allergies.forEach((a) => {
                  if (byType[a.allergy_type]) {
                    byType[a.allergy_type].push(a)
                  }
                })

                const hasLifeThreatening = row.allergies.some(
                  (a) => a.severity === 'life_threatening'
                )

                return (
                  <tr
                    key={row.camper_id}
                    className={cn(
                      'transition-colors hover:bg-gray-50',
                      hasLifeThreatening && 'bg-red-50/30'
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.camper_name}
                        {hasLifeThreatening && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {row.allergies.some((a) => a.epipen_required) && (
                          <Syringe className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>
                    </td>
                    {ALLERGY_TYPES.map((type) => (
                      <td key={type.value} className="px-4 py-3">
                        <div className="flex flex-wrap justify-center gap-1">
                          {byType[type.value].length > 0
                            ? byType[type.value].map((entry) => (
                                <SeverityCell key={entry.id} entry={entry} />
                              ))
                            : (
                              <span className="text-gray-300">&mdash;</span>
                            )}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.allergies.map((entry) => (
                          <button
                            key={entry.id}
                            onClick={() => handleDelete(entry)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            title={`Delete ${entry.allergen}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary footer */}
      {filteredMatrix.length > 0 && (
        <p className="text-xs text-gray-400">
          Showing {filteredMatrix.length} camper{filteredMatrix.length !== 1 ? 's' : ''} with allergies
        </p>
      )}

      {/* Add Modal */}
      <AddAllergyModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  )
}

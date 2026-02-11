/**
 * Camp Connect - HubSpot-Style Conditional Filter Builder
 * Visual builder with AND/OR groups for creating dynamic list filters.
 */

import { useCallback } from 'react'
import {
  Plus, Trash2, X, ChevronDown, Layers, Filter, Eye, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterCondition { field: string; operator: string; value: string }
export interface FilterGroup { operator: 'AND' | 'OR'; filters: FilterCondition[] }
export interface FilterCriteria { groups: FilterGroup[]; group_operator: 'AND' | 'OR' }

interface FilterBuilderProps {
  entityType: string
  criteria: FilterCriteria
  onChange: (criteria: FilterCriteria) => void
  onPreview?: () => void
  previewCount?: number | null
  isPreviewLoading?: boolean
}

interface FieldDef { value: string; label: string; type: 'string' | 'date' | 'number' }

const CONTACT_FIELDS: FieldDef[] = [
  { value: 'first_name', label: 'First Name', type: 'string' },
  { value: 'last_name', label: 'Last Name', type: 'string' },
  { value: 'email', label: 'Email', type: 'string' },
  { value: 'phone', label: 'Phone', type: 'string' },
  { value: 'address', label: 'Address', type: 'string' },
  { value: 'city', label: 'City', type: 'string' },
  { value: 'state', label: 'State', type: 'string' },
  { value: 'zip_code', label: 'Zip Code', type: 'string' },
  { value: 'relationship_type', label: 'Relationship Type', type: 'string' },
  { value: 'account_status', label: 'Account Status', type: 'string' },
  { value: 'created_at', label: 'Created At', type: 'date' },
  { value: 'updated_at', label: 'Updated At', type: 'date' },
]

const CAMPER_FIELDS: FieldDef[] = [
  { value: 'first_name', label: 'First Name', type: 'string' },
  { value: 'last_name', label: 'Last Name', type: 'string' },
  { value: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { value: 'gender', label: 'Gender', type: 'string' },
  { value: 'grade', label: 'Grade', type: 'string' },
  { value: 'school', label: 'School', type: 'string' },
  { value: 'city', label: 'City', type: 'string' },
  { value: 'state', label: 'State', type: 'string' },
  { value: 'created_at', label: 'Created At', type: 'date' },
  { value: 'updated_at', label: 'Updated At', type: 'date' },
]

interface OperatorDef { value: string; label: string; needsValue: boolean }

const STRING_OPS: OperatorDef[] = [
  { value: 'equals', label: 'equals', needsValue: true },
  { value: 'not_equals', label: 'does not equal', needsValue: true },
  { value: 'contains', label: 'contains', needsValue: true },
  { value: 'not_contains', label: 'does not contain', needsValue: true },
  { value: 'starts_with', label: 'starts with', needsValue: true },
  { value: 'is_empty', label: 'is empty', needsValue: false },
  { value: 'is_not_empty', label: 'is not empty', needsValue: false },
  { value: 'in_list', label: 'is any of', needsValue: true },
]

const DATE_OPS: OperatorDef[] = [
  { value: 'equals', label: 'is', needsValue: true },
  { value: 'after', label: 'is after', needsValue: true },
  { value: 'before', label: 'is before', needsValue: true },
  { value: 'is_empty', label: 'is empty', needsValue: false },
  { value: 'is_not_empty', label: 'is not empty', needsValue: false },
]

const NUM_OPS: OperatorDef[] = [
  { value: 'equals', label: 'equals', needsValue: true },
  { value: 'not_equals', label: 'does not equal', needsValue: true },
  { value: 'greater_than', label: 'greater than', needsValue: true },
  { value: 'less_than', label: 'less than', needsValue: true },
  { value: 'is_empty', label: 'is empty', needsValue: false },
  { value: 'is_not_empty', label: 'is not empty', needsValue: false },
]

function fieldsFor(et: string): FieldDef[] {
  return et === 'camper' ? CAMPER_FIELDS : CONTACT_FIELDS
}

function opsFor(ft: string): OperatorDef[] {
  if (ft === 'date') return DATE_OPS
  if (ft === 'number') return NUM_OPS
  return STRING_OPS
}

function fieldType(et: string, fn: string): string {
  return fieldsFor(et).find((f) => f.value === fn)?.type || 'string'
}

export function createEmptyCriteria(): FilterCriteria {
  return {
    groups: [{ operator: 'AND', filters: [{ field: 'first_name', operator: 'contains', value: '' }] }],
    group_operator: 'OR',
  }
}

export function FilterBuilder({ entityType, criteria, onChange, onPreview, previewCount, isPreviewLoading }: FilterBuilderProps) {
  const fields = fieldsFor(entityType)

  const updateGroup = useCallback((gi: number, fn: (g: FilterGroup) => FilterGroup) => {
    onChange({ ...criteria, groups: criteria.groups.map((g, i) => i === gi ? fn({ ...g }) : g) })
  }, [criteria, onChange])

  const updateFilter = useCallback((gi: number, fi: number, patch: Partial<FilterCondition>) => {
    updateGroup(gi, (g) => ({ ...g, filters: g.filters.map((f, i) => i === fi ? { ...f, ...patch } : f) }))
  }, [updateGroup])

  const addFilter = useCallback((gi: number) => {
    updateGroup(gi, (g) => ({ ...g, filters: [...g.filters, { field: fields[0].value, operator: 'contains', value: '' }] }))
  }, [updateGroup, fields])

  const removeFilter = useCallback((gi: number, fi: number) => {
    const group = criteria.groups[gi]
    if (group.filters.length <= 1) {
      if (criteria.groups.length <= 1) return
      onChange({ ...criteria, groups: criteria.groups.filter((_, i) => i !== gi) })
    } else {
      updateGroup(gi, (g) => ({ ...g, filters: g.filters.filter((_, i) => i !== fi) }))
    }
  }, [criteria, onChange, updateGroup])

  const addGroup = useCallback(() => {
    onChange({ ...criteria, groups: [...criteria.groups, { operator: 'AND' as const, filters: [{ field: fields[0].value, operator: 'contains', value: '' }] }] })
  }, [criteria, onChange, fields])

  const handleFieldChange = useCallback((gi: number, fi: number, nf: string) => {
    const ft = fieldType(entityType, nf)
    const ops = opsFor(ft)
    const cur = criteria.groups[gi].filters[fi].operator
    updateFilter(gi, fi, { field: nf, operator: ops.some((o) => o.value === cur) ? cur : ops[0].value, value: '' })
  }, [entityType, criteria, updateFilter])

  return (
    <div className="space-y-4">
      {criteria.groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div className="flex items-center justify-center py-2">
              <div className="h-px flex-1 bg-gray-200" />
              <button type="button" onClick={() => onChange({ ...criteria, group_operator: criteria.group_operator === 'AND' ? 'OR' : 'AND' })}
                className={cn('mx-3 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide transition-colors', criteria.group_operator === 'OR' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200')}>
                {criteria.group_operator}
              </button>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          )}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filter Group {gi + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                {group.filters.length > 1 && (
                  <button type="button" onClick={() => updateGroup(gi, (g) => ({ ...g, operator: g.operator === 'AND' ? 'OR' : 'AND' }))}
                    className={cn('rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide transition-colors', group.operator === 'AND' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200')}>
                    {group.operator}
                  </button>
                )}
                {criteria.groups.length > 1 && (
                  <button type="button" onClick={() => onChange({ ...criteria, groups: criteria.groups.filter((_, i) => i !== gi) })}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Remove group">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-50 p-3">
              {group.filters.map((filter, fi) => {
                const ft = fieldType(entityType, filter.field)
                const ops = opsFor(ft)
                const opDef = ops.find((o) => o.value === filter.operator)
                const needsVal = opDef?.needsValue ?? true
                return (
                  <div key={fi} className="py-2 first:pt-0 last:pb-0">
                    {fi > 0 && (
                      <div className="flex items-center gap-2 pb-2">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', group.operator === 'AND' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')}>{group.operator}</span>
                        <div className="h-px flex-1 bg-gray-100" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <select value={filter.field} onChange={(e) => handleFieldChange(gi, fi, e.target.value)}
                          className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {fields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <select value={filter.operator} onChange={(e) => updateFilter(gi, fi, { operator: e.target.value })}
                          className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {ops.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      </div>
                      {needsVal && (
                        <div className="flex-1 min-w-0">
                          <input type={ft === 'date' ? 'date' : 'text'} value={filter.value}
                            onChange={(e) => updateFilter(gi, fi, { value: e.target.value })}
                            placeholder={filter.operator === 'in_list' ? 'value1, value2, ...' : 'Enter value...'}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                      )}
                      <button type="button" onClick={() => removeFilter(gi, fi)}
                        className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500" title="Remove filter">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button type="button" onClick={() => addFilter(gi)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700">
                <Plus className="h-3.5 w-3.5" />
                Add filter
              </button>
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" onClick={addGroup}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700">
          <Layers className="h-3.5 w-3.5" />
          Add filter group
        </button>
        {onPreview && (
          <div className="flex items-center gap-3">
            {previewCount !== null && previewCount !== undefined && (
              <span className="text-sm font-medium text-gray-600">
                <span className="font-bold text-gray-900">{previewCount}</span>{' '}
                {entityType === 'camper' ? 'camper' : 'contact'}{previewCount !== 1 ? 's' : ''} match
              </span>
            )}
            <button type="button" onClick={onPreview} disabled={isPreviewLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-50">
              {isPreviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Preview Results
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export interface PreviewResult {
  id: string
  name: string
  email: string | null
  extra: Record<string, string> | null
}

export function PreviewResultsTable({ results, totalCount, entityType }: { results: PreviewResult[]; totalCount: number; entityType: string }) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10">
        <Filter className="h-8 w-8 text-gray-300" />
        <p className="mt-2 text-sm font-medium text-gray-900">No matches found</p>
        <p className="mt-1 text-xs text-gray-500">Adjust your filter criteria to find {entityType === 'camper' ? 'campers' : 'contacts'}.</p>
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
        <p className="text-sm font-medium text-gray-700">
          Showing {results.length} of <span className="font-bold text-gray-900">{totalCount}</span> matching {entityType === 'camper' ? 'camper' : 'contact'}{totalCount !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3">Name</th>
              {entityType === 'contact' && <th className="hidden px-5 py-3 sm:table-cell">Email</th>}
              <th className="px-5 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-gray-50/80">
                <td className="whitespace-nowrap px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">
                      {r.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{r.name}</span>
                  </div>
                </td>
                {entityType === 'contact' && <td className="hidden whitespace-nowrap px-5 py-3 text-sm text-gray-600 sm:table-cell">{r.email || '--'}</td>}
                <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-500">
                  {r.extra ? Object.entries(r.extra).map(([k, v]) => `${k}: ${v}`).join(', ') : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

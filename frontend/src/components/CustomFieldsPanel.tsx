/**
 * Camp Connect - Custom Fields Panel
 * Reusable component for rendering and editing custom field values on any entity.
 */

import { useState, useEffect } from 'react'
import {
  Type, Hash, Calendar, ToggleLeft, List, Link, Mail, Phone, Save, Loader2, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCustomFieldValues, useSaveCustomFieldValues } from '@/hooks/useCustomFields'
import { useToast } from '@/components/ui/Toast'
import type { CustomFieldValue } from '@/types'

const FIELD_TYPE_ICONS: Record<string, typeof Type> = {
  text: Type, number: Hash, date: Calendar, boolean: ToggleLeft,
  select: List, multi_select: Layers, url: Link, email: Mail, phone: Phone,
}

interface CustomFieldsPanelProps {
  entityType: string
  entityId: string
  editable?: boolean
}

export function CustomFieldsPanel({ entityType, entityId, editable = true }: CustomFieldsPanelProps) {
  const { data: fieldValues = [], isLoading } = useCustomFieldValues(entityType, entityId)
  const saveMutation = useSaveCustomFieldValues()
  const { toast } = useToast()
  const [localValues, setLocalValues] = useState<Record<string, string | null>>({})
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const map: Record<string, string | null> = {}
    for (const fv of fieldValues) { map[fv.field_definition_id] = fv.value }
    setLocalValues(map)
    setIsDirty(false)
  }, [fieldValues])

  const handleChange = (fieldDefId: string, value: string | null) => {
    setLocalValues((prev) => ({ ...prev, [fieldDefId]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    const values = Object.entries(localValues).map(([field_definition_id, value]) => ({
      field_definition_id, value,
    }))
    try {
      await saveMutation.mutateAsync({ entityType, entityId, values })
      toast({ type: 'success', message: 'Custom fields saved!' })
      setIsDirty(false)
    } catch {
      toast({ type: 'error', message: 'Failed to save custom fields.' })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  const visibleFields = fieldValues.filter((fv) => fv.show_in_detail !== false)

  if (visibleFields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
        <Layers className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">No custom fields defined for this entity type.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {visibleFields.map((fv) => (
          <FieldRenderer
            key={fv.field_definition_id}
            fieldValue={fv}
            localValue={localValues[fv.field_definition_id] ?? null}
            onChange={(val) => handleChange(fv.field_definition_id, val)}
            editable={editable}
          />
        ))}
      </div>
      {editable && isDirty && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Custom Fields
          </button>
        </div>
      )}
    </div>
  )
}

function FieldRenderer({
  fieldValue, localValue, onChange, editable,
}: {
  fieldValue: CustomFieldValue
  localValue: string | null
  onChange: (value: string | null) => void
  editable: boolean
}) {
  const fieldType = fieldValue.field_type || 'text'
  const Icon = FIELD_TYPE_ICONS[fieldType] || Type
  const inputClasses =
    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500'

  const renderInput = () => {
    switch (fieldType) {
      case 'text':
        return (
          <input type="text" value={localValue ?? ''} onChange={(e) => onChange(e.target.value || null)}
            disabled={!editable} className={inputClasses}
            placeholder={`Enter ${fieldValue.field_name?.toLowerCase() ?? 'value'}...`} />
        )
      case 'number':
        return (
          <input type="number" value={localValue ?? ''} onChange={(e) => onChange(e.target.value || null)}
            disabled={!editable} className={inputClasses} placeholder="0" />
        )
      case 'date':
        return (
          <input type="date" value={localValue ?? ''} onChange={(e) => onChange(e.target.value || null)}
            disabled={!editable} className={inputClasses} />
        )
      case 'boolean':
        return (
          <button type="button"
            onClick={() => { if (editable) onChange(localValue === 'true' ? 'false' : 'true') }}
            disabled={!editable}
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed',
              localValue === 'true' ? 'bg-emerald-600' : 'bg-gray-200'
            )}>
            <span className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              localValue === 'true' ? 'translate-x-5' : 'translate-x-0'
            )} />
          </button>
        )
      case 'select':
        return (
          <select value={localValue ?? ''} onChange={(e) => onChange(e.target.value || null)}
            disabled={!editable} className={inputClasses}>
            <option value="">Select...</option>
            {(fieldValue.options ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'multi_select': {
        const selected = localValue ? localValue.split(',').map((s) => s.trim()) : []
        return (
          <div className="flex flex-wrap gap-2">
            {(fieldValue.options ?? []).map((opt) => {
              const isSelected = selected.includes(opt)
              return (
                <button key={opt} type="button" disabled={!editable}
                  onClick={() => {
                    if (!editable) return
                    const next = isSelected ? selected.filter((s) => s !== opt) : [...selected, opt]
                    onChange(next.length > 0 ? next.join(', ') : null)
                  }}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                      : 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20',
                    editable && 'hover:ring-emerald-300'
                  )}>
                  {opt}
                </button>
              )
            })}
          </div>
        )
      }
      case 'url':
        return (
          <input type="url" value={localValue ?? ''} onChange={(e) => onChange(e.target.value || null)}
            disabled={!editable} className={inputClasses} placeholder="https://..." />
        )
      case 'email':
        return (
          <input type="email" value={localValue ?? ''} onChange={(e) => onChange(e.target.value || null)}
            disabled={!editable} className={inputClasses} placeholder="name@example.com" />
        )
      case 'phone':
        return (
          <input type="tel" value={localValue ?? ''} onChange={(e) => onChange(e.target.value || null)}
            disabled={!editable} className={inputClasses} placeholder="(555) 555-5555" />
        )
      default:
        return (
          <input type="text" value={localValue ?? ''} onChange={(e) => onChange(e.target.value || null)}
            disabled={!editable} className={inputClasses} />
        )
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <label className="text-sm font-medium text-gray-700">
          {fieldValue.field_name}
          {fieldValue.is_required && <span className="ml-1 text-red-500">*</span>}
        </label>
      </div>
      {fieldValue.description && (
        <p className="text-xs text-gray-500">{fieldValue.description}</p>
      )}
      {renderInput()}
    </div>
  )
}

/**
 * Camp Connect - Custom Fields Settings Page
 * Admin page for defining custom fields per entity type.
 */

import { useState } from 'react'
import {
  Plus, Edit2, Trash2, X, AlertTriangle, GripVertical,
  Type, Hash, Calendar, ToggleLeft, List, Link, Mail, Phone, Layers, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useCustomFieldDefinitions,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
} from '@/hooks/useCustomFields'
import { useToast } from '@/components/ui/Toast'
import type { CustomFieldDefinition, CustomFieldDefinitionCreate } from '@/types'

const ENTITY_TYPES = [
  { key: 'contact', label: 'Contact' },
  { key: 'camper', label: 'Camper' },
  { key: 'event', label: 'Event' },
  { key: 'staff', label: 'Staff' },
  { key: 'family', label: 'Family' },
]

const FIELD_TYPES = [
  { key: 'text', label: 'Text', icon: Type },
  { key: 'number', label: 'Number', icon: Hash },
  { key: 'date', label: 'Date', icon: Calendar },
  { key: 'boolean', label: 'Boolean', icon: ToggleLeft },
  { key: 'select', label: 'Select', icon: List },
  { key: 'multi_select', label: 'Multi Select', icon: Layers },
  { key: 'url', label: 'URL', icon: Link },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'phone', label: 'Phone', icon: Phone },
]

function toSnakeCase(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

const FIELD_TYPE_ICON_MAP: Record<string, typeof Type> = {
  text: Type, number: Hash, date: Calendar, boolean: ToggleLeft,
  select: List, multi_select: Layers, url: Link, email: Mail, phone: Phone,
}

// ---- Modal ----

function FieldDefinitionModal({
  field, entityType, onClose,
}: {
  field: CustomFieldDefinition | null
  entityType: string
  onClose: () => void
}) {
  const [fieldName, setFieldName] = useState(field?.field_name ?? '')
  const [fieldKey, setFieldKey] = useState(field?.field_key ?? '')
  const [fieldType, setFieldType] = useState<string>(field?.field_type ?? 'text')
  const [description, setDescription] = useState(field?.description ?? '')
  const [isRequired, setIsRequired] = useState(field?.is_required ?? false)
  const [options, setOptions] = useState<string[]>(field?.options ?? [])
  const [newOption, setNewOption] = useState('')
  const defaultValue = field?.default_value ?? ''
  const [showInList, setShowInList] = useState(field?.show_in_list ?? false)
  const [showInDetail, setShowInDetail] = useState(field?.show_in_detail ?? true)
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false)

  const createMutation = useCreateCustomField()
  const updateMutation = useUpdateCustomField()
  const { toast } = useToast()
  const isEdit = field !== null
  const isPending = createMutation.isPending || updateMutation.isPending
  const showOptions = fieldType === 'select' || fieldType === 'multi_select'

  const handleNameChange = (value: string) => {
    setFieldName(value)
    if (!keyManuallyEdited) setFieldKey(toSnakeCase(value))
  }

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()])
      setNewOption('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fieldName.trim() || !fieldKey.trim()) return
    const data: CustomFieldDefinitionCreate = {
      entity_type: entityType, field_name: fieldName.trim(),
      field_key: fieldKey.trim(), field_type: fieldType,
      description: description.trim() || undefined,
      is_required: isRequired,
      options: showOptions ? options : undefined,
      default_value: defaultValue.trim() || undefined,
      show_in_list: showInList, show_in_detail: showInDetail,
    }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: field.id, data: data as Partial<CustomFieldDefinition> })
        toast({ type: 'success', message: 'Field updated!' })
      } else {
        await createMutation.mutateAsync(data)
        toast({ type: 'success', message: 'Field created!' })
      }
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to save field.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Custom Field' : 'New Custom Field'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Field Name <span className="text-red-500">*</span>
            </label>
            <input type="text" value={fieldName} onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. T-Shirt Size" required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>

          {/* Field Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Field Key</label>
            <input type="text" value={fieldKey}
              onChange={(e) => { setFieldKey(e.target.value); setKeyManuallyEdited(true) }}
              placeholder="t_shirt_size"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <p className="mt-1 text-xs text-gray-400">Auto-generated from name. Used as API key.</p>
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Field Type</label>
            <div className="relative">
              <select value={fieldType} onChange={(e) => setFieldType(e.target.value as CustomFieldDefinition['field_type'])}
                className="w-full appearance-none rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100">
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.key} value={ft.key}>{ft.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description" rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>

          {/* Options for select types */}
          {showOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Options</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {options.map((opt, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {opt}
                    <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                      className="ml-0.5 text-blue-400 hover:text-blue-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newOption} onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption() } }}
                  placeholder="Add option..." className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                <button type="button" onClick={handleAddOption}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Add</button>
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Required</p>
                <p className="text-xs text-gray-500">This field must be filled in</p>
              </div>
              <button type="button" onClick={() => setIsRequired(!isRequired)}
                className={cn('relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  isRequired ? 'bg-blue-600' : 'bg-gray-200')}>
                <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                  isRequired ? 'translate-x-5' : 'translate-x-0')} />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Show in List View</p>
                <p className="text-xs text-gray-500">Display as column in list pages</p>
              </div>
              <button type="button" onClick={() => setShowInList(!showInList)}
                className={cn('relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  showInList ? 'bg-blue-600' : 'bg-gray-200')}>
                <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                  showInList ? 'translate-x-5' : 'translate-x-0')} />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Show in Detail View</p>
                <p className="text-xs text-gray-500">Display on entity detail pages</p>
              </div>
              <button type="button" onClick={() => setShowInDetail(!showInDetail)}
                className={cn('relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  showInDetail ? 'bg-blue-600' : 'bg-gray-200')}>
                <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                  showInDetail ? 'translate-x-5' : 'translate-x-0')} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isPending || !fieldName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50">
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Delete Confirmation ----

function DeleteConfirmModal({
  fieldName, onConfirm, onClose, isPending,
}: {
  fieldName: string
  onConfirm: () => void
  onClose: () => void
  isPending: boolean
}) {
  const [confirmText, setConfirmText] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Delete Custom Field</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Are you sure you want to delete <strong>{fieldName}</strong>? All stored values for this field will be lost.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
          </label>
          <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100" />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} disabled={confirmText !== 'DELETE' || isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50">
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Main Page ----

export function CustomFieldsSettingsPage() {
  const [activeEntityType, setActiveEntityType] = useState('contact')
  const { data: definitions = [], isLoading } = useCustomFieldDefinitions(activeEntityType)
  const deleteMutation = useDeleteCustomField()
  const { toast } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null)
  const [deletingField, setDeletingField] = useState<CustomFieldDefinition | null>(null)

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingField(field)
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditingField(null)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deletingField) return
    try {
      await deleteMutation.mutateAsync(deletingField.id)
      toast({ type: 'success', message: 'Field deleted!' })
      setDeletingField(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete field.' })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Custom Fields</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Define custom data fields for your entities.
          </p>
        </div>
        <button onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Add Field
        </button>
      </div>

      {/* Entity Type Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {ENTITY_TYPES.map((et) => (
          <button key={et.key} onClick={() => setActiveEntityType(et.key)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeEntityType === et.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}>
            {et.label}
          </button>
        ))}
      </div>

      {/* Fields List */}
      {definitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
          <Layers className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No custom fields</p>
          <p className="mt-1 text-sm text-gray-500">Create your first custom field for {activeEntityType}s.</p>
          <button onClick={handleCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <Plus className="h-4 w-4" />
            Add Field
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Field</th>
                <th className="hidden px-6 py-3 sm:table-cell">Type</th>
                <th className="hidden px-6 py-3 md:table-cell">Required</th>
                <th className="hidden px-6 py-3 lg:table-cell">Visibility</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {definitions.map((field) => {
                const FieldIcon = FIELD_TYPE_ICON_MAP[field.field_type] || Type
                return (
                  <tr key={field.id} className="transition-colors hover:bg-gray-50/80">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                          <FieldIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{field.field_name}</p>
                          <p className="mt-0.5 text-xs text-gray-400 font-mono">{field.field_key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        <FieldIcon className="h-3 w-3" />
                        {field.field_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 md:table-cell">
                      {field.is_required ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Required</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">Optional</span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 lg:table-cell">
                      <div className="flex gap-1">
                        {field.show_in_list && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">List</span>
                        )}
                        {field.show_in_detail && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Detail</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(field)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeletingField(field)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <FieldDefinitionModal
          field={editingField}
          entityType={activeEntityType}
          onClose={() => { setShowModal(false); setEditingField(null) }}
        />
      )}
      {deletingField && (
        <DeleteConfirmModal
          fieldName={deletingField.field_name}
          onConfirm={handleDelete}
          onClose={() => setDeletingField(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

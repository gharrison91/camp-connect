/**
 * Camp Connect - Forms & Contact Field Builder
 *
 * Two tabs:
 *  1. Contact Fields — dynamic list of all contact columns + custom fields
 *  2. Form Templates — original form builder grid
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  AlertTriangle,
  X,
  RotateCcw,
  Clock,
  Database,
  Columns3,
  Lock,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Save,
  CheckCircle2,
  Type,
  Hash,
  Calendar,
  Mail,
  Phone,
  Link2,
  List,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useFormTemplates,
  useDuplicateFormTemplate,
  useDeleteFormTemplate,
  useTrashedForms,
  useRestoreFormTemplate,
  usePermanentDeleteFormTemplate,
} from '@/hooks/useForms'
import {
  useCustomFieldDefinitions,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
} from '@/hooks/useCustomFields'
import { useToast } from '@/components/ui/Toast'
import { useOrgSettings } from '@/hooks/useOrganization'
import type { CustomFieldDefinition } from '@/types'

// ─── Standard Contact Fields (built-in, read-only) ──────────────────

const STANDARD_CONTACT_FIELDS = [
  { key: 'first_name', label: 'First Name', type: 'text', required: true },
  { key: 'last_name', label: 'Last Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: false },
  { key: 'phone', label: 'Phone', type: 'phone', required: false },
  { key: 'address', label: 'Address', type: 'text', required: false },
  { key: 'city', label: 'City', type: 'text', required: false },
  { key: 'state', label: 'State', type: 'text', required: false },
  { key: 'zip_code', label: 'ZIP Code', type: 'text', required: false },
  { key: 'relationship_type', label: 'Relationship', type: 'select', required: true },
  { key: 'account_status', label: 'Account Status', type: 'select', required: true },
  { key: 'communication_preference', label: 'Communication Preference', type: 'select', required: true },
]

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'boolean', label: 'Yes/No', icon: ToggleLeft },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'multi_select', label: 'Multi-Select', icon: ListChecks },
  { value: 'url', label: 'URL', icon: Link2 },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
]

function getFieldTypeIcon(fieldType: string) {
  const found = FIELD_TYPE_OPTIONS.find((f) => f.value === fieldType)
  return found?.icon ?? Type
}

// ─── Custom Field Modal ─────────────────────────────────────────────

function CustomFieldModal({
  isOpen,
  field,
  onClose,
  onSave,
  saving,
}: {
  isOpen: boolean
  field: CustomFieldDefinition | null
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  saving: boolean
}) {
  const [fieldName, setFieldName] = useState('')
  const [fieldKey, setFieldKey] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [isRequired, setIsRequired] = useState(false)
  const [showInList, setShowInList] = useState(false)
  const [showInDetail, setShowInDetail] = useState(true)
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState('')

  useEffect(() => {
    if (field) {
      setFieldName(field.field_name)
      setFieldKey(field.field_key)
      setFieldType(field.field_type)
      setIsRequired(field.is_required)
      setShowInList(field.show_in_list)
      setShowInDetail(field.show_in_detail)
      setDescription(field.description || '')
      setOptions(field.options || [])
    } else {
      setFieldName('')
      setFieldKey('')
      setFieldType('text')
      setIsRequired(false)
      setShowInList(false)
      setShowInDetail(true)
      setDescription('')
      setOptions([])
    }
  }, [field, isOpen])

  if (!isOpen) return null

  const autoKey = fieldName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

  const handleAddOption = () => {
    const v = newOption.trim()
    if (v && !options.includes(v)) {
      setOptions([...options, v])
      setNewOption('')
    }
  }

  const handleRemoveOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx))
  }

  const handleSubmit = () => {
    if (!fieldName.trim()) return
    onSave({
      entity_type: 'contact',
      field_name: fieldName.trim(),
      field_key: fieldKey || autoKey,
      field_type: fieldType,
      is_required: isRequired,
      show_in_list: showInList,
      show_in_detail: showInDetail,
      description: description || null,
      options: ['select', 'multi_select'].includes(fieldType) ? options : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900">
          {field ? 'Edit Custom Field' : 'Add Custom Field'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {field ? 'Update this custom field for contact records.' : 'Create a new custom field that will appear on all contact records.'}
        </p>

        <div className="mt-5 space-y-4">
          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Field Name</label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => {
                setFieldName(e.target.value)
                if (!field) setFieldKey('')
              }}
              placeholder="e.g. Company Name"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Field Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Field Key</label>
            <input
              type="text"
              value={fieldKey || autoKey}
              onChange={(e) => setFieldKey(e.target.value)}
              placeholder="auto_generated_key"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-0.5 text-xs text-gray-400">Used as the column identifier in the database.</p>
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Field Type</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {FIELD_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFieldType(opt.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                      fieldType === opt.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Options (for select/multi_select) */}
          {['select', 'multi_select'].includes(fieldType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Options</label>
              <div className="mt-1 space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm">{opt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                    placeholder="Add option..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this field"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Required field</span>
              <button
                type="button"
                onClick={() => setIsRequired(!isRequired)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  isRequired ? 'bg-emerald-500' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  isRequired && 'translate-x-5'
                )} />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Show in contact list</span>
              <button
                type="button"
                onClick={() => setShowInList(!showInList)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  showInList ? 'bg-emerald-500' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  showInList && 'translate-x-5'
                )} />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Show in contact detail</span>
              <button
                type="button"
                onClick={() => setShowInDetail(!showInDetail)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  showInDetail ? 'bg-emerald-500' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  showInDetail && 'translate-x-5'
                )} />
              </button>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!fieldName.trim() || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {field ? 'Update Field' : 'Create Field'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Fields Tab ─────────────────────────────────────────────

function ContactFieldsTab() {
  const { toast } = useToast()
  const { data: customFields = [], isLoading } = useCustomFieldDefinitions('contact')
  const createField = useCreateCustomField()
  const updateField = useUpdateCustomField()
  const deleteField = useDeleteCustomField()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sortedCustomFields = useMemo(
    () => [...customFields].sort((a, b) => a.sort_order - b.sort_order),
    [customFields]
  )

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (editingField) {
        await updateField.mutateAsync({ id: editingField.id, data })
        toast({ type: 'success', message: 'Field updated' })
      } else {
        await createField.mutateAsync(data as never)
        toast({ type: 'success', message: 'Custom field created' })
      }
      setModalOpen(false)
      setEditingField(null)
    } catch {
      toast({ type: 'error', message: 'Failed to save field' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteField.mutateAsync(id)
      toast({ type: 'success', message: 'Field deleted' })
      setDeletingId(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete field' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contact Record Fields</h2>
          <p className="text-sm text-gray-500">
            View built-in columns and manage custom fields on your contact records.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingField(null)
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Custom Field
        </button>
      </div>

      {/* Built-in Fields */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Standard Fields ({STANDARD_CONTACT_FIELDS.length})
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Built-in contact columns. These cannot be removed.
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {STANDARD_CONTACT_FIELDS.map((field) => {
            const Icon = getFieldTypeIcon(field.type)
            return (
              <div key={field.key} className="flex items-center gap-4 px-6 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <Icon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{field.label}</p>
                  <p className="text-xs text-gray-400 font-mono">{field.key}</p>
                </div>
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500 capitalize">
                  {field.type}
                </span>
                {field.required && (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                    Required
                  </span>
                )}
                <Lock className="h-3.5 w-3.5 text-gray-300" />
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom Fields */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Columns3 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900">
              Custom Fields ({sortedCustomFields.length})
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Custom columns you've added. Click to edit or manage visibility.
          </p>
        </div>

        {sortedCustomFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">No custom fields yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Add custom columns to capture additional data on contacts.
            </p>
            <button
              onClick={() => {
                setEditingField(null)
                setModalOpen(true)
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <Plus className="h-4 w-4" />
              Create your first custom field
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedCustomFields.map((field) => {
              const Icon = getFieldTypeIcon(field.field_type)
              return (
                <div key={field.id} className="flex items-center gap-4 px-6 py-3 group hover:bg-gray-50/50">
                  <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <Icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{field.field_name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400 font-mono">{field.field_key}</p>
                      {field.description && (
                        <p className="text-xs text-gray-400 truncate">— {field.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600 capitalize">
                    {field.field_type.replace('_', ' ')}
                  </span>
                  {field.is_required && (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                      Required
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {field.show_in_list ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <ToggleRight className="h-3.5 w-3.5" /> List
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <ToggleLeft className="h-3.5 w-3.5" /> List
                      </span>
                    )}
                    {field.show_in_detail ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <ToggleRight className="h-3.5 w-3.5" /> Detail
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <ToggleLeft className="h-3.5 w-3.5" /> Detail
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingField(field)
                        setModalOpen(true)
                      }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(field.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900">How custom fields work</p>
          <p className="mt-1 text-xs text-blue-700">
            Custom fields are stored as additional columns on every contact record.
            They appear in contact detail views and, if enabled, in the contacts list.
            Fields with "Show in List" will appear as columns in the contacts table.
          </p>
        </div>
      </div>

      {/* Custom Field Modal */}
      <CustomFieldModal
        isOpen={modalOpen}
        field={editingField}
        onClose={() => {
          setModalOpen(false)
          setEditingField(null)
        }}
        onSave={handleSave}
        saving={createField.isPending || updateField.isPending}
      />

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Custom Field</h3>
            <p className="mt-2 text-sm text-gray-500">
              This will remove this custom field and all its values from every contact record.
              This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteField.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteField.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Form Templates Tab (existing) ──────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-50 text-gray-600 ring-gray-500/20' },
  published: { label: 'Published', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  archived: { label: 'Archived', className: 'bg-gray-50 text-gray-500 ring-gray-400/20' },
}

const DEFAULT_CATEGORIES = [
  { key: 'registration', label: 'Registration' },
  { key: 'health', label: 'Health & Safety' },
  { key: 'consent', label: 'Consent' },
  { key: 'hr', label: 'HR' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'other', label: 'Other' },
]

function DeleteConfirmModal({
  formName, isOpen, isDeleting, onConfirm, onCancel, permanent,
}: {
  formName: string; isOpen: boolean; isDeleting: boolean; onConfirm: () => void; onCancel: () => void; permanent?: boolean
}) {
  const [confirmText, setConfirmText] = useState('')
  useEffect(() => { if (isOpen) setConfirmText('') }, [isOpen])
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button onClick={onCancel} className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{permanent ? 'Permanently Delete Form' : 'Delete Form'}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {permanent ? (<>This will <span className="font-semibold text-red-600">permanently delete</span> <span className="font-semibold text-gray-900">{formName}</span> and all submissions.</>) : (<>Move <span className="font-semibold text-gray-900">{formName}</span> to trash. Restore within 30 days.</>)}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <label className="block text-sm font-medium text-gray-700">Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm</label>
          <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE here" autoFocus className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} disabled={confirmText !== 'DELETE' || isDeleting} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {permanent ? 'Delete Permanently' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormTemplatesTab() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [sp, setSp] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; permanent?: boolean } | null>(null)

  const categoryFilter = sp.get('category') || 'all'
  const setCategoryFilter = (cat: string) => {
    if (cat === 'all') sp.delete('category'); else sp.set('category', cat)
    setSp(sp, { replace: true })
  }

  const { data: orgSettings } = useOrgSettings()
  const rawCats = (orgSettings?.settings as Record<string, unknown>)?.form_categories
  const formCategories = Array.isArray(rawCats) && rawCats.length > 0 ? (rawCats as { key: string; label: string }[]) : DEFAULT_CATEGORIES

  const isTrashView = statusFilter === 'trash'
  const { data: templates = [], isLoading, error } = useFormTemplates({ status: statusFilter !== 'all' && statusFilter !== 'trash' ? statusFilter : undefined, category: categoryFilter !== 'all' ? categoryFilter : undefined })
  const { data: trashedTemplates = [], isLoading: isLoadingTrash, error: trashError } = useTrashedForms()
  const duplicateTemplate = useDuplicateFormTemplate()
  const deleteTemplate = useDeleteFormTemplate()
  const restoreTemplate = useRestoreFormTemplate()
  const permanentDeleteTemplate = usePermanentDeleteFormTemplate()

  const displayed = isTrashView ? trashedTemplates : templates
  const filtered = displayed.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const loading = isTrashView ? isLoadingTrash : isLoading
  const err = isTrashView ? trashError : error

  const catLabels: Record<string, string> = Object.fromEntries(formCategories.map((c) => [c.key, c.label]))

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        <button onClick={() => setCategoryFilter('all')} className={cn('shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium', categoryFilter === 'all' ? 'border-b-2 border-emerald-600 text-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700')}>All</button>
        {formCategories.map((c) => (
          <button key={c.key} onClick={() => setCategoryFilter(c.key)} className={cn('shrink-0 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium', categoryFilter === c.key ? 'border-b-2 border-emerald-600 text-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700')}>{c.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search forms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
          <option value="trash">Trash</option>
        </select>
        <button onClick={() => navigate('/app/forms/new')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Form
        </button>
      </div>

      {isTrashView && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Trash2 className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Trash</p>
            <p className="text-xs text-amber-600">Items auto-delete after 30 days.</p>
          </div>
        </div>
      )}

      {loading && <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Failed to load forms.</div>}

      {!loading && !err && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const st = statusConfig[t.status] ?? statusConfig.draft
            const isTrashed = isTrashView
            return (
              <div key={t.id} className={cn('group relative rounded-xl border bg-white shadow-sm transition-all hover:shadow-md', isTrashed ? 'border-gray-200 opacity-75 hover:opacity-100' : 'border-gray-100 hover:border-gray-200')}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 cursor-pointer" onClick={() => !isTrashed && navigate(`/app/forms/${t.id}`)}>
                      <h3 className={cn('text-base font-semibold', isTrashed ? 'text-gray-500' : 'text-gray-900 group-hover:text-emerald-600')}>{t.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isTrashed && <span className={cn('inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', st.className)}>{st.label}</span>}
                      <div className="relative">
                        <button onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><MoreHorizontal className="h-4 w-4" /></button>
                        {openMenuId === t.id && (
                          <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            {isTrashed ? (
                              <>
                                <button onClick={async () => { try { await restoreTemplate.mutateAsync(t.id); toast({ type: 'success', message: 'Restored' }); setOpenMenuId(null) } catch { toast({ type: 'error', message: 'Failed' }) } }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                                <button onClick={() => { setDeleteTarget({ id: t.id, name: t.name, permanent: true }); setOpenMenuId(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete Permanently</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { navigate(`/app/forms/${t.id}`); setOpenMenuId(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Edit className="h-3.5 w-3.5" /> Edit</button>
                                <button onClick={async () => { try { await duplicateTemplate.mutateAsync(t.id); toast({ type: 'success', message: 'Duplicated' }); setOpenMenuId(null) } catch { toast({ type: 'error', message: 'Failed' }) } }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
                                <button onClick={() => { setDeleteTarget({ id: t.id, name: t.name }); setOpenMenuId(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {t.description && <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{t.description}</p>}
                  {isTrashed && t.deleted_at && <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600"><Clock className="h-3.5 w-3.5" />{Math.max(0, Math.ceil((new Date(new Date(t.deleted_at).getTime() + 30 * 86400000).getTime() - Date.now()) / 86400000))} days left</div>}
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" />{t.field_count} fields</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{t.submission_count} submissions</span>
                    {t.require_signature && <span className="inline-flex items-center gap-1 text-amber-500"><PenTool className="h-3.5 w-3.5" />E-Sign</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{catLabels[t.category] ?? t.category}</span>
                    <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !err && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          {isTrashView ? (<><Trash2 className="h-10 w-10 text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-900">Trash is empty</p></>) : (<><FileText className="h-10 w-10 text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-900">No forms found</p></>)}
        </div>
      )}

      <DeleteConfirmModal
        formName={deleteTarget?.name ?? ''}
        isOpen={deleteTarget !== null}
        isDeleting={deleteTemplate.isPending || permanentDeleteTemplate.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return
          try { if (deleteTarget.permanent) { await permanentDeleteTemplate.mutateAsync(deleteTarget.id); toast({ type: 'success', message: 'Permanently deleted' }) } else { await deleteTemplate.mutateAsync(deleteTarget.id); toast({ type: 'success', message: 'Moved to trash' }) } setDeleteTarget(null); setOpenMenuId(null) } catch { toast({ type: 'error', message: 'Failed to delete' }) }
        }}
        onCancel={() => setDeleteTarget(null)}
        permanent={deleteTarget?.permanent}
      />
    </div>
  )
}

// ─── Main FormsPage with tabs ───────────────────────────────────────

type PageTab = 'fields' | 'templates'

export function FormsPage() {
  const [activeTab, setActiveTab] = useState<PageTab>('fields')

  const tabs: { id: PageTab; label: string; icon: typeof Database }[] = [
    { id: 'fields', label: 'Contact Fields', icon: Database },
    { id: 'templates', label: 'Form Templates', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Forms & Fields</h1>
            <p className="text-sm text-gray-500">
              Manage contact record fields and build custom forms
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'fields' && <ContactFieldsTab />}
      {activeTab === 'templates' && <FormTemplatesTab />}
    </div>
  )
}

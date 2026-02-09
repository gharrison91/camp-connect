import { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Loader2,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  List,
  CheckSquare,
  CircleDot,
  Minus,
  PenTool,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateHealthTemplate } from '@/hooks/useHealthForms'
import type { FormFieldDefinition } from '@/types/health'

const fieldTypes: { value: FormFieldDefinition['type']; label: string; icon: typeof Type }[] = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'multiselect', label: 'Multi-Select', icon: CheckSquare },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'radio', label: 'Radio', icon: CircleDot },
  { value: 'section', label: 'Section Header', icon: Minus },
  { value: 'signature', label: 'Signature', icon: PenTool },
]

export function FormBuilderModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('health')
  const [requiredForReg, setRequiredForReg] = useState(false)
  const [fields, setFields] = useState<FormFieldDefinition[]>([])
  const [editingField, setEditingField] = useState<string | null>(null)

  const createTemplate = useCreateHealthTemplate()

  const addField = (type: FormFieldDefinition['type']) => {
    const newField: FormFieldDefinition = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: type === 'section' ? 'Section Title' : '',
      required: false,
      order: fields.length,
      options: ['select', 'multiselect', 'radio'].includes(type) ? ['Option 1'] : undefined,
    }
    setFields([...fields, newField])
    setEditingField(newField.id)
  }

  const updateField = (id: string, updates: Partial<FormFieldDefinition>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
    if (editingField === id) setEditingField(null)
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= fields.length) return
    ;[newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
    newFields.forEach((f, i) => (f.order = i))
    setFields(newFields)
  }

  const addOption = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return
    updateField(fieldId, {
      options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`],
    })
  }

  const updateOption = (fieldId: string, optIndex: number, value: string) => {
    const field = fields.find((f) => f.id === fieldId)
    if (!field?.options) return
    const newOpts = [...field.options]
    newOpts[optIndex] = value
    updateField(fieldId, { options: newOpts })
  }

  const removeOption = (fieldId: string, optIndex: number) => {
    const field = fields.find((f) => f.id === fieldId)
    if (!field?.options) return
    updateField(fieldId, { options: field.options.filter((_, i) => i !== optIndex) })
  }

  const handleSave = async () => {
    if (!name || fields.length === 0) return
    await createTemplate.mutateAsync({
      name,
      description: description || undefined,
      category,
      fields,
      required_for_registration: requiredForReg,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="w-full max-w-5xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Form Builder</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left: Builder */}
          <div className="flex-1 border-r border-gray-100 p-6">
            {/* Template Info */}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Template Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., General Health Form"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="health">Health</option>
                    <option value="medical">Medical</option>
                    <option value="emergency">Emergency</option>
                    <option value="dietary">Dietary</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={requiredForReg}
                      onChange={(e) => setRequiredForReg(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Required for registration
                  </label>
                </div>
              </div>
            </div>

            {/* Field Type Buttons */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-gray-700">Add Field</p>
              <div className="flex flex-wrap gap-2">
                {fieldTypes.map((ft) => {
                  const Icon = ft.icon
                  return (
                    <button
                      key={ft.value}
                      onClick={() => addField(ft.value)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {ft.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Field List */}
            <div className="mt-6 space-y-2">
              {fields.map((field, index) => {
                const isEditing = editingField === field.id
                const typeInfo = fieldTypes.find((ft) => ft.value === field.type)
                const TypeIcon = typeInfo?.icon || Type

                return (
                  <div
                    key={field.id}
                    className={cn(
                      'rounded-lg border transition-colors',
                      isEditing ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 bg-white'
                    )}
                  >
                    {/* Field Header */}
                    <div
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                      onClick={() => setEditingField(isEditing ? null : field.id)}
                    >
                      <GripVertical className="h-4 w-4 text-gray-300" />
                      <TypeIcon className="h-4 w-4 text-gray-400" />
                      <span className="flex-1 text-sm font-medium text-gray-900">
                        {field.label || `(${typeInfo?.label || field.type})`}
                      </span>
                      {field.required && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">Required</span>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveField(index, 'up') }}
                          disabled={index === 0}
                          className="rounded p-0.5 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveField(index, 'down') }}
                          disabled={index === fields.length - 1}
                          className="rounded p-0.5 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeField(field.id) }}
                          className="rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Field Editor */}
                    {isEditing && (
                      <div className="space-y-3 border-t border-gray-100 px-3 py-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">Description (optional)</label>
                          <input
                            type="text"
                            value={field.description || ''}
                            onChange={(e) => updateField(field.id, { description: e.target.value })}
                            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        {field.type !== 'section' && (
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                            />
                            Required field
                          </label>
                        )}
                        {/* Options for select/multiselect/radio */}
                        {field.options && (
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Options</label>
                            <div className="space-y-1">
                              {field.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                                  />
                                  <button
                                    onClick={() => removeOption(field.id, optIdx)}
                                    className="text-red-400 hover:text-red-600"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addOption(field.id)}
                                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                              >
                                <Plus className="h-3 w-3" />
                                Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {fields.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
                  <p className="text-sm text-gray-500">
                    Click the buttons above to add fields to your form
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="w-full lg:w-80 p-6">
            <h3 className="text-sm font-medium text-gray-700">Preview</h3>
            <div className="mt-3 space-y-4">
              {fields.length === 0 ? (
                <p className="text-xs text-gray-400">Add fields to see a preview</p>
              ) : (
                fields.map((field) => (
                  <div key={field.id}>
                    {field.type === 'section' ? (
                      <h4 className="border-b border-gray-200 pb-1 text-sm font-semibold text-gray-800">
                        {field.label || 'Section'}
                      </h4>
                    ) : (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          {field.label || '(untitled)'}{' '}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.description && (
                          <p className="mb-1 text-xs text-gray-400">{field.description}</p>
                        )}
                        {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
                          <input type={field.type} disabled className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs" />
                        )}
                        {field.type === 'textarea' && (
                          <textarea disabled rows={2} className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs" />
                        )}
                        {field.type === 'select' && (
                          <select disabled className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs">
                            <option>Select...</option>
                            {field.options?.map((o) => <option key={o}>{o}</option>)}
                          </select>
                        )}
                        {field.type === 'radio' && (
                          <div className="space-y-1">
                            {field.options?.map((o) => (
                              <label key={o} className="flex items-center gap-1 text-xs text-gray-600">
                                <input type="radio" disabled className="h-3 w-3" /> {o}
                              </label>
                            ))}
                          </div>
                        )}
                        {field.type === 'checkbox' && (
                          <label className="flex items-center gap-1 text-xs text-gray-600">
                            <input type="checkbox" disabled className="h-3 w-3" /> {field.label}
                          </label>
                        )}
                        {field.type === 'multiselect' && (
                          <div className="space-y-1">
                            {field.options?.map((o) => (
                              <label key={o} className="flex items-center gap-1 text-xs text-gray-600">
                                <input type="checkbox" disabled className="h-3 w-3" /> {o}
                              </label>
                            ))}
                          </div>
                        )}
                        {field.type === 'signature' && (
                          <div className="rounded border border-dashed border-gray-300 bg-gray-50 py-4 text-center text-xs text-gray-400">
                            Signature field
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name || fields.length === 0 || createTemplate.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {createTemplate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Template
          </button>
        </div>
      </div>
    </div>
  )
}

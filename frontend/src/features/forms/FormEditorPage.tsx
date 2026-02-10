/**
 * Camp Connect - Drag & Drop Form Builder / Editor
 * HubSpot-style form builder with field palette, canvas, and settings.
 * Includes e-signature field type, custom HTML/CSS fields, and code editor mode.
 */

import { useState, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Loader2,
  GripVertical,
  Trash2,
  Settings2,
  X,
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Calendar,
  List,
  CheckSquare,
  Circle,
  Upload,
  PenTool,
  Heading,
  FileText,
  Minus,
  ToggleLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Code,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFormTemplate, useUpdateFormTemplate } from '@/hooks/useForms'
import type { FormFieldDef, FormTemplateUpdate } from '@/hooks/useForms'
import { useToast } from '@/components/ui/Toast'

// ─── Field Type Palette ─────────────────────────────────────

interface FieldTypeConfig {
  type: string
  label: string
  icon: React.ElementType
  category: 'input' | 'selection' | 'layout' | 'special'
  defaults: Partial<FormFieldDef>
}

const FIELD_TYPES: FieldTypeConfig[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: Type,
    category: 'input',
    defaults: { placeholder: 'Enter text...' },
  },
  {
    type: 'textarea',
    label: 'Long Text',
    icon: AlignLeft,
    category: 'input',
    defaults: { placeholder: 'Enter detailed response...' },
  },
  {
    type: 'number',
    label: 'Number',
    icon: Hash,
    category: 'input',
    defaults: { placeholder: '0' },
  },
  {
    type: 'email',
    label: 'Email',
    icon: Mail,
    category: 'input',
    defaults: { placeholder: 'email@example.com' },
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: Phone,
    category: 'input',
    defaults: { placeholder: '(555) 123-4567' },
  },
  {
    type: 'date',
    label: 'Date',
    icon: Calendar,
    category: 'input',
    defaults: { placeholder: 'Select date...' },
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: List,
    category: 'selection',
    defaults: {
      placeholder: 'Select an option...',
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    category: 'selection',
    defaults: {
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'radio',
    label: 'Radio Group',
    icon: Circle,
    category: 'selection',
    defaults: {
      options: [
        { label: 'Option A', value: 'option_a' },
        { label: 'Option B', value: 'option_b' },
      ],
    },
  },
  {
    type: 'toggle',
    label: 'Toggle',
    icon: ToggleLeft,
    category: 'selection',
    defaults: {},
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: Upload,
    category: 'special',
    defaults: { placeholder: 'Click to upload or drag & drop' },
  },
  {
    type: 'signature',
    label: 'E-Signature',
    icon: PenTool,
    category: 'special',
    defaults: { placeholder: 'Sign here', validation: { signatureType: 'draw_or_type' } },
  },
  {
    type: 'custom_html',
    label: 'Custom HTML',
    icon: Code,
    category: 'special',
    defaults: {
      label: 'Custom HTML Block',
      html_content: '<div class="custom-block">\n  <h3>Custom Content</h3>\n  <p>Enter your HTML here...</p>\n</div>',
      css_content: '.custom-block {\n  padding: 1rem;\n  border-radius: 0.5rem;\n  background: #f9fafb;\n}',
    },
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: Heading,
    category: 'layout',
    defaults: { label: 'Section Heading' },
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: FileText,
    category: 'layout',
    defaults: { label: 'Informational text that appears on the form.' },
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: Minus,
    category: 'layout',
    defaults: {},
  },
]

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'input', label: 'Input Fields' },
  { key: 'selection', label: 'Selection Fields' },
  { key: 'special', label: 'Special Fields' },
  { key: 'layout', label: 'Layout Elements' },
]

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Fields to HTML Serializer ──────────────────────────────

function fieldsToHtml(
  fields: FormFieldDef[],
  formName: string,
  formDescription: string,
  formCustomCss: string
): string {
  const fieldHtmlParts = fields.map((f) => {
    const cssClass = f.custom_css ? ` class="${f.custom_css}"` : ''
    const req = f.required ? ' required' : ''
    const widthStyle = f.width === 'half' ? ' style="display:inline-block;width:49%"' : ''

    switch (f.type) {
      case 'heading':
        return `  <h2${cssClass}>${f.label}</h2>`
      case 'paragraph':
        return `  <p${cssClass}>${f.label}</p>`
      case 'divider':
        return `  <hr />`
      case 'custom_html':
        return [
          f.css_content ? `  <style>\n${f.css_content}\n  </style>` : '',
          `  ${f.html_content || '<!-- empty custom html -->'}`,
        ].filter(Boolean).join('\n')
      case 'textarea':
        return [
          `  <div${widthStyle}>`,
          `    <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>`,
          `    <textarea name="${f.id}" placeholder="${f.placeholder}"${req}${cssClass}></textarea>`,
          `  </div>`,
        ].join('\n')
      case 'select':
        return [
          `  <div${widthStyle}>`,
          `    <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>`,
          `    <select name="${f.id}"${req}${cssClass}>`,
          `      <option value="">${f.placeholder || 'Select...'}</option>`,
          ...(f.options || []).map((o) => `      <option value="${o.value}">${o.label}</option>`),
          `    </select>`,
          `  </div>`,
        ].join('\n')
      case 'checkbox':
      case 'radio':
        return [
          `  <div${widthStyle}>`,
          `    <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>`,
          ...(f.options || []).map(
            (o) =>
              `    <label><input type="${f.type}" name="${f.id}" value="${o.value}"${cssClass} /> ${o.label}</label>`
          ),
          `  </div>`,
        ].join('\n')
      case 'toggle':
        return [
          `  <div${widthStyle}>`,
          `    <label><input type="checkbox" name="${f.id}"${cssClass} /> ${f.label}</label>`,
          `  </div>`,
        ].join('\n')
      case 'file':
        return [
          `  <div${widthStyle}>`,
          `    <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>`,
          `    <input type="file" name="${f.id}"${req}${cssClass} />`,
          `  </div>`,
        ].join('\n')
      case 'signature':
        return [
          `  <div${widthStyle}>`,
          `    <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>`,
          `    <div class="signature-pad" data-field="${f.id}"><!-- Signature Canvas --></div>`,
          `  </div>`,
        ].join('\n')
      default:
        return [
          `  <div${widthStyle}>`,
          `    <label>${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>`,
          `    <input type="${f.type === 'phone' ? 'tel' : f.type}" name="${f.id}" placeholder="${f.placeholder}"${req}${cssClass} />`,
          `  </div>`,
        ].join('\n')
    }
  })

  const parts: string[] = []

  // Global CSS
  if (formCustomCss) {
    parts.push(`<style>\n${formCustomCss}\n</style>\n`)
  }

  parts.push(`<form class="camp-connect-form">`)
  parts.push(`  <h1>${formName || 'Untitled Form'}</h1>`)
  if (formDescription) {
    parts.push(`  <p class="form-description">${formDescription}</p>`)
  }
  parts.push('')
  parts.push(fieldHtmlParts.join('\n\n'))
  parts.push('')
  parts.push(`  <button type="submit">Submit</button>`)
  parts.push(`</form>`)

  return parts.join('\n')
}

// ─── Field Settings Panel ────────────────────────────────────

function FieldSettingsPanel({
  field,
  onUpdate,
  onClose,
}: {
  field: FormFieldDef
  onUpdate: (updates: Partial<FormFieldDef>) => void
  onClose: () => void
}) {
  const fieldType = FIELD_TYPES.find((ft) => ft.type === field.type)
  const hasOptions = ['select', 'checkbox', 'radio'].includes(field.type)
  const isLayout = ['heading', 'paragraph', 'divider'].includes(field.type)
  const isCustomHtml = field.type === 'custom_html'

  return (
    <div className="border-l border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {fieldType?.label ?? field.type} Settings
        </h3>
        <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {/* Label (not shown for custom_html) */}
        {!isCustomHtml && (
          <div>
            <label className="block text-xs font-medium text-gray-600">
              {isLayout ? 'Content' : 'Label'}
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Placeholder */}
        {!isLayout && !isCustomHtml && field.type !== 'toggle' && (
          <div>
            <label className="block text-xs font-medium text-gray-600">Placeholder</label>
            <input
              type="text"
              value={field.placeholder}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Required */}
        {!isLayout && !isCustomHtml && (
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">Required</label>
            <button
              onClick={() => onUpdate({ required: !field.required })}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                field.required ? 'bg-blue-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform',
                  field.required ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        )}

        {/* Width */}
        {!isLayout && !isCustomHtml && (
          <div>
            <label className="block text-xs font-medium text-gray-600">Width</label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => onUpdate({ width: 'full' })}
                className={cn(
                  'flex-1 rounded-md border px-3 py-1.5 text-xs font-medium',
                  field.width === 'full'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                Full Width
              </button>
              <button
                onClick={() => onUpdate({ width: 'half' })}
                className={cn(
                  'flex-1 rounded-md border px-3 py-1.5 text-xs font-medium',
                  field.width === 'half'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                Half Width
              </button>
            </div>
          </div>
        )}

        {/* Per-field CSS classes */}
        {!isLayout && !isCustomHtml && (
          <div>
            <label className="block text-xs font-medium text-gray-600">CSS Classes</label>
            <input
              type="text"
              value={field.custom_css || ''}
              onChange={(e) => onUpdate({ custom_css: e.target.value })}
              placeholder="e.g. mt-4 text-lg font-bold"
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Tailwind or custom CSS class names
            </p>
          </div>
        )}

        {/* Options for select/checkbox/radio */}
        {hasOptions && (
          <div>
            <label className="block text-xs font-medium text-gray-600">Options</label>
            <div className="mt-2 space-y-2">
              {(field.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => {
                      const newOpts = [...(field.options || [])]
                      newOpts[idx] = {
                        label: e.target.value,
                        value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                      }
                      onUpdate({ options: newOpts })
                    }}
                    className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const newOpts = (field.options || []).filter((_, i) => i !== idx)
                      onUpdate({ options: newOpts })
                    }}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOpts = [
                    ...(field.options || []),
                    { label: `Option ${(field.options || []).length + 1}`, value: `option_${(field.options || []).length + 1}` },
                  ]
                  onUpdate({ options: newOpts })
                }}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-3 w-3" />
                Add Option
              </button>
            </div>
          </div>
        )}

        {/* Signature-specific settings */}
        {field.type === 'signature' && (
          <div>
            <label className="block text-xs font-medium text-gray-600">Signature Type</label>
            <select
              value={(field.validation?.signatureType as string) || 'draw_or_type'}
              onChange={(e) =>
                onUpdate({
                  validation: { ...field.validation, signatureType: e.target.value },
                })
              }
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="draw_or_type">Draw or Type</option>
              <option value="draw_only">Draw Only</option>
              <option value="type_only">Type Only</option>
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              E-signatures are legally binding under ESIGN Act & UETA.
            </p>
          </div>
        )}

        {/* Custom HTML field settings */}
        {isCustomHtml && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600">Block Label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">HTML Content</label>
              <textarea
                value={field.html_content || ''}
                onChange={(e) => onUpdate({ html_content: e.target.value })}
                rows={10}
                className="mt-1 w-full rounded-md border border-gray-200 bg-gray-900 px-3 py-2 font-mono text-xs text-green-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="<div>Your custom HTML...</div>"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">CSS Styles</label>
              <textarea
                value={field.css_content || ''}
                onChange={(e) => onUpdate({ css_content: e.target.value })}
                rows={6}
                className="mt-1 w-full rounded-md border border-gray-200 bg-gray-900 px-3 py-2 font-mono text-xs text-blue-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder=".my-class { color: red; }"
                spellCheck={false}
              />
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                <strong>Admin Only:</strong> Custom HTML is rendered as-is in the form builder.
                Content is sanitized when displayed to end users for security.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Field Preview Component ─────────────────────────────────

function FieldPreview({
  field,
  isSelected,
  onSelect,
  onDelete,
  dragHandleProps,
}: {
  field: FormFieldDef
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  dragHandleProps?: Record<string, unknown>
}) {
  // Layout fields
  if (field.type === 'heading') {
    return (
      <div
        className={cn(
          'group relative rounded-lg border-2 p-4 transition-all cursor-pointer',
          isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-transparent hover:border-gray-200'
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2">
          <div {...(dragHandleProps || {})} className="cursor-grab text-gray-300 hover:text-gray-500">
            <GripVertical className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="ml-auto opacity-0 group-hover:opacity-100 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  if (field.type === 'paragraph') {
    return (
      <div
        className={cn(
          'group relative rounded-lg border-2 p-4 transition-all cursor-pointer',
          isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-transparent hover:border-gray-200'
        )}
        onClick={onSelect}
      >
        <div className="flex items-start gap-2">
          <div {...(dragHandleProps || {})} className="mt-0.5 cursor-grab text-gray-300 hover:text-gray-500">
            <GripVertical className="h-4 w-4" />
          </div>
          <p className="flex-1 text-sm text-gray-600">{field.label}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  if (field.type === 'divider') {
    return (
      <div
        className={cn(
          'group relative rounded-lg border-2 p-4 transition-all cursor-pointer',
          isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-transparent hover:border-gray-200'
        )}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2">
          <div {...(dragHandleProps || {})} className="cursor-grab text-gray-300 hover:text-gray-500">
            <GripVertical className="h-4 w-4" />
          </div>
          <hr className="flex-1 border-gray-300" />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Custom HTML field
  if (field.type === 'custom_html') {
    const preview = field.html_content
      ? field.html_content.length > 120
        ? field.html_content.slice(0, 120) + '...'
        : field.html_content
      : '<!-- empty -->'

    return (
      <div
        className={cn(
          'group relative rounded-lg border-2 p-4 transition-all cursor-pointer',
          isSelected ? 'border-purple-500 bg-purple-50/30' : 'border-transparent hover:border-gray-200'
        )}
        onClick={onSelect}
      >
        <div className="flex items-start gap-2">
          <div {...(dragHandleProps || {})} className="mt-0.5 cursor-grab text-gray-300 hover:text-gray-500">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <label className="flex items-center gap-1.5 text-sm font-medium text-purple-700">
              <Code className="h-3.5 w-3.5 text-purple-500" />
              {field.label}
            </label>
            <div className="mt-2 rounded-lg border border-purple-200 bg-gray-900 p-3">
              <pre className="overflow-hidden text-xs leading-relaxed text-purple-300 whitespace-pre-wrap">
                {preview}
              </pre>
            </div>
            {field.css_content && (
              <p className="mt-1 text-xs text-purple-400">
                + custom CSS ({field.css_content.split('\n').length} lines)
              </p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Signature field
  if (field.type === 'signature') {
    return (
      <div
        className={cn(
          'group relative rounded-lg border-2 p-4 transition-all cursor-pointer',
          isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-transparent hover:border-gray-200'
        )}
        onClick={onSelect}
      >
        <div className="flex items-start gap-2">
          <div {...(dragHandleProps || {})} className="mt-0.5 cursor-grab text-gray-300 hover:text-gray-500">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <PenTool className="h-3.5 w-3.5 text-amber-500" />
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-2 flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <span className="text-sm text-gray-400">Signature Canvas</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Legally binding e-signature (ESIGN Act / UETA compliant)
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Regular fields
  return (
    <div
      className={cn(
        'group relative rounded-lg border-2 p-4 transition-all cursor-pointer',
        isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-transparent hover:border-gray-200'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <div {...(dragHandleProps || {})} className="mt-0.5 cursor-grab text-gray-300 hover:text-gray-500">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              disabled
              placeholder={field.placeholder}
              className="mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 placeholder:text-gray-300"
              rows={3}
            />
          ) : field.type === 'select' ? (
            <select
              disabled
              className="mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
            >
              <option>{field.placeholder || 'Select...'}</option>
            </select>
          ) : field.type === 'checkbox' || field.type === 'radio' ? (
            <div className="mt-1.5 space-y-1.5">
              {(field.options || []).map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <input
                    type={field.type}
                    disabled
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          ) : field.type === 'toggle' ? (
            <div className="mt-1.5">
              <div className="h-6 w-11 rounded-full bg-gray-200" />
            </div>
          ) : field.type === 'file' ? (
            <div className="mt-1.5 flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
              <div className="text-center">
                <Upload className="mx-auto h-5 w-5 text-gray-300" />
                <p className="mt-1 text-xs text-gray-400">{field.placeholder}</p>
              </div>
            </div>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              disabled
              placeholder={field.placeholder}
              className="mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 placeholder:text-gray-300"
            />
          )}
          {field.custom_css && (
            <p className="mt-1 text-xs text-gray-400 font-mono">
              .{field.custom_css.split(' ')[0]}
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Form Editor ────────────────────────────────────────

export function FormEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const { data: template, isLoading, error } = useFormTemplate(id)
  const updateTemplate = useUpdateFormTemplate()

  const [fields, setFields] = useState<FormFieldDef[]>([])
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('other')
  const [formStatus, setFormStatus] = useState<string>('draft')
  const [requireSignature, setRequireSignature] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual')
  const [formCustomCss, setFormCustomCss] = useState('')

  // Initialize from loaded template
  if (template && !initialized) {
    setFields(template.fields || [])
    setFormName(template.name)
    setFormDescription(template.description || '')
    setFormCategory(template.category)
    setFormStatus(template.status)
    setRequireSignature(template.require_signature)
    setFormCustomCss((template.settings as Record<string, unknown>)?.custom_css as string || '')
    setInitialized(true)
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

  // Generate HTML export (memoized)
  const htmlExport = useMemo(
    () => fieldsToHtml(fields, formName, formDescription, formCustomCss),
    [fields, formName, formDescription, formCustomCss]
  )

  // ─── Add Field ──────────────────────────────────────────────
  const addField = useCallback(
    (config: FieldTypeConfig) => {
      const newField: FormFieldDef = {
        id: generateFieldId(),
        type: config.type,
        label: config.label,
        placeholder: config.defaults.placeholder ?? '',
        required: false,
        width: 'full',
        options: config.defaults.options ?? [],
        validation: config.defaults.validation ?? {},
        order: fields.length,
        ...(config.defaults.html_content !== undefined && { html_content: config.defaults.html_content }),
        ...(config.defaults.css_content !== undefined && { css_content: config.defaults.css_content }),
      }
      setFields((prev) => [...prev, newField])
      setSelectedFieldId(newField.id)
    },
    [fields.length]
  )

  // ─── Update Field ──────────────────────────────────────────
  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormFieldDef>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
      )
    },
    []
  )

  // ─── Delete Field ──────────────────────────────────────────
  const deleteField = useCallback(
    (fieldId: string) => {
      setFields((prev) => prev.filter((f) => f.id !== fieldId))
      if (selectedFieldId === fieldId) setSelectedFieldId(null)
    },
    [selectedFieldId]
  )

  // ─── Drag & Drop Reorder ──────────────────────────────────
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const newFields = [...fields]
    const [dragged] = newFields.splice(draggedIndex, 1)
    newFields.splice(index, 0, dragged)
    setFields(newFields.map((f, i) => ({ ...f, order: i })))
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // ─── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!id) return
    try {
      const existingSettings = (template?.settings || {}) as Record<string, unknown>
      const data: FormTemplateUpdate = {
        name: formName,
        description: formDescription || undefined,
        category: formCategory,
        status: formStatus,
        require_signature: requireSignature || fields.some((f) => f.type === 'signature'),
        fields: fields.map((f, i) => ({ ...f, order: i })),
        settings: {
          ...existingSettings,
          custom_css: formCustomCss || undefined,
        },
      }
      await updateTemplate.mutateAsync({ id, data })
      toast({ type: 'success', message: 'Form saved successfully' })
    } catch {
      toast({ type: 'error', message: 'Failed to save form' })
    }
  }

  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ─── Copy HTML to Clipboard ─────────────────────────────────
  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlExport)
      toast({ type: 'success', message: 'HTML copied to clipboard' })
    } catch {
      toast({ type: 'error', message: 'Failed to copy' })
    }
  }

  // ─── Loading / Error States ────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/forms"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forms
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load form. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/app/forms"
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="border-0 bg-transparent text-lg font-semibold text-gray-900 focus:outline-none focus:ring-0"
            placeholder="Form Name"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Editor Mode Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setEditorMode('visual')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                editorMode === 'visual'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Visual
            </button>
            <button
              onClick={() => setEditorMode('code')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-l border-gray-200',
                editorMode === 'code'
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <Code className="h-3.5 w-3.5" />
              Code
            </button>
          </div>
          <select
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              showSettings
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={updateTemplate.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {updateTemplate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Code Editor Mode */}
      {editorMode === 'code' ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
            {/* Code editor toolbar */}
            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-medium text-gray-400">HTML Export (Read Only)</span>
              </div>
              <button
                onClick={copyHtml}
                className="inline-flex items-center gap-1.5 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                Copy HTML
              </button>
            </div>
            {/* Code content */}
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm leading-relaxed font-mono text-gray-300 whitespace-pre-wrap">
                {htmlExport}
              </pre>
            </div>
          </div>

          {/* Settings panel still available in code mode */}
          {showSettings && (
            <div className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Form Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="registration">Registration</option>
                    <option value="health">Health & Safety</option>
                    <option value="consent">Consent</option>
                    <option value="feedback">Feedback</option>
                    <option value="application">Application</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Require E-Signature</label>
                  <button
                    onClick={() => setRequireSignature(!requireSignature)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                      requireSignature ? 'bg-blue-600' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform',
                        requireSignature ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
                {/* Form-level Custom CSS */}
                <div>
                  <label className="block text-xs font-medium text-gray-600">Custom CSS (Global)</label>
                  <textarea
                    value={formCustomCss}
                    onChange={(e) => setFormCustomCss(e.target.value)}
                    rows={6}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-gray-900 px-3 py-2 font-mono text-xs text-blue-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder={`.camp-connect-form {\n  font-family: 'Inter', sans-serif;\n}\n.required { color: red; }`}
                    spellCheck={false}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    CSS applied to the entire form
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Fields: {fields.length} &middot; Version: {template.version}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Visual Editor Mode */
        <div className="flex flex-1 overflow-hidden">
          {/* Left Palette */}
          <div className="w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Add Fields
            </h3>
            <div className="mt-3 space-y-3">
              {CATEGORIES.map((cat) => {
                const catFields = FIELD_TYPES.filter((ft) => ft.category === cat.key)
                const isCollapsed = collapsedCategories.has(cat.key)

                return (
                  <div key={cat.key}>
                    <button
                      onClick={() => toggleCategory(cat.key)}
                      className="flex w-full items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {cat.label}
                    </button>
                    {!isCollapsed && (
                      <div className="mt-1.5 space-y-1">
                        {catFields.map((ft) => {
                          const Icon = ft.icon
                          return (
                            <button
                              key={ft.type}
                              onClick={() => addField(ft)}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white hover:shadow-sm"
                            >
                              <Icon
                                className={cn(
                                  'h-4 w-4 shrink-0',
                                  ft.type === 'signature'
                                    ? 'text-amber-500'
                                    : ft.type === 'custom_html'
                                    ? 'text-purple-500'
                                    : 'text-gray-400'
                                )}
                              />
                              {ft.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Center Canvas */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
            <div className="mx-auto max-w-2xl">
              {/* Form Header */}
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border-0 bg-transparent text-xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  placeholder="Untitled Form"
                />
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-2 w-full resize-none border-0 bg-transparent text-sm text-gray-500 placeholder:text-gray-300 focus:outline-none"
                  placeholder="Add a description for this form..."
                  rows={2}
                />
              </div>

              {/* Fields */}
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white py-16">
                  <FileText className="h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-600">
                    No fields yet
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Click a field type on the left to add it to your form.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'rounded-xl border border-gray-200 bg-white shadow-sm transition-all',
                        draggedIndex === index && 'opacity-50'
                      )}
                    >
                      <FieldPreview
                        field={field}
                        isSelected={selectedFieldId === field.id}
                        onSelect={() => setSelectedFieldId(field.id)}
                        onDelete={() => deleteField(field.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Settings Panel */}
          {selectedField && (
            <div className="w-72 shrink-0 overflow-y-auto">
              <FieldSettingsPanel
                field={selectedField}
                onUpdate={(updates) => updateField(selectedField.id, updates)}
                onClose={() => setSelectedFieldId(null)}
              />
            </div>
          )}

          {/* Form Settings Panel */}
          {showSettings && !selectedField && (
            <div className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Form Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="registration">Registration</option>
                    <option value="health">Health & Safety</option>
                    <option value="consent">Consent</option>
                    <option value="feedback">Feedback</option>
                    <option value="application">Application</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Require E-Signature</label>
                  <button
                    onClick={() => setRequireSignature(!requireSignature)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                      requireSignature ? 'bg-blue-600' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform',
                        requireSignature ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {/* Form-level Custom CSS */}
                <div>
                  <label className="block text-xs font-medium text-gray-600">Custom CSS (Global)</label>
                  <textarea
                    value={formCustomCss}
                    onChange={(e) => setFormCustomCss(e.target.value)}
                    rows={6}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-gray-900 px-3 py-2 font-mono text-xs text-blue-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder={`.camp-connect-form {\n  font-family: 'Inter', sans-serif;\n}\n.required { color: red; }`}
                    spellCheck={false}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    CSS applied to the entire form
                  </p>
                </div>

                <p className="text-xs text-gray-400">
                  Fields: {fields.length} &middot; Version: {template.version}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

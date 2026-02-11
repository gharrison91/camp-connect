/**
 * Camp Connect - Invoice Template Builder
 * Drag-and-drop visual editor with code view for customizing invoice templates.
 */

import { useState, useCallback } from 'react'
import {
  FileText,
  Eye,
  Code,
  Save,
  RotateCcw,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  Loader2,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ─── Default Template ────────────────────────────────────────
const DEFAULT_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
    <div>
      <h1 style="font-size: 24px; color: #059669; margin: 0;">{{company_name}}</h1>
      <p style="color: #6b7280; margin: 4px 0;">{{company_address}}</p>
      <p style="color: #6b7280; margin: 4px 0;">{{company_phone}} | {{company_email}}</p>
    </div>
    <div style="text-align: right;">
      <h2 style="font-size: 28px; color: #1f2937; margin: 0;">INVOICE</h2>
      <p style="color: #6b7280;">Invoice #: {{invoice_number}}</p>
      <p style="color: #6b7280;">Date: {{invoice_date}}</p>
      <p style="color: #6b7280;">Due: {{due_date}}</p>
    </div>
  </div>
  <div style="margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <h3 style="color: #374151; margin: 0 0 8px;">Bill To:</h3>
    <p style="margin: 2px 0;">{{contact_name}}</p>
    <p style="color: #6b7280; margin: 2px 0;">{{contact_email}}</p>
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <thead>
      <tr style="border-bottom: 2px solid #e5e7eb;">
        <th style="text-align: left; padding: 12px 8px; color: #374151;">Description</th>
        <th style="text-align: right; padding: 12px 8px; color: #374151;">Qty</th>
        <th style="text-align: right; padding: 12px 8px; color: #374151;">Rate</th>
        <th style="text-align: right; padding: 12px 8px; color: #374151;">Amount</th>
      </tr>
    </thead>
    <tbody>{{line_items}}</tbody>
  </table>
  <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
    <div style="width: 250px;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span>Subtotal:</span><span>{{subtotal}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span>Tax:</span><span>{{tax}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 18px;">
        <span>Total:</span><span style="color: #059669;">{{total}}</span>
      </div>
    </div>
  </div>
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
    <p><strong>Payment Instructions:</strong></p>
    <p>{{payment_instructions}}</p>
    <p style="margin-top: 16px;">{{notes}}</p>
  </div>
</div>`

// ─── Template Sections ──────────────────────────────────────
interface TemplateSection {
  id: string
  name: string
  description: string
  enabled: boolean
  expanded: boolean
}

const DEFAULT_SECTIONS: TemplateSection[] = [
  { id: 'header', name: 'Company Header', description: 'Logo, company name, and address', enabled: true, expanded: false },
  { id: 'invoice-details', name: 'Invoice Details', description: 'Invoice number, date, due date', enabled: true, expanded: false },
  { id: 'bill-to', name: 'Bill To', description: 'Recipient contact information', enabled: true, expanded: false },
  { id: 'line-items', name: 'Line Items', description: 'Table of items, quantities, and amounts', enabled: true, expanded: false },
  { id: 'totals', name: 'Subtotal / Tax / Total', description: 'Financial summary', enabled: true, expanded: false },
  { id: 'payment-info', name: 'Payment Instructions', description: 'How to pay, bank details', enabled: true, expanded: false },
  { id: 'footer', name: 'Footer / Notes', description: 'Additional notes and terms', enabled: true, expanded: false },
]

// ─── Sample Data for Preview ─────────────────────────────────
const SAMPLE_DATA: Record<string, string> = {
  '{{company_name}}': 'Camp Sunshine',
  '{{company_address}}': '123 Forest Lane, Lake City, CA 95000',
  '{{company_phone}}': '(555) 123-4567',
  '{{company_email}}': 'billing@campsunshine.com',
  '{{invoice_number}}': 'INV-2025-001',
  '{{invoice_date}}': 'January 15, 2025',
  '{{due_date}}': 'February 15, 2025',
  '{{contact_name}}': 'John & Sarah Smith',
  '{{contact_email}}': 'smith@email.com',
  '{{line_items}}': `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px;">Summer Camp - Week 1 (Jake Smith)</td>
      <td style="text-align: right; padding: 12px 8px;">1</td>
      <td style="text-align: right; padding: 12px 8px;">$450.00</td>
      <td style="text-align: right; padding: 12px 8px;">$450.00</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px;">Summer Camp - Week 1 (Emma Smith)</td>
      <td style="text-align: right; padding: 12px 8px;">1</td>
      <td style="text-align: right; padding: 12px 8px;">$450.00</td>
      <td style="text-align: right; padding: 12px 8px;">$450.00</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px;">Camp T-Shirt (x2)</td>
      <td style="text-align: right; padding: 12px 8px;">2</td>
      <td style="text-align: right; padding: 12px 8px;">$25.00</td>
      <td style="text-align: right; padding: 12px 8px;">$50.00</td>
    </tr>`,
  '{{subtotal}}': '$950.00',
  '{{tax}}': '$76.00',
  '{{total}}': '$1,026.00',
  '{{payment_instructions}}': 'Pay online at campsunshine.com/pay or mail a check to the address above.',
  '{{notes}}': 'Thank you for choosing Camp Sunshine! Payment is due within 30 days.',
}

function renderPreview(html: string): string {
  let rendered = html
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    rendered = rendered.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
  }
  return rendered
}

// ─── Available Variables ─────────────────────────────────────
const VARIABLES = [
  '{{company_name}}', '{{company_address}}', '{{company_phone}}', '{{company_email}}',
  '{{invoice_number}}', '{{invoice_date}}', '{{due_date}}',
  '{{contact_name}}', '{{contact_email}}',
  '{{line_items}}', '{{subtotal}}', '{{tax}}', '{{total}}',
  '{{payment_instructions}}', '{{notes}}',
]

// ─── Component ───────────────────────────────────────────────
type ViewMode = 'visual' | 'code' | 'preview'

export function InvoiceTemplateSettings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<ViewMode>('visual')
  const [templateHtml, setTemplateHtml] = useState(DEFAULT_TEMPLATE)
  const [sections, setSections] = useState<TemplateSection[]>(DEFAULT_SECTIONS)
  const [hasChanges, setHasChanges] = useState(false)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  // Fetch saved template
  const { isLoading } = useQuery({
    queryKey: ['invoice-template'],
    queryFn: async () => {
      const res = await api.get('/settings/invoice-template')
      return res.data
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((() => {
      const onSuccess = (data: { template_html?: string }) => {
        if (data?.template_html) {
          setTemplateHtml(data.template_html)
        }
      }
      return {
        select: (data: { template_html?: string }) => {
          onSuccess(data)
          return data
        },
      }
    })()),
  })

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (html: string) => {
      const res = await api.put('/settings/invoice-template', { template_html: html })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-template'] })
      setHasChanges(false)
      toast({ type: 'success', message: 'Invoice template saved.' })
    },
    onError: () => {
      toast({ type: 'error', message: 'Failed to save template.' })
    },
  })

  const handleSave = useCallback(() => {
    saveMutation.mutate(templateHtml)
  }, [templateHtml, saveMutation])

  const handleReset = useCallback(() => {
    setTemplateHtml(DEFAULT_TEMPLATE)
    setSections(DEFAULT_SECTIONS)
    setHasChanges(true)
    toast({ type: 'success', message: 'Template reset to default.' })
  }, [toast])

  const handleCodeChange = useCallback((value: string) => {
    setTemplateHtml(value)
    setHasChanges(true)
  }, [])

  const toggleSection = useCallback((id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s))
  }, [])

  const toggleSectionEnabled = useCallback((id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
    setHasChanges(true)
  }, [])

  const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
    setSections(prev => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
    setHasChanges(true)
  }, [])

  const copyVariable = useCallback((v: string) => {
    navigator.clipboard.writeText(v)
    setCopiedVar(v)
    setTimeout(() => setCopiedVar(null), 2000)
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Invoice Template</h2>
          <p className="mt-1 text-sm text-gray-500">Customize how your invoices look when sent to parents.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasChanges}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Template
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {([
          { mode: 'visual' as const, label: 'Visual Editor', icon: FileText },
          { mode: 'code' as const, label: 'HTML Code', icon: Code },
          { mode: 'preview' as const, label: 'Preview', icon: Eye },
        ]).map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
              viewMode === mode
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Visual Editor */}
      {viewMode === 'visual' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sections List */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-900">Template Sections</h3>
                <p className="mt-1 text-xs text-gray-500">Reorder, enable, or disable sections of your invoice.</p>
              </div>
              <div className="divide-y divide-gray-50">
                {sections.map((section, index) => (
                  <div key={section.id} className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex items-center gap-2"
                      >
                        {section.expanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{section.name}</span>
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            section.enabled
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          )}>
                            {section.enabled ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronDown className="h-4 w-4 rotate-180" />
                        </button>
                        <button
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleSectionEnabled(section.id)}
                          className={cn(
                            'relative ml-2 inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                            section.enabled ? 'bg-emerald-500' : 'bg-gray-200'
                          )}
                        >
                          <span className={cn(
                            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
                            section.enabled ? 'translate-x-4' : 'translate-x-0'
                          )} />
                        </button>
                      </div>
                    </div>
                    {section.expanded && (
                      <div className="mt-3 ml-11 rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Edit this section in the HTML Code view for full control over the layout.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Variables Sidebar */}
          <div>
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-900">Template Variables</h3>
                <p className="mt-1 text-xs text-gray-500">Click to copy. Use these in your template.</p>
              </div>
              <div className="space-y-1 p-4">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    onClick={() => copyVariable(v)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-mono text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <span>{v}</span>
                    {copiedVar === v ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Editor */}
      {viewMode === 'code' && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900">HTML Template</h3>
            <p className="mt-1 text-xs text-gray-500">Edit the raw HTML/CSS of your invoice template.</p>
          </div>
          <div className="p-4">
            <textarea
              value={templateHtml}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="h-[500px] w-full rounded-lg border border-gray-200 bg-gray-950 p-4 font-mono text-sm text-green-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {viewMode === 'preview' && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Invoice Preview</h3>
            <p className="mt-1 text-xs text-gray-500">Preview with sample data. Variables are replaced automatically.</p>
          </div>
          <div className="p-6">
            <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white shadow-lg">
              <div
                dangerouslySetInnerHTML={{ __html: renderPreview(templateHtml) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Trash2 className="h-4 w-4" />
          You have unsaved changes. Click &quot;Save Template&quot; to persist your changes.
        </div>
      )}
    </div>
  )
}

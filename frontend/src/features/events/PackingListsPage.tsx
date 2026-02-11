/**
 * Camp Connect - Packing Lists Page
 * Template management and camper assignment tracking.
 */

import { useState } from 'react'
import {
  PackageCheck,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  CheckCircle2,
  ClipboardList,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  usePackingListTemplates,
  useCreatePackingListTemplate,
  useUpdatePackingListTemplate,
  useDeletePackingListTemplate,
  usePackingListAssignments,
  useAssignPackingList,
  useCheckPackingListItem,
  usePackingListStats,
} from '@/hooks/usePackingLists'
import { useEvents } from '@/hooks/useEvents'
import { useCampers } from '@/hooks/useCampers'
import type { PackingListTemplate, PackingListItem, PackingListAssignment } from '@/types'

const CATEGORIES = ['Clothing', 'Toiletries', 'Bedding', 'Equipment', 'Personal', 'Other'] as const

const CATEGORY_COLORS: Record<string, string> = {
  Clothing: 'bg-blue-100 text-blue-700',
  Toiletries: 'bg-pink-100 text-pink-700',
  Bedding: 'bg-purple-100 text-purple-700',
  Equipment: 'bg-amber-100 text-amber-700',
  Personal: 'bg-teal-100 text-teal-700',
  Other: 'bg-gray-100 text-gray-700',
}

const STATUS_BADGE: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-amber-100 text-amber-700',
  complete: 'bg-emerald-100 text-emerald-700',
}

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Complete',
}

// ────────────────────────────────────────────────────────────────
// Template Modal
// ────────────────────────────────────────────────────────────────

function TemplateModal({
  template,
  onClose,
}: {
  template: PackingListTemplate | null
  onClose: () => void
}) {
  const { toast } = useToast()
  const { data: events } = useEvents()
  const createTemplate = useCreatePackingListTemplate()
  const updateTemplate = useUpdatePackingListTemplate()

  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [eventId, setEventId] = useState(template?.event_id ?? '')
  const [items, setItems] = useState<PackingListItem[]>(
    template?.items ?? [{ name: '', category: 'Clothing', required: true, quantity: 1 }]
  )

  const addItem = () => {
    setItems([...items, { name: '', category: 'Other', required: false, quantity: 1 }])
  }

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: keyof PackingListItem, value: string | boolean | number) => {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = items.filter((i) => i.name.trim())
    if (!name.trim() || validItems.length === 0) {
      toast({ type: 'error', message: 'Name and at least one item are required' })
      return
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      event_id: eventId || null,
      items: validItems,
    }
    if (template) {
      updateTemplate.mutate(
        { id: template.id, ...payload },
        {
          onSuccess: () => { toast({ type: 'success', message: 'Template updated' }); onClose() },
          onError: () => toast({ type: 'error', message: 'Failed to update template' }),
        }
      )
    } else {
      createTemplate.mutate(payload, {
        onSuccess: () => { toast({ type: 'success', message: 'Template created' }); onClose() },
        onError: () => toast({ type: 'error', message: 'Failed to create template' }),
      })
    }
  }

  const saving = createTemplate.isPending || updateTemplate.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {template ? 'Edit Template' : 'New Packing List Template'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Template Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Camp 2026 Essentials"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description for parents..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Event */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Event (optional)</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">No specific event</option>
              {events?.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Items *</label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex-1 space-y-2">
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      placeholder="Item name"
                      className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(idx, 'category', e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-16 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) => updateItem(idx, 'required', e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="mt-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Saving...' : template ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Assign Modal
// ────────────────────────────────────────────────────────────────

function AssignModal({
  templates,
  onClose,
}: {
  templates: PackingListTemplate[]
  onClose: () => void
}) {
  const { toast } = useToast()
  const { data: campersData } = useCampers()
  const camperList = campersData?.items ?? []
  const assignMutation = useAssignPackingList()

  const [templateId, setTemplateId] = useState('')
  const [selectedCampers, setSelectedCampers] = useState<string[]>([])
  const [camperSearch, setCamperSearch] = useState('')

  const filteredCampers = camperList.filter(
    (c) =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(camperSearch.toLowerCase())
  )

  const toggleCamper = (id: string) => {
    setSelectedCampers((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedCampers(filteredCampers.map((c) => c.id))
  }

  const handleAssign = () => {
    if (!templateId || selectedCampers.length === 0) {
      toast({ type: 'error', message: 'Select a template and at least one camper' })
      return
    }
    assignMutation.mutate(
      { template_id: templateId, camper_ids: selectedCampers },
      {
        onSuccess: () => { toast({ type: 'success', message: `Assigned to ${selectedCampers.length} camper(s)` }); onClose() },
        onError: () => toast({ type: 'error', message: 'Failed to assign' }),
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Assign Packing List</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.items.length} items)</option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Campers ({selectedCampers.length} selected)
              </label>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                Select All
              </button>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={camperSearch}
                onChange={(e) => setCamperSearch(e.target.value)}
                placeholder="Search campers..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {filteredCampers.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCampers.includes(c.id)}
                    onChange={() => toggleCamper(c.id)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {c.first_name} {c.last_name}
                </label>
              ))}
              {filteredCampers.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">No campers found</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={assignMutation.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Checklist Detail (expanded assignment row)
// ────────────────────────────────────────────────────────────────

function ChecklistDetail({ assignment }: { assignment: PackingListAssignment }) {
  const { toast } = useToast()
  const checkItem = useCheckPackingListItem()

  const handleToggle = (itemName: string, currentlyChecked: boolean) => {
    checkItem.mutate(
      { assignmentId: assignment.id, item_name: itemName, checked: !currentlyChecked },
      { onError: () => toast({ type: 'error', message: 'Failed to update' }) }
    )
  }

  // Group items by category
  const grouped: Record<string, PackingListItem[]> = {}
  for (const item of assignment.items) {
    const cat = item.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }

  return (
    <div className="border-t bg-gray-50 px-6 py-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}`}>
                {category}
              </span>
              <span className="text-xs text-gray-400">
                {catItems.filter((i) => assignment.items_checked.includes(i.name)).length}/{catItems.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {catItems.map((item) => {
                const isChecked = assignment.items_checked.includes(item.name)
                return (
                  <label
                    key={item.name}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(item.name, isChecked)}
                      disabled={checkItem.isPending}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}>
                      {item.name}
                      {item.quantity > 1 && <span className="ml-1 text-gray-400">x{item.quantity}</span>}
                    </span>
                    {item.required && (
                      <span className="ml-auto text-[10px] font-medium text-red-400">REQ</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────

export function PackingListsPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<'templates' | 'assignments'>('templates')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PackingListTemplate | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null)

  const { data: templates = [], isLoading: loadingTemplates } = usePackingListTemplates()
  const { data: assignments = [], isLoading: loadingAssignments } = usePackingListAssignments()
  const { data: stats } = usePackingListStats()
  const deleteMutation = useDeletePackingListTemplate()

  const handleDelete = (id: string) => {
    if (!confirm('Delete this template and all its assignments?')) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Template deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete' }),
    })
  }

  const statCards = [
    { label: 'Templates', value: stats?.total_templates ?? 0, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
    { label: 'Assignments', value: stats?.active_assignments ?? 0, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Completion', value: `${stats?.completion_rate ?? 0}%`, icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
    { label: 'Fully Packed', value: stats?.fully_packed ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <PackageCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Packing Lists</h1>
            <p className="text-sm text-gray-500">Create templates and track camper packing progress</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Users className="h-4 w-4" /> Assign
          </button>
          <button
            onClick={() => { setEditingTemplate(null); setShowTemplateModal(true) }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> New Template
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['templates', 'assignments'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div>
          {loadingTemplates ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
              <PackageCheck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700">No templates yet</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first packing list template to get started.</p>
              <button
                onClick={() => { setEditingTemplate(null); setShowTemplateModal(true) }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" /> Create Template
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => {
                const categoryBreakdown: Record<string, number> = {}
                for (const item of tpl.items) {
                  const cat = item.category || 'Other'
                  categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1
                }
                return (
                  <div
                    key={tpl.id}
                    className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{tpl.name}</h3>
                        {tpl.description && (
                          <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{tpl.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => { setEditingTemplate(tpl); setShowTemplateModal(true) }}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tpl.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="mb-3 text-sm font-medium text-gray-600">
                      {tpl.items.length} item{tpl.items.length !== 1 ? 's' : ''}
                    </p>

                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {Object.entries(categoryBreakdown).map(([cat, count]) => (
                        <span
                          key={cat}
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other}`}
                        >
                          {cat} ({count})
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => { setShowAssignModal(true) }}
                      className="w-full rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <Users className="mr-1.5 inline h-4 w-4" />
                      Assign to Campers
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div>
          {loadingAssignments ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700">No assignments yet</h3>
              <p className="mt-1 text-sm text-gray-500">Assign a template to campers to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Camper</th>
                    <th className="px-6 py-3">Template</th>
                    <th className="px-6 py-3">Progress</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.map((a) => {
                    const totalItems = a.items.length
                    const checkedCount = a.items_checked.length
                    const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0
                    const isExpanded = expandedAssignment === a.id
                    return (
                      <tr key={a.id} className="group">
                        <td colSpan={5} className="p-0">
                          <div
                            onClick={() => setExpandedAssignment(isExpanded ? null : a.id)}
                            className="flex cursor-pointer items-center px-6 py-4 hover:bg-gray-50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {a.camper_name || 'Camper'}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-600">{a.template_name || 'Template'}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {checkedCount}/{totalItems}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 w-28">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[a.status]}`}>
                                {STATUS_LABEL[a.status]}
                              </span>
                            </div>
                            <div className="flex-shrink-0 w-8">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                          {isExpanded && <ChecklistDetail assignment={a} />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showTemplateModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => { setShowTemplateModal(false); setEditingTemplate(null) }}
        />
      )}
      {showAssignModal && (
        <AssignModal
          templates={templates}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  )
}

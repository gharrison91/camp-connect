import { useState } from 'react'
import {
  Heart,
  FileText,
  Search,
  Loader2,
  Plus,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'
import {
  useHealthForms,
  useHealthTemplates,
} from '@/hooks/useHealthForms'
import type { HealthForm } from '@/types/health'
import { FormBuilderModal } from './FormBuilderModal'
import { AssignFormModal } from './AssignFormModal'
import { HealthFormViewModal } from './HealthFormViewModal'

const formStatusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: ClipboardCheck },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
}

type Tab = 'forms' | 'templates'

export function HealthSafetyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('forms')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Health & Safety
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage health forms, track submissions, and ensure every camper's well-being
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('forms')}
            className={cn(
              'flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors',
              activeTab === 'forms'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            <ClipboardCheck className="h-4 w-4" />
            Forms
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              'flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors',
              activeTab === 'templates'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            <FileText className="h-4 w-4" />
            Templates
          </button>
        </nav>
      </div>

      {activeTab === 'forms' && <FormsTab />}
      {activeTab === 'templates' && <TemplatesTab />}
    </div>
  )
}

// ─── Forms Tab ───────────────────────────────────────────────

function FormsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAssign, setShowAssign] = useState(false)
  const [selectedForm, setSelectedForm] = useState<HealthForm | null>(null)
  const { hasPermission } = usePermissions()

  const { data: forms = [], isLoading } = useHealthForms({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const filteredForms = searchQuery
    ? forms.filter(
        (f) =>
          f.camper_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.template_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : forms

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by camper or form name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {hasPermission('health.forms.manage') && (
          <button
            onClick={() => setShowAssign(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Assign Form
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Form List */}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Camper</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Form</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredForms.map((form) => {
                const status = formStatusConfig[form.status] || formStatusConfig.pending
                const StatusIcon = status.icon
                return (
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{form.camper_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{form.template_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{form.event_name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', status.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {form.due_date ? new Date(form.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedForm(form)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredForms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Heart className="h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No forms found</p>
            </div>
          )}
        </div>
      )}

      {showAssign && <AssignFormModal onClose={() => setShowAssign(false)} />}
      {selectedForm && (
        <HealthFormViewModal
          form={selectedForm}
          onClose={() => setSelectedForm(null)}
        />
      )}
    </div>
  )
}

// ─── Templates Tab ───────────────────────────────────────────

function TemplatesTab() {
  const [showBuilder, setShowBuilder] = useState(false)
  const { data: templates = [], isLoading } = useHealthTemplates()
  const { hasPermission } = usePermissions()

  const categoryColors: Record<string, string> = {
    health: 'bg-red-100 text-red-700',
    medical: 'bg-blue-100 text-blue-700',
    emergency: 'bg-orange-100 text-orange-700',
    dietary: 'bg-green-100 text-green-700',
    custom: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {hasPermission('health.forms.manage') && (
          <button
            onClick={() => setShowBuilder(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{tmpl.name}</h3>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    categoryColors[tmpl.category] || 'bg-gray-100 text-gray-700'
                  )}
                >
                  {tmpl.category}
                </span>
              </div>
              {tmpl.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {tmpl.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span>{tmpl.fields.length} fields</span>
                <span>v{tmpl.version}</span>
                {tmpl.required_for_registration && (
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                    Required
                  </span>
                )}
                {tmpl.is_system && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">
                    System
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No templates yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first health form template
          </p>
        </div>
      )}

      {showBuilder && <FormBuilderModal onClose={() => setShowBuilder(false)} />}
    </div>
  )
}

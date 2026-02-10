/**
 * Camp Connect - Workflows List Page
 * HubSpot-style workflow automation list.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Loader2,
  Zap,
  Play,
  Pause,
  Archive,
  FileEdit,
  MoreHorizontal,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  GitBranch,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useWorkflows,
  useCreateWorkflow,
  useDeleteWorkflow,
  useWorkflowTemplates,
  useCreateFromTemplate,
} from '@/hooks/useWorkflows'
import { useToast } from '@/components/ui/Toast'

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-50 text-gray-600 ring-gray-500/20',
    icon: FileEdit,
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    icon: Play,
  },
  paused: {
    label: 'Paused',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    icon: Pause,
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-50 text-gray-500 ring-gray-400/20',
    icon: Archive,
  },
}

const triggerLabels: Record<string, string> = {
  event: 'Event Triggered',
  schedule: 'Scheduled',
  manual: 'Manual Enrollment',
  form_submitted: 'Form Submission',
}

export function WorkflowsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const {
    data: workflows = [],
    isLoading,
    error,
  } = useWorkflows({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const createWorkflow = useCreateWorkflow()
  const deleteWorkflow = useDeleteWorkflow()
  const { data: templates = [] } = useWorkflowTemplates()
  const createFromTemplate = useCreateFromTemplate()

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = async () => {
    try {
      const result = await createWorkflow.mutateAsync({
        name: 'Untitled Workflow',
        description: '',
        trigger: { type: 'manual' },
        steps: [],
        status: 'draft',
      })
      navigate(`/app/workflows/${result.id}`)
    } catch {
      toast({ type: 'error', message: 'Failed to create workflow' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkflow.mutateAsync(id)
      toast({ type: 'success', message: 'Workflow deleted' })
      setOpenMenuId(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete workflow' })
    }
  }

  const handleUseTemplate = async (templateKey: string) => {
    try {
      const result = await createFromTemplate.mutateAsync(templateKey)
      navigate(`/app/workflows/${result.id}`)
      toast({ type: 'success', message: 'Workflow created from template' })
    } catch {
      toast({ type: 'error', message: 'Failed to create from template' })
    }
  }

  const categoryColors: Record<string, string> = {
    onboarding: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    payments: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    compliance: 'bg-red-50 text-red-700 ring-red-600/20',
    events: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    engagement: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  }

  // Summary stats
  const activeCount = workflows.filter((w) => w.status === 'active').length
  const totalEnrolled = workflows.reduce((s, w) => s + (w.total_enrolled || 0), 0)
  const totalCompleted = workflows.reduce((s, w) => s + (w.total_completed || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Workflows
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Automate tasks with event-driven workflows, scheduled triggers, and conditional logic.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={createWorkflow.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New Workflow
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-500">Active Workflows</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalEnrolled}</p>
              <p className="text-xs text-gray-500">Total Enrolled</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCompleted}</p>
              <p className="text-xs text-gray-500">Total Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Templates</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {templates.map((tpl) => (
              <div key={tpl.key} className="flex w-64 shrink-0 flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', categoryColors[tpl.category] || 'bg-gray-50 text-gray-600 ring-gray-500/20')}>{tpl.category}</span>
                    <span className="text-xs text-gray-400">{tpl.step_count} step{tpl.step_count !== 1 ? 's' : ''}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">{tpl.name}</h3>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{tpl.description}</p>
                </div>
                <button onClick={() => handleUseTemplate(tpl.key)} disabled={createFromTemplate.isPending} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-50">
                  <Zap className="h-3 w-3" />Use Template
                </button>
              </div>
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
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load workflows. Please try again.
        </div>
      )}

      {/* Workflow Cards */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredWorkflows.map((workflow) => {
            const status = statusConfig[workflow.status] ?? statusConfig.draft
            const StatusIcon = status.icon

            return (
              <div
                key={workflow.id}
                className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/app/workflows/${workflow.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                          {workflow.name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                          status.className
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === workflow.id ? null : workflow.id)
                          }
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenuId === workflow.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            <button
                              onClick={() => {
                                navigate(`/app/workflows/${workflow.id}`)
                                setOpenMenuId(null)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <FileEdit className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(workflow.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {workflow.description && (
                    <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
                      {workflow.description}
                    </p>
                  )}

                  {/* Meta Row */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {triggerLabels[workflow.trigger_type ?? ''] ?? 'Unknown'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GitBranch className="h-3.5 w-3.5" />
                      {workflow.step_count} step{workflow.step_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-500">
                        <strong className="font-semibold text-gray-700">{workflow.total_enrolled}</strong>{' '}
                        enrolled
                      </span>
                      <span className="text-gray-500">
                        <strong className="font-semibold text-gray-700">{workflow.total_completed}</strong>{' '}
                        completed
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredWorkflows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Zap className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No workflows found</p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first workflow to automate tasks.'}
          </p>
        </div>
      )}
    </div>
  )
}

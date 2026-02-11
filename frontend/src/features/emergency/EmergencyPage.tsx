import { useState } from 'react'
import {
  Shield,
  Flame,
  CloudLightning,
  Heart,
  Lock,
  DoorOpen,
  UserSearch,
  Star,
  Clock,
  Phone,
  AlertTriangle,
  Plus,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useEmergencyPlans,
  useEmergencyStats,
  useCreateEmergencyPlan,
  useDeleteEmergencyPlan,
  useDrillRecords,
  useCreateDrill,
  useDeleteDrill,
} from '@/hooks/useEmergency'
import type {
  EmergencyPlan,
  EmergencyPlanStep,
  AssemblyPoint,
  EmergencyPlanContact,
  DrillRecord,
} from '@/types'

// ─── Constants ───────────────────────────────────────────────

const PLAN_TYPE_CONFIG: Record<string, { label: string; icon: typeof Flame; color: string }> = {
  fire: { label: 'Fire', icon: Flame, color: 'text-red-500 bg-red-50' },
  weather: { label: 'Severe Weather', icon: CloudLightning, color: 'text-blue-500 bg-blue-50' },
  medical: { label: 'Medical', icon: Heart, color: 'text-pink-500 bg-pink-50' },
  lockdown: { label: 'Lockdown', icon: Lock, color: 'text-purple-500 bg-purple-50' },
  evacuation: { label: 'Evacuation', icon: DoorOpen, color: 'text-orange-500 bg-orange-50' },
  missing_person: { label: 'Missing Person', icon: UserSearch, color: 'text-amber-500 bg-amber-50' },
  other: { label: 'Other', icon: Shield, color: 'text-slate-500 bg-slate-50' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700' },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-700' },
}

const DRILL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-700' },
}

const TABS = ['Action Plans', 'Drill Log', 'Contacts'] as const
type Tab = typeof TABS[number]

// ─── Star Rating Component ──────────────────────────────────

function StarRating({ score, onChange, size = 'md' }: { score: number; onChange?: (s: number) => void; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const scoreColor = score >= 4 ? 'text-emerald-500' : score >= 3 ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          className={cn('transition-colors', onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default')}
        >
          <Star className={cn(sz, n <= score ? scoreColor + ' fill-current' : 'text-slate-300')} />
        </button>
      ))}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────

export function EmergencyPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('Action Plans')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [showCreateDrill, setShowCreateDrill] = useState(false)
  const [showRecordDrill, setShowRecordDrill] = useState(false)
  const [expandedDrillId, setExpandedDrillId] = useState<string | null>(null)

  // Queries
  const { data: plans = [], isLoading: plansLoading } = useEmergencyPlans(
    searchQuery ? { search: searchQuery } : undefined
  )
  const { data: drills = [], isLoading: drillsLoading } = useDrillRecords()
  const { data: stats } = useEmergencyStats()

  // Mutations
  const createPlan = useCreateEmergencyPlan()
  const deletePlan = useDeleteEmergencyPlan()
  const createDrill = useCreateDrill()
  const deleteDrill = useDeleteDrill()

  // Check overdue
  const isOverdue = (plan: EmergencyPlan) => {
    if (!plan.next_review_date) return false
    return plan.next_review_date < new Date().toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emergency Plans</h1>
          <p className="mt-1 text-sm text-slate-500">Manage action plans, drills, and emergency contacts</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'Action Plans' && (
            <button
              onClick={() => setShowCreatePlan(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Create Plan
            </button>
          )}
          {activeTab === 'Drill Log' && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateDrill(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Calendar className="h-4 w-4" /> Schedule Drill
              </button>
              <button
                onClick={() => setShowRecordDrill(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" /> Record Drill
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.total_active_plans ?? 0}</p>
              <p className="text-xs text-slate-500">Active Plans</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.drills_this_quarter ?? 0}</p>
              <p className="text-xs text-slate-500">Drills This Quarter</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.avg_drill_score ?? '—'}</p>
              <p className="text-xs text-slate-500">Avg Drill Score</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg p-2', (stats?.overdue_reviews ?? 0) > 0 ? 'bg-red-50' : 'bg-slate-50')}>
              <AlertTriangle className={cn('h-5 w-5', (stats?.overdue_reviews ?? 0) > 0 ? 'text-red-600' : 'text-slate-400')} />
            </div>
            <div>
              <p className={cn('text-2xl font-bold', (stats?.overdue_reviews ?? 0) > 0 ? 'text-red-600' : 'text-slate-900')}>
                {stats?.overdue_reviews ?? 0}
              </p>
              <p className="text-xs text-slate-500">Overdue Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'border-b-2 pb-3 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Search (Plans tab) */}
      {activeTab === 'Action Plans' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'Action Plans' && (
        <ActionPlansTab
          plans={plans}
          loading={plansLoading}
          expandedPlanId={expandedPlanId}
          onToggleExpand={(id) => setExpandedPlanId(expandedPlanId === id ? null : id)}
          isOverdue={isOverdue}
          onDelete={(id) => {
            deletePlan.mutate(id, {
              onSuccess: () => toast({ type: 'success', message: 'Plan deleted' }),
              onError: () => toast({ type: 'error', message: 'Failed to delete plan' }),
            })
          }}
        />
      )}

      {activeTab === 'Drill Log' && (
        <DrillLogTab
          drills={drills}
          loading={drillsLoading}
          expandedDrillId={expandedDrillId}
          onToggleExpand={(id) => setExpandedDrillId(expandedDrillId === id ? null : id)}
          onDelete={(id) => {
            deleteDrill.mutate(id, {
              onSuccess: () => toast({ type: 'success', message: 'Drill deleted' }),
              onError: () => toast({ type: 'error', message: 'Failed to delete drill' }),
            })
          }}
        />
      )}

      {activeTab === 'Contacts' && <ContactsTab plans={plans} loading={plansLoading} />}

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <CreatePlanModal
          onClose={() => setShowCreatePlan(false)}
          onSubmit={(data) => {
            createPlan.mutate(data, {
              onSuccess: () => {
                toast({ type: 'success', message: 'Plan created' })
                setShowCreatePlan(false)
              },
              onError: () => toast({ type: 'error', message: 'Failed to create plan' }),
            })
          }}
          submitting={createPlan.isPending}
        />
      )}

      {/* Schedule Drill Modal */}
      {showCreateDrill && (
        <DrillModal
          mode="schedule"
          plans={plans}
          onClose={() => setShowCreateDrill(false)}
          onSubmit={(data) => {
            createDrill.mutate(data, {
              onSuccess: () => {
                toast({ type: 'success', message: 'Drill scheduled' })
                setShowCreateDrill(false)
              },
              onError: () => toast({ type: 'error', message: 'Failed to schedule drill' }),
            })
          }}
          submitting={createDrill.isPending}
        />
      )}

      {/* Record Drill Modal */}
      {showRecordDrill && (
        <DrillModal
          mode="record"
          plans={plans}
          onClose={() => setShowRecordDrill(false)}
          onSubmit={(data) => {
            createDrill.mutate({ ...data, status: 'completed' }, {
              onSuccess: () => {
                toast({ type: 'success', message: 'Drill recorded' })
                setShowRecordDrill(false)
              },
              onError: () => toast({ type: 'error', message: 'Failed to record drill' }),
            })
          }}
          submitting={createDrill.isPending}
        />
      )}
    </div>
  )
}

// ─── Action Plans Tab ───────────────────────────────────────

function ActionPlansTab({
  plans,
  loading,
  expandedPlanId,
  onToggleExpand,
  isOverdue,
  onDelete,
}: {
  plans: EmergencyPlan[]
  loading: boolean
  expandedPlanId: string | null
  onToggleExpand: (id: string) => void
  isOverdue: (p: EmergencyPlan) => boolean
  onDelete: (id: string) => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
        <Shield className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">No action plans yet</h3>
        <p className="mt-1 text-sm text-slate-500">Create your first emergency action plan to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => {
        const typeConfig = PLAN_TYPE_CONFIG[plan.plan_type] || PLAN_TYPE_CONFIG.other
        const statusConfig = STATUS_CONFIG[plan.status] || STATUS_CONFIG.draft
        const TypeIcon = typeConfig.icon
        const expanded = expandedPlanId === plan.id
        const overdue = isOverdue(plan)

        return (
          <div key={plan.id} className={cn('rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md', expanded && 'md:col-span-2 xl:col-span-3')}>
            {/* Card Header */}
            <button
              onClick={() => onToggleExpand(plan.id)}
              className="flex w-full items-start gap-4 p-5 text-left"
            >
              <div className={cn('rounded-lg p-2.5', typeConfig.color)}>
                <TypeIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-slate-900">{plan.name}</h3>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    v{plan.version}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{typeConfig.label}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig.color)}>
                    {statusConfig.label}
                  </span>
                  {overdue && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      <AlertTriangle className="h-3 w-3" /> Review Overdue
                    </span>
                  )}
                  {plan.last_reviewed && (
                    <span className="text-xs text-slate-400">
                      Reviewed {new Date(plan.last_reviewed).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 pt-1">
                {expanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                {plan.description && (
                  <p className="mb-4 text-sm text-slate-600">{plan.description}</p>
                )}

                {/* Steps */}
                {plan.steps.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <FileText className="h-4 w-4" /> Action Steps
                    </h4>
                    <div className="space-y-2">
                      {plan.steps.map((step, i) => (
                        <div key={i} className="flex gap-3 rounded-lg bg-slate-50 p-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                            {step.step_number}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900">{step.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                            <div className="mt-1 flex gap-3 text-xs text-slate-400">
                              <span>{step.responsible_role}</span>
                              <span>{step.estimated_time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assembly Points */}
                {plan.assembly_points.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <MapPin className="h-4 w-4" /> Assembly Points
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {plan.assembly_points.map((ap, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm font-medium text-slate-900">{ap.name}</p>
                          <p className="text-xs text-slate-500">{ap.location}</p>
                          <p className="mt-1 text-xs text-slate-400">Capacity: {ap.capacity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Contacts */}
                {plan.emergency_contacts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Phone className="h-4 w-4" /> Emergency Contacts
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {plan.emergency_contacts.map((ec, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{ec.name}</p>
                            <p className="text-xs text-slate-500">{ec.role}</p>
                            <div className="mt-1 flex gap-2">
                              <a href={`tel:${ec.phone}`} className="text-xs text-emerald-600 hover:underline">{ec.phone}</a>
                              <a href={`mailto:${ec.email}`} className="text-xs text-emerald-600 hover:underline">{ec.email}</a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete */}
                <div className="flex justify-end border-t border-slate-100 pt-3">
                  <button
                    onClick={() => { if (confirm('Delete this plan?')) onDelete(plan.id) }}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Drill Log Tab ──────────────────────────────────────────

function DrillLogTab({
  drills,
  loading,
  expandedDrillId,
  onToggleExpand,
  onDelete,
}: {
  drills: DrillRecord[]
  loading: boolean
  expandedDrillId: string | null
  onToggleExpand: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (drills.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
        <Clock className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">No drills recorded</h3>
        <p className="mt-1 text-sm text-slate-500">Schedule or record your first drill.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 font-medium text-slate-600">Date</th>
            <th className="px-4 py-3 font-medium text-slate-600">Plan</th>
            <th className="hidden px-4 py-3 font-medium text-slate-600 md:table-cell">Duration</th>
            <th className="hidden px-4 py-3 font-medium text-slate-600 sm:table-cell">Participants</th>
            <th className="px-4 py-3 font-medium text-slate-600">Score</th>
            <th className="hidden px-4 py-3 font-medium text-slate-600 lg:table-cell">Evaluator</th>
            <th className="px-4 py-3 font-medium text-slate-600">Status</th>
            <th className="px-4 py-3 font-medium text-slate-600"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {drills.map((drill) => {
            const drillStatus = DRILL_STATUS_CONFIG[drill.status] || DRILL_STATUS_CONFIG.scheduled
            const expanded = expandedDrillId === drill.id

            return (
              <tr key={drill.id} className="group">
                <td colSpan={8} className="p-0">
                  <button
                    onClick={() => onToggleExpand(drill.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center">
                      <div className="w-full">
                        <div className="grid items-center" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                          <div className="px-4 py-3 text-slate-900">
                            {new Date(drill.drill_date).toLocaleDateString()}
                          </div>
                          <div className="px-4 py-3 font-medium text-slate-900">{drill.plan_name}</div>
                          <div className="hidden px-4 py-3 text-slate-600 md:block">
                            {drill.duration_minutes ? `${drill.duration_minutes} min` : '—'}
                          </div>
                          <div className="hidden px-4 py-3 text-slate-600 sm:block">
                            {drill.participants_count || '—'}
                          </div>
                          <div className="px-4 py-3">
                            <StarRating score={drill.score} size="sm" />
                          </div>
                          <div className="hidden px-4 py-3 text-slate-600 lg:block">{drill.evaluator || '—'}</div>
                          <div className="px-4 py-3">
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', drillStatus.color)}>
                              {drillStatus.label}
                            </span>
                          </div>
                          <div className="px-4 py-3 text-right">
                            {expanded ? <ChevronUp className="ml-auto h-4 w-4 text-slate-400" /> : <ChevronDown className="ml-auto h-4 w-4 text-slate-400" />}
                          </div>
                        </div>

                        {expanded && (
                          <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              {drill.observations && (
                                <div>
                                  <h4 className="text-xs font-semibold uppercase text-slate-500">Observations</h4>
                                  <p className="mt-1 text-sm text-slate-700">{drill.observations}</p>
                                </div>
                              )}
                              {drill.improvements_needed.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold uppercase text-slate-500">Improvements Needed</h4>
                                  <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                                    {drill.improvements_needed.map((imp, i) => (
                                      <li key={i}>{imp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            {drill.start_time && drill.end_time && (
                              <p className="mt-2 text-xs text-slate-400">
                                Time: {drill.start_time} - {drill.end_time}
                              </p>
                            )}
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); if (confirm('Delete this drill?')) onDelete(drill.id) }}
                                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Contacts Tab ───────────────────────────────────────────

function ContactsTab({ plans, loading }: { plans: EmergencyPlan[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  const plansWithContacts = plans.filter((p) => p.emergency_contacts.length > 0)

  if (plansWithContacts.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
        <Phone className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">No emergency contacts</h3>
        <p className="mt-1 text-sm text-slate-500">Add contacts to your emergency plans.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {plansWithContacts.map((plan) => {
        const typeConfig = PLAN_TYPE_CONFIG[plan.plan_type] || PLAN_TYPE_CONFIG.other
        const TypeIcon = typeConfig.icon
        return (
          <div key={plan.id}>
            <div className="mb-3 flex items-center gap-2">
              <div className={cn('rounded-lg p-1.5', typeConfig.color)}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">{plan.name}</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plan.emergency_contacts.map((contact, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{contact.name}</p>
                      <p className="text-xs text-slate-500">{contact.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <Phone className="h-4 w-4" /> {contact.phone}
                    </a>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      <Mail className="h-4 w-4" /> {contact.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Create Plan Modal (Multi-Step) ─────────────────────────

function CreatePlanModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
  submitting: boolean
}) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [planType, setPlanType] = useState('fire')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('draft')
  const [nextReviewDate, setNextReviewDate] = useState('')
  const [steps, setSteps] = useState<EmergencyPlanStep[]>([])
  const [assemblyPoints, setAssemblyPoints] = useState<AssemblyPoint[]>([])
  const [contacts, setContacts] = useState<EmergencyPlanContact[]>([])

  const STEP_LABELS = ['Basic Info', 'Action Steps', 'Assembly Points', 'Contacts']

  const addStep = () => setSteps([...steps, { step_number: steps.length + 1, title: '', description: '', responsible_role: '', estimated_time: '' }])
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step_number: idx + 1 })))
  const updateStep = (i: number, field: keyof EmergencyPlanStep, val: string | number) => {
    const updated = [...steps]
    updated[i] = { ...updated[i], [field]: val }
    setSteps(updated)
  }

  const addAP = () => setAssemblyPoints([...assemblyPoints, { name: '', location: '', capacity: 0 }])
  const removeAP = (i: number) => setAssemblyPoints(assemblyPoints.filter((_, idx) => idx !== i))
  const updateAP = (i: number, field: keyof AssemblyPoint, val: string | number) => {
    const updated = [...assemblyPoints]
    updated[i] = { ...updated[i], [field]: val }
    setAssemblyPoints(updated)
  }

  const addContact = () => setContacts([...contacts, { name: '', role: '', phone: '', email: '' }])
  const removeContact = (i: number) => setContacts(contacts.filter((_, idx) => idx !== i))
  const updateContact = (i: number, field: keyof EmergencyPlanContact, val: string) => {
    const updated = [...contacts]
    updated[i] = { ...updated[i], [field]: val }
    setContacts(updated)
  }

  const handleSubmit = () => {
    onSubmit({
      name,
      plan_type: planType,
      description,
      status,
      next_review_date: nextReviewDate || null,
      steps,
      assembly_points: assemblyPoints,
      emergency_contacts: contacts,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Create Emergency Plan</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex border-b border-slate-100 px-6">
          {STEP_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={cn(
                'flex-1 border-b-2 py-3 text-center text-xs font-medium transition-colors',
                step === i ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Plan Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Fire Evacuation Plan"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Plan Type</label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {Object.entries(PLAN_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Describe the plan..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Next Review Date</label>
                  <input
                    type="date"
                    value={nextReviewDate}
                    onChange={(e) => setNextReviewDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Step {s.step_number}</span>
                    <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input placeholder="Title" value={s.title} onChange={(e) => updateStep(i, 'title', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                    <input placeholder="Responsible Role" value={s.responsible_role} onChange={(e) => updateStep(i, 'responsible_role', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                    <input placeholder="Description" value={s.description} onChange={(e) => updateStep(i, 'description', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                    <input placeholder="Est. Time (e.g. 5 min)" value={s.estimated_time} onChange={(e) => updateStep(i, 'estimated_time', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
              ))}
              <button onClick={addStep} className="w-full rounded-lg border-2 border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-emerald-500 hover:text-emerald-600">
                + Add Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {assemblyPoints.map((ap, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Assembly Point {i + 1}</span>
                    <button onClick={() => removeAP(i)} className="text-red-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input placeholder="Name" value={ap.name} onChange={(e) => updateAP(i, 'name', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                    <input placeholder="Location" value={ap.location} onChange={(e) => updateAP(i, 'location', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                    <input type="number" placeholder="Capacity" value={ap.capacity || ''} onChange={(e) => updateAP(i, 'capacity', parseInt(e.target.value) || 0)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
              ))}
              <button onClick={addAP} className="w-full rounded-lg border-2 border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-emerald-500 hover:text-emerald-600">
                + Add Assembly Point
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {contacts.map((c, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Contact {i + 1}</span>
                    <button onClick={() => removeContact(i)} className="text-red-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input placeholder="Name" value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                    <input placeholder="Role" value={c.role} onChange={(e) => updateContact(i, 'role', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                    <input placeholder="Phone" value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                    <input placeholder="Email" value={c.email} onChange={(e) => updateContact(i, 'email', e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
              ))}
              <button onClick={addContact} className="w-full rounded-lg border-2 border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-emerald-500 hover:text-emerald-600">
                + Add Contact
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {step > 0 ? 'Back' : 'Cancel'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !name.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Plan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Drill Modal (Schedule / Record) ────────────────────────

function DrillModal({
  mode,
  plans,
  onClose,
  onSubmit,
  submitting,
}: {
  mode: 'schedule' | 'record'
  plans: EmergencyPlan[]
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
  submitting: boolean
}) {
  const [planId, setPlanId] = useState(plans[0]?.id || '')
  const [drillDate, setDrillDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [participantsCount, setParticipantsCount] = useState(0)
  const [evaluator, setEvaluator] = useState('')
  const [score, setScore] = useState(0)
  const [observations, setObservations] = useState('')
  const [improvements, setImprovements] = useState<string[]>([])

  const addImprovement = () => setImprovements([...improvements, ''])
  const removeImprovement = (i: number) => setImprovements(improvements.filter((_, idx) => idx !== i))
  const updateImprovement = (i: number, val: string) => {
    const updated = [...improvements]
    updated[i] = val
    setImprovements(updated)
  }

  const calcDuration = () => {
    if (!startTime || !endTime) return undefined
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  }

  const handleSubmit = () => {
    onSubmit({
      plan_id: planId,
      drill_date: drillDate,
      start_time: startTime || null,
      end_time: endTime || null,
      duration_minutes: calcDuration() ?? null,
      participants_count: participantsCount,
      evaluator,
      score,
      observations,
      improvements_needed: improvements.filter(Boolean),
      status: mode === 'schedule' ? 'scheduled' : 'completed',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === 'schedule' ? 'Schedule Drill' : 'Record Drill'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Plan *</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {plans.length === 0 && <option value="">No plans available</option>}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date *</label>
              <input
                type="date"
                value={drillDate}
                onChange={(e) => setDrillDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Evaluator</label>
              <input
                type="text"
                value={evaluator}
                onChange={(e) => setEvaluator(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Name of evaluator"
              />
            </div>
          </div>

          {mode === 'record' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Participants</label>
                  <input
                    type="number"
                    value={participantsCount || ''}
                    onChange={(e) => setParticipantsCount(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Score</label>
                <StarRating score={score} onChange={setScore} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Observations</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Notes from the drill..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Improvements Needed</label>
                {improvements.map((imp, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input
                      value={imp}
                      onChange={(e) => updateImprovement(i, e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                      placeholder="Improvement item..."
                    />
                    <button onClick={() => removeImprovement(i)} className="text-red-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addImprovement} className="text-sm text-emerald-600 hover:text-emerald-700">
                  + Add improvement
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !planId || !drillDate}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'schedule' ? 'Schedule' : 'Save Drill'}
          </button>
        </div>
      </div>
    </div>
  )
}

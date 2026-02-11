/**
 * Camp Connect - Permission Slips Management Page
 * Digital permission slips with parent e-signatures.
 */

import { useState, useMemo } from 'react'
import {
  FileSignature,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  X,
  Send,
  Trash2,
  Edit3,
  Users,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useCampers } from '@/hooks/useCampers'
import {
  usePermissionSlips,
  usePermissionSlipStats,
  useCreatePermissionSlip,
  useUpdatePermissionSlip,
  useDeletePermissionSlip,
  useAssignPermissionSlip,
  usePermissionSlipAssignments,
  useSendReminders,
} from '@/hooks/usePermissionSlips'
import type { PermissionSlip } from '@/types'


// ── Status badge helper ──────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case 'signed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> Signed
        </span>
      )
    case 'declined':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          <XCircle className="h-3 w-3" /> Declined
        </span>
      )
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          <Clock className="h-3 w-3" /> Expired
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          <Clock className="h-3 w-3" /> Pending
        </span>
      )
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PermissionSlipsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<PermissionSlip | null>(null)
  const [expandedSlip, setExpandedSlip] = useState<string | null>(null)
  const [showAssign, setShowAssign] = useState<string | null>(null)
  const [selectedCampers, setSelectedCampers] = useState<string[]>([])
  const [form, setForm] = useState({ title: '', description: '', activity_name: '', required_by: '', terms_text: '' })

  const { data: slips = [], isLoading } = usePermissionSlips({ search: search || undefined, status: statusFilter || undefined })
  const { data: stats } = usePermissionSlipStats()
  const { data: assignments = [] } = usePermissionSlipAssignments(expandedSlip)
  const { data: campersData } = useCampers()
  const campers = campersData?.items ?? []
  const createSlip = useCreatePermissionSlip()
  const updateSlip = useUpdatePermissionSlip()
  const deleteSlip = useDeletePermissionSlip()
  const assignSlip = useAssignPermissionSlip()
  const sendReminders = useSendReminders()

  const filteredSlips = useMemo(() => {
    if (!search) return slips
    const q = search.toLowerCase()
    return slips.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      (s.activity_name || '').toLowerCase().includes(q)
    )
  }, [slips, search])

  function openCreate() {
    setEditing(null)
    setForm({ title: '', description: '', activity_name: '', required_by: '', terms_text: '' })
    setShowCreate(true)
  }

  function openEdit(slip: PermissionSlip) {
    setEditing(slip)
    setForm({
      title: slip.title,
      description: slip.description || '',
      activity_name: slip.activity_name || '',
      required_by: slip.required_by,
      terms_text: slip.terms_text,
    })
    setShowCreate(true)
  }

  function handleSave() {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      activity_name: form.activity_name || undefined,
      required_by: form.required_by,
      terms_text: form.terms_text,
    }
    if (editing) {
      updateSlip.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => { toast({ type: 'success', message: 'Permission slip updated' }); setShowCreate(false) },
        onError: () => toast({ type: 'error', message: 'Failed to update' }),
      })
    } else {
      createSlip.mutate(payload, {
        onSuccess: () => { toast({ type: 'success', message: 'Permission slip created' }); setShowCreate(false) },
        onError: () => toast({ type: 'error', message: 'Failed to create' }),
      })
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this permission slip?')) return
    deleteSlip.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Permission slip deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete' }),
    })
  }

  function handleAssign() {
    if (!showAssign || selectedCampers.length === 0) return
    assignSlip.mutate({ slipId: showAssign, camperIds: selectedCampers }, {
      onSuccess: () => { toast({ type: 'success', message: `Assigned to ${selectedCampers.length} camper(s)` }); setShowAssign(null); setSelectedCampers([]) },
      onError: () => toast({ type: 'error', message: 'Failed to assign' }),
    })
  }

  function handleRemind(slipId: string) {
    sendReminders.mutate(slipId, {
      onSuccess: () => toast({ type: 'success', message: 'Reminders sent' }),
      onError: () => toast({ type: 'error', message: 'Failed to send reminders' }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <FileSignature className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Permission Slips</h1>
            <p className="text-sm text-gray-500">Digital permission slips with e-signatures</p>
          </div>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Slip
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Slips', value: stats.total_slips, icon: FileSignature, color: 'text-gray-600', bg: 'bg-gray-100' },
            { label: 'Pending Signatures', value: stats.pending_signatures, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Signed', value: stats.signed_count, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Compliance Rate', value: `${stats.compliance_rate}%`, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-100' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search permission slips..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Slips List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : filteredSlips.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-gray-200 bg-white">
          <FileSignature className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No permission slips</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first permission slip to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSlips.map((slip) => {
            const isExpanded = expandedSlip === slip.id
            const signedPct = slip.total_assignments > 0
              ? Math.round((slip.signed_count / slip.total_assignments) * 100)
              : 0

            return (
              <div key={slip.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Slip header row */}
                <div className="flex items-center gap-4 p-4">
                  <button
                    onClick={() => setExpandedSlip(isExpanded ? null : slip.id)}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{slip.title}</h3>
                      {slip.activity_name && (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">{slip.activity_name}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due {fmtDate(slip.required_by)}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {slip.total_assignments} assigned</span>
                    </div>
                  </div>

                  {/* Mini progress */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="w-24">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-gray-400">Signed</span>
                        <span className="font-medium text-gray-600">{signedPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${signedPct}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-1 text-[11px]">
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">{slip.signed_count}</span>
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">{slip.pending_count}</span>
                      {slip.declined_count > 0 && <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">{slip.declined_count}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setShowAssign(slip.id)} className="rounded-md p-1.5 text-blue-500 hover:bg-blue-50" title="Assign Campers">
                      <Users className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleRemind(slip.id)} className="rounded-md p-1.5 text-amber-500 hover:bg-amber-50" title="Send Reminders">
                      <Send className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(slip)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" title="Edit">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(slip.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded: assignment list */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {assignments.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-500">
                        No campers assigned yet. Click the assign button to add campers.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Camper</th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Parent</th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Status</th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Signed At</th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Reminder</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {assignments.map((a) => (
                              <tr key={a.id} className="hover:bg-white transition-colors">
                                <td className="px-4 py-2.5 font-medium text-gray-900">{a.camper_name}</td>
                                <td className="px-4 py-2.5 text-gray-600">{a.parent_name || '—'}</td>
                                <td className="px-4 py-2.5">{statusBadge(a.status)}</td>
                                <td className="px-4 py-2.5 text-gray-500">{a.signed_at ? fmtDate(a.signed_at) : '—'}</td>
                                <td className="px-4 py-2.5 text-gray-500">{a.reminder_sent_at ? fmtDate(a.reminder_sent_at) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Permission Slip' : 'New Permission Slip'}</h3>
              <button onClick={() => setShowCreate(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Field Trip to Zoo" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
                  <input value={form.activity_name} onChange={(e) => setForm({ ...form, activity_name: e.target.value })} placeholder="e.g. Swimming" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required By *</label>
                  <input type="date" value={form.required_by} onChange={(e) => setForm({ ...form, required_by: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions *</label>
                <textarea
                  value={form.terms_text}
                  onChange={(e) => setForm({ ...form, terms_text: e.target.value })}
                  rows={4}
                  placeholder="Enter the permission slip text that parents must agree to..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={!form.title || !form.required_by || !form.terms_text || createSlip.isPending || updateSlip.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {createSlip.isPending || updateSlip.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Campers Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Assign Campers</h3>
              <button onClick={() => { setShowAssign(null); setSelectedCampers([]) }} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Select campers to receive this permission slip.</p>
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {campers.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">No campers found</div>
              ) : (
                campers.map((c) => {
                  const name = `${c.first_name} ${c.last_name}`
                  const checked = selectedCampers.includes(c.id)
                  return (
                    <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedCampers((prev) =>
                            checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          )
                        }
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                        {c.first_name[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{name}</span>
                    </label>
                  )
                })
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">{selectedCampers.length} selected</span>
              <div className="flex gap-2">
                <button onClick={() => { setShowAssign(null); setSelectedCampers([]) }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleAssign}
                  disabled={selectedCampers.length === 0 || assignSlip.isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {assignSlip.isPending ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

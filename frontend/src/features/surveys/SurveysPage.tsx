/**
 * Camp Connect – Surveys & Feedback
 * Create and manage surveys, view responses and analytics.
 */

import { useState } from 'react'
import {
  ClipboardList,
  Plus,
  Search,
  BarChart3,
  Clock,
  CheckCircle2,
  X,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useSurveys,
  useSurveyStats,
  useCreateSurvey,
  useUpdateSurvey,
  useDeleteSurvey,
  useSurveyResponses,
} from '@/hooks/useSurveys'
import type { SurveyData } from '@/hooks/useSurveys'

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-600' },
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  closed: { label: 'Closed', bg: 'bg-blue-50', text: 'text-blue-700' },
}

const AUDIENCE_CFG: Record<string, { label: string; bg: string; text: string }> = {
  parents: { label: 'Parents', bg: 'bg-purple-50', text: 'text-purple-700' },
  staff: { label: 'Staff', bg: 'bg-blue-50', text: 'text-blue-700' },
  campers: { label: 'Campers', bg: 'bg-amber-50', text: 'text-amber-700' },
  all: { label: 'Everyone', bg: 'bg-gray-50', text: 'text-gray-600' },
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SurveysPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<SurveyData | null>(null)
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', target_audience: 'all', status: 'draft', start_date: '', end_date: '' })

  const { data: surveys = [], isLoading } = useSurveys({
    search: search || undefined,
    status: statusFilter || undefined,
    target_audience: audienceFilter || undefined,
  })
  const { data: stats } = useSurveyStats()
  const { data: responses = [] } = useSurveyResponses(expandedSurvey || undefined)
  const createSurvey = useCreateSurvey()
  const updateSurvey = useUpdateSurvey()
  const deleteSurvey = useDeleteSurvey()

  function openCreate() {
    setEditing(null)
    setForm({ title: '', description: '', target_audience: 'all', status: 'draft', start_date: '', end_date: '' })
    setShowModal(true)
  }

  function openEdit(s: SurveyData) {
    setEditing(s)
    setForm({
      title: s.title,
      description: s.description || '',
      target_audience: s.target_audience,
      status: s.status,
      start_date: s.start_date || '',
      end_date: s.end_date || '',
    })
    setShowModal(true)
  }

  function handleSave() {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      target_audience: form.target_audience,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }
    if (editing) {
      updateSurvey.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => { toast({ type: 'success', message: 'Survey updated' }); setShowModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to update' }),
      })
    } else {
      createSurvey.mutate(payload, {
        onSuccess: () => { toast({ type: 'success', message: 'Survey created' }); setShowModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to create' }),
      })
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this survey?')) return
    deleteSurvey.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Survey deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete' }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <ClipboardList className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Surveys & Feedback</h1>
            <p className="text-sm text-gray-500">Collect feedback from parents, staff, and campers</p>
          </div>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Survey
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Surveys', value: stats.total_surveys, icon: ClipboardList, color: 'text-gray-600', bg: 'bg-gray-100' },
            { label: 'Active', value: stats.active_count, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Total Responses', value: stats.total_responses, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Avg Completion', value: `${stats.avg_completion_rate}%`, icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-100' },
          ].map(s => (
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search surveys..." className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500">
          <option value="">All Audiences</option>
          <option value="parents">Parents</option>
          <option value="staff">Staff</option>
          <option value="campers">Campers</option>
          <option value="all">Everyone</option>
        </select>
      </div>

      {/* Survey list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>
      ) : surveys.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-gray-200 bg-white">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No surveys</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first survey to start collecting feedback.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(survey => {
            const isExpanded = expandedSurvey === survey.id
            const st = STATUS_CFG[survey.status] || STATUS_CFG.draft
            const aud = AUDIENCE_CFG[survey.target_audience] || AUDIENCE_CFG.all

            return (
              <div key={survey.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <button onClick={() => setExpandedSurvey(isExpanded ? null : survey.id)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{survey.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${aud.bg} ${aud.text}`}>{aud.label}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDate(survey.start_date)} – {fmtDate(survey.end_date)}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {survey.response_count} responses</span>
                      <span className="flex items-center gap-1"><ClipboardList className="h-3 w-3" /> {survey.question_count} questions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(survey)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" title="Edit"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(survey.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Expanded: show responses */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {responses.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-500">No responses yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Respondent</th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Email</th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Answers</th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Submitted</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {responses.map(r => (
                              <tr key={r.id} className="hover:bg-white transition-colors">
                                <td className="px-4 py-2.5 font-medium text-gray-900">{r.respondent_name || 'Anonymous'}</td>
                                <td className="px-4 py-2.5 text-gray-500">{r.respondent_email || '—'}</td>
                                <td className="px-4 py-2.5 text-gray-500">{r.answers?.length || 0} answers</td>
                                <td className="px-4 py-2.5 text-gray-500">{fmtDate(r.submitted_at)}</td>
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Survey' : 'New Survey'}</h3>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. End of Summer Feedback" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select value={form.target_audience} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500">
                    <option value="all">Everyone</option><option value="parents">Parents</option><option value="staff">Staff</option><option value="campers">Campers</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500">
                    <option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={!form.title || createSurvey.isPending || updateSurvey.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {createSurvey.isPending || updateSurvey.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

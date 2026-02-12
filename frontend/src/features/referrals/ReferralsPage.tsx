/**
 * Camp Connect - Referral Tracking Page
 * Track family referrals, incentives, and conversion funnel.
 */

import { useState, useMemo } from 'react'
import {
  Users,
  Plus,
  Search,
  X,
  Trash2,
  Pencil,
  Gift,
  TrendingUp,
  DollarSign,
  Mail,
  Phone,
  Clock,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useReferrals,
  useReferralStats,
  useCreateReferral,
  useUpdateReferral,
  useDeleteReferral,
} from '@/hooks/useReferrals'
import type { Referral } from '@/hooks/useReferrals'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'registered', label: 'Registered' },
  { value: 'completed', label: 'Completed' },
  { value: 'expired', label: 'Expired' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'word_of_mouth', label: 'Word of Mouth' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'website', label: 'Website' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
]

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700' },
  contacted: { bg: 'bg-blue-50', text: 'text-blue-700' },
  registered: { bg: 'bg-amber-50', text: 'text-amber-700' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  expired: { bg: 'bg-red-50', text: 'text-red-700' },
}

const INCENTIVE_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-600' },
  awarded: { bg: 'bg-blue-50', text: 'text-blue-700' },
  redeemed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

const SOURCE_LABELS: Record<string, string> = {
  word_of_mouth: 'Word of Mouth',
  social_media: 'Social Media',
  website: 'Website',
  event: 'Event',
  other: 'Other',
}

export function ReferralsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Referral | null>(null)

  const [form, setForm] = useState({
    referrer_name: '',
    referrer_email: '',
    referred_name: '',
    referred_email: '',
    referred_phone: '',
    status: 'pending' as Referral['status'],
    source: 'word_of_mouth' as Referral['source'],
    incentive_type: 'none' as Referral['incentive_type'],
    incentive_amount: '',
    incentive_status: 'pending' as Referral['incentive_status'],
    notes: '',
  })

  const { data: referrals = [], isLoading } = useReferrals({
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
    search: search || undefined,
  })
  const { data: stats } = useReferralStats()
  const createReferral = useCreateReferral()
  const updateReferral = useUpdateReferral()
  const deleteReferral = useDeleteReferral()

  const sorted = useMemo(() => {
    return [...referrals].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [referrals])

  function openCreate() {
    setEditing(null)
    setForm({
      referrer_name: '', referrer_email: '', referred_name: '', referred_email: '',
      referred_phone: '', status: 'pending', source: 'word_of_mouth',
      incentive_type: 'none', incentive_amount: '', incentive_status: 'pending', notes: '',
    })
    setShowModal(true)
  }

  function openEdit(r: Referral) {
    setEditing(r)
    setForm({
      referrer_name: r.referrer_name,
      referrer_email: r.referrer_email || '',
      referred_name: r.referred_name,
      referred_email: r.referred_email || '',
      referred_phone: r.referred_phone || '',
      status: r.status,
      source: r.source,
      incentive_type: r.incentive_type,
      incentive_amount: r.incentive_amount ? String(r.incentive_amount) : '',
      incentive_status: r.incentive_status,
      notes: r.notes || '',
    })
    setShowModal(true)
  }

  function handleSave() {
    const payload = {
      referrer_name: form.referrer_name,
      referrer_email: form.referrer_email || null,
      referred_name: form.referred_name,
      referred_email: form.referred_email || null,
      referred_phone: form.referred_phone || null,
      status: form.status,
      source: form.source,
      incentive_type: form.incentive_type,
      incentive_amount: form.incentive_amount ? parseFloat(form.incentive_amount) : null,
      incentive_status: form.incentive_status,
      notes: form.notes || null,
    }
    if (editing) {
      updateReferral.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => { toast({ type: 'success', message: 'Referral updated' }); setShowModal(false) },
          onError: () => toast({ type: 'error', message: 'Failed to update referral' }),
        }
      )
    } else {
      createReferral.mutate(payload, {
        onSuccess: () => { toast({ type: 'success', message: 'Referral created' }); setShowModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to create referral' }),
      })
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this referral?')) return
    deleteReferral.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Referral deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete referral' }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Track referrals, conversions, and incentives</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Referral
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Users className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Referrals</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.converted}</p>
                <p className="text-xs text-gray-500">Conversions</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(stats.conversion_rate * 100).toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Conversion Rate</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"><DollarSign className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">${stats.total_incentives.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Incentives</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search referrals..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
          {SOURCE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400"><Clock className="h-5 w-5 animate-spin mr-2" /> Loading...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No referrals found</p>
          <p className="text-sm text-gray-400 mt-1">Create a referral to start tracking</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Referrer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Referred</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Incentive</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((ref) => {
                  const ss = STATUS_STYLES[ref.status] || STATUS_STYLES.pending
                  const is_ = INCENTIVE_STYLES[ref.incentive_status] || INCENTIVE_STYLES.pending
                  return (
                    <tr key={ref.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{ref.referrer_name}</div>
                        {ref.referrer_email && <div className="flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3" />{ref.referrer_email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{ref.referred_name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {ref.referred_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{ref.referred_email}</span>}
                          {ref.referred_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{ref.referred_phone}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{SOURCE_LABELS[ref.source] || ref.source}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ss.bg} ${ss.text}`}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ref.incentive_type !== 'none' ? (
                          <div>
                            <div className="flex items-center gap-1">
                              <Gift className="h-3 w-3 text-purple-500" />
                              <span className="text-xs font-medium capitalize">{ref.incentive_type}</span>
                              {ref.incentive_amount && <span className="text-xs text-gray-500">(${ref.incentive_amount})</span>}
                            </div>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5 ${is_.bg} ${is_.text}`}>
                              {ref.incentive_status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(ref)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(ref.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Referral' : 'New Referral'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referrer Name *</label>
                  <input type="text" value={form.referrer_name} onChange={(e) => setForm({ ...form, referrer_name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referrer Email</label>
                  <input type="email" value={form.referrer_email} onChange={(e) => setForm({ ...form, referrer_email: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referred Name *</label>
                  <input type="text" value={form.referred_name} onChange={(e) => setForm({ ...form, referred_name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referred Email</label>
                  <input type="email" value={form.referred_email} onChange={(e) => setForm({ ...form, referred_email: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referred Phone</label>
                  <input type="tel" value={form.referred_phone} onChange={(e) => setForm({ ...form, referred_phone: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as Referral['source'] })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    {SOURCE_OPTIONS.filter((s) => s.value).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Referral['status'] })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    {STATUS_OPTIONS.filter((s) => s.value).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incentive Type</label>
                  <select value={form.incentive_type} onChange={(e) => setForm({ ...form, incentive_type: e.target.value as Referral['incentive_type'] })}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                    <option value="none">None</option>
                    <option value="discount">Discount</option>
                    <option value="credit">Credit</option>
                    <option value="gift">Gift</option>
                  </select>
                </div>
              </div>
              {form.incentive_type !== 'none' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Incentive Amount ($)</label>
                    <input type="number" min="0" step="0.01" value={form.incentive_amount} onChange={(e) => setForm({ ...form, incentive_amount: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Incentive Status</label>
                    <select value={form.incentive_status} onChange={(e) => setForm({ ...form, incentive_status: e.target.value as Referral['incentive_status'] })}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                      <option value="pending">Pending</option>
                      <option value="awarded">Awarded</option>
                      <option value="redeemed">Redeemed</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={!form.referrer_name.trim() || !form.referred_name.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
                {editing ? 'Save Changes' : 'Create Referral'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

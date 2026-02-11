/**
 * Camp Connect – Medical Log Page
 * Records nurse visits, medication administration, and treatments.
 */

import { useState } from 'react'
import {
  Stethoscope,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Pill,
  Activity,
  CalendarCheck,
  X,
  Trash2,
  Edit2,
} from 'lucide-react'
import {
  useMedicalLogs,
  useMedicalLogStats,
  useMedicalLogFollowUps,
  useCreateMedicalLog,
  useUpdateMedicalLog,
} from '@/hooks/useMedicalLogs'
import type { MedicalLogEntry, MedicalLogMedication } from '@/hooks/useMedicalLogs'
import { useToast } from '@/components/ui/Toast'

// ─── Constants ────────────────────────────────────────────────

const VISIT_TYPES = [
  { value: 'nurse_visit', label: 'Nurse Visit', color: 'bg-blue-100 text-blue-700' },
  { value: 'medication', label: 'Medication', color: 'bg-purple-100 text-purple-700' },
  { value: 'treatment', label: 'Treatment', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'injury', label: 'Injury', color: 'bg-red-100 text-red-700' },
  { value: 'illness', label: 'Illness', color: 'bg-amber-100 text-amber-700' },
] as const

const DISPOSITIONS = [
  { value: 'returned_to_activity', label: 'Returned to Activity', color: 'bg-green-100 text-green-700' },
  { value: 'sent_to_bunk', label: 'Sent to Bunk', color: 'bg-blue-100 text-blue-700' },
  { value: 'sent_home', label: 'Sent Home', color: 'bg-amber-100 text-amber-700' },
  { value: 'hospitalized', label: 'Hospitalized', color: 'bg-red-100 text-red-700' },
] as const

function visitTypeBadge(type: string) {
  const vt = VISIT_TYPES.find((v) => v.value === type)
  return vt ? vt.color : 'bg-gray-100 text-gray-700'
}

function visitTypeLabel(type: string) {
  const vt = VISIT_TYPES.find((v) => v.value === type)
  return vt ? vt.label : type
}

function dispositionBadge(d: string) {
  const disp = DISPOSITIONS.find((v) => v.value === d)
  return disp ? disp.color : 'bg-gray-100 text-gray-700'
}

function dispositionLabel(d: string) {
  const disp = DISPOSITIONS.find((v) => v.value === d)
  return disp ? disp.label : d
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ─── Empty Medication Row ─────────────────────────────────────

const emptyMedication: MedicalLogMedication = { name: '', dose: '', time: '' }

// ─── Component ────────────────────────────────────────────────

export function MedicalLogPage() {
  const { toast } = useToast()

  // Filters
  const [page, setPage] = useState(1)
  const [visitTypeFilter, setVisitTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const perPage = 20

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MedicalLogEntry | null>(null)

  // Form state
  const [formCamperId, setFormCamperId] = useState('')
  const [formCamperName, setFormCamperName] = useState('')
  const [formVisitType, setFormVisitType] = useState('nurse_visit')
  const [formComplaint, setFormComplaint] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTemp, setFormTemp] = useState('')
  const [formBP, setFormBP] = useState('')
  const [formPulse, setFormPulse] = useState('')
  const [formRespRate, setFormRespRate] = useState('')
  const [formMeds, setFormMeds] = useState<MedicalLogMedication[]>([])
  const [formTreatmentNotes, setFormTreatmentNotes] = useState('')
  const [formFollowUp, setFormFollowUp] = useState(false)
  const [formFollowUpDate, setFormFollowUpDate] = useState('')
  const [formDisposition, setFormDisposition] = useState('returned_to_activity')
  const [formParentNotified, setFormParentNotified] = useState(false)

  // Queries
  const { data: logData, isLoading: logsLoading } = useMedicalLogs({
    page,
    per_page: perPage,
    visit_type: visitTypeFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    search: search || undefined,
  })
  const { data: stats, isLoading: statsLoading } = useMedicalLogStats()
  const { data: followUps } = useMedicalLogFollowUps()

  const createMutation = useCreateMedicalLog()
  const updateMutation = useUpdateMedicalLog()

  const logs = logData?.items || []
  const total = logData?.total || 0
  const totalPages = Math.ceil(total / perPage)
  const followUpCount = followUps?.length || 0

  // ─── Helpers ──────────────────────────────────────────────

  function resetForm() {
    setFormCamperId('')
    setFormCamperName('')
    setFormVisitType('nurse_visit')
    setFormComplaint('')
    setFormDescription('')
    setFormTemp('')
    setFormBP('')
    setFormPulse('')
    setFormRespRate('')
    setFormMeds([])
    setFormTreatmentNotes('')
    setFormFollowUp(false)
    setFormFollowUpDate('')
    setFormDisposition('returned_to_activity')
    setFormParentNotified(false)
  }

  function openCreate() {
    resetForm()
    setEditingEntry(null)
    setModalOpen(true)
  }

  function openEdit(entry: MedicalLogEntry) {
    setEditingEntry(entry)
    setFormCamperId(entry.camper_id)
    setFormCamperName(entry.camper_name)
    setFormVisitType(entry.visit_type)
    setFormComplaint(entry.chief_complaint)
    setFormDescription(entry.description)
    setFormTemp(entry.vitals?.temperature || '')
    setFormBP(entry.vitals?.blood_pressure || '')
    setFormPulse(entry.vitals?.pulse || '')
    setFormRespRate(entry.vitals?.respiratory_rate || '')
    setFormMeds(entry.medications_given.length > 0 ? [...entry.medications_given] : [])
    setFormTreatmentNotes(entry.treatment_notes)
    setFormFollowUp(entry.follow_up_required)
    setFormFollowUpDate(entry.follow_up_date || '')
    setFormDisposition(entry.disposition)
    setFormParentNotified(entry.parent_notified)
    setModalOpen(true)
  }

  function addMedication() {
    setFormMeds([...formMeds, { ...emptyMedication }])
  }

  function removeMedication(idx: number) {
    setFormMeds(formMeds.filter((_, i) => i !== idx))
  }

  function updateMedication(idx: number, field: keyof MedicalLogMedication, value: string) {
    const updated = [...formMeds]
    updated[idx] = { ...updated[idx], [field]: value }
    setFormMeds(updated)
  }

  async function handleSubmit() {
    if (!formCamperName.trim()) {
      toast({ type: 'error', message: 'Camper name is required' })
      return
    }

    const payload: Record<string, unknown> = {
      camper_id: formCamperId || formCamperName.toLowerCase().replace(/\s+/g, '-'),
      camper_name: formCamperName,
      visit_type: formVisitType,
      chief_complaint: formComplaint,
      description: formDescription,
      vitals: {
        temperature: formTemp || null,
        blood_pressure: formBP || null,
        pulse: formPulse || null,
        respiratory_rate: formRespRate || null,
      },
      medications_given: formMeds.filter((m) => m.name.trim()),
      treatment_notes: formTreatmentNotes,
      follow_up_required: formFollowUp,
      follow_up_date: formFollowUp ? formFollowUpDate || null : null,
      disposition: formDisposition,
      parent_notified: formParentNotified,
    }

    try {
      if (editingEntry) {
        await updateMutation.mutateAsync({ id: editingEntry.id, ...payload })
        toast({ type: 'success', message: 'Medical log entry updated' })
      } else {
        await createMutation.mutateAsync(payload)
        toast({ type: 'success', message: 'Medical log entry created' })
      }
      setModalOpen(false)
      resetForm()
    } catch {
      toast({ type: 'error', message: 'Failed to save medical log entry' })
    }
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Stethoscope className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Log</h1>
            <p className="text-sm text-gray-500">Nurse visits, medications, and treatments</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </button>
      </div>

      {/* Follow-up alert */}
      {followUpCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700">
            <span className="font-medium">{followUpCount} pending follow-up{followUpCount !== 1 ? 's' : ''}</span> require attention.
          </p>
        </div>
      )}

      {/* Stats cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Visits', value: stats.total_visits, icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100' },
            { label: "Today's Visits", value: stats.visits_today, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Medications Today', value: stats.medications_given_today, icon: Pill, color: 'text-purple-600', bg: 'bg-purple-100' },
            { label: 'Pending Follow-ups', value: stats.follow_ups_pending, icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
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
      ) : null}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by camper name or complaint..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={visitTypeFilter}
          onChange={(e) => { setVisitTypeFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All Visit Types</option>
          {VISIT_TYPES.map((vt) => (
            <option key={vt.value} value={vt.value}>{vt.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
          placeholder="To"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {logsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Stethoscope className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-lg font-medium text-gray-900">No medical log entries</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new entry to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date/Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Camper</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Visit Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Chief Complaint</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Disposition</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Staff</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Follow-up</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{entry.camper_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${visitTypeBadge(entry.visit_type)}`}>
                        {visitTypeLabel(entry.visit_type)}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">
                      {entry.chief_complaint || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${dispositionBadge(entry.disposition)}`}>
                        {dispositionLabel(entry.disposition)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{entry.staff_name}</td>
                    <td className="px-4 py-3">
                      {entry.follow_up_required ? (
                        <span className="inline-flex items-center gap-1 text-amber-600" title={entry.follow_up_date || 'Follow-up needed'}>
                          <CalendarCheck className="h-4 w-4" />
                          <span className="text-xs">{entry.follow_up_date || 'Yes'}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(entry)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingEntry ? 'Edit Medical Log Entry' : 'New Medical Log Entry'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
              {/* Camper */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Camper Name *</label>
                  <input
                    value={formCamperName}
                    onChange={(e) => setFormCamperName(e.target.value)}
                    placeholder="Enter camper name"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Camper ID</label>
                  <input
                    value={formCamperId}
                    onChange={(e) => setFormCamperId(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Visit Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Visit Type *</label>
                <select
                  value={formVisitType}
                  onChange={(e) => setFormVisitType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  {VISIT_TYPES.map((vt) => (
                    <option key={vt.value} value={vt.value}>{vt.label}</option>
                  ))}
                </select>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Chief Complaint</label>
                <input
                  value={formComplaint}
                  onChange={(e) => setFormComplaint(e.target.value)}
                  placeholder="Primary reason for visit"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Detailed description of the visit..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Vitals */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Vitals</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Temperature</label>
                    <input
                      value={formTemp}
                      onChange={(e) => setFormTemp(e.target.value)}
                      placeholder="98.6°F"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Blood Pressure</label>
                    <input
                      value={formBP}
                      onChange={(e) => setFormBP(e.target.value)}
                      placeholder="120/80"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Pulse</label>
                    <input
                      value={formPulse}
                      onChange={(e) => setFormPulse(e.target.value)}
                      placeholder="72 bpm"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Resp. Rate</label>
                    <input
                      value={formRespRate}
                      onChange={(e) => setFormRespRate(e.target.value)}
                      placeholder="16/min"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Medications Given */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Medications Given</label>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add Medication
                  </button>
                </div>
                {formMeds.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No medications recorded</p>
                ) : (
                  <div className="space-y-2">
                    {formMeds.map((med, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          value={med.name}
                          onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                          placeholder="Medication name"
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                        <input
                          value={med.dose}
                          onChange={(e) => updateMedication(idx, 'dose', e.target.value)}
                          placeholder="Dose"
                          className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                        <input
                          value={med.time}
                          onChange={(e) => updateMedication(idx, 'time', e.target.value)}
                          placeholder="Time"
                          type="time"
                          className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedication(idx)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Treatment Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Treatment Notes</label>
                <textarea
                  value={formTreatmentNotes}
                  onChange={(e) => setFormTreatmentNotes(e.target.value)}
                  rows={3}
                  placeholder="Treatment details, observations..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Follow-up */}
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formFollowUp}
                    onChange={(e) => setFormFollowUp(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Follow-up Required
                </label>
                {formFollowUp && (
                  <input
                    type="date"
                    value={formFollowUpDate}
                    onChange={(e) => setFormFollowUpDate(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Disposition */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Disposition</label>
                <select
                  value={formDisposition}
                  onChange={(e) => setFormDisposition(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  {DISPOSITIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Parent Notified */}
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formParentNotified}
                  onChange={(e) => setFormParentNotified(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Parent / Guardian Notified
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {editingEntry ? 'Update Entry' : 'Create Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

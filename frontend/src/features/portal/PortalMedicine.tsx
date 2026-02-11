import { useState } from 'react'
import { Pill, Plus, Loader2 } from 'lucide-react'
import { usePortalCampers } from '@/hooks/usePortal'
import { useEvents } from '@/hooks/useEvents'
import { useMedicineSchedules, useCreateMedicineSchedule, type MedicineSchedule } from '@/hooks/useMedicine'
import { useToast } from '@/components/ui/Toast'

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times', label: 'Three times daily' },
  { value: 'as_needed', label: 'As needed' },
  { value: 'specific_times', label: 'Specific times' },
]

export function PortalMedicine() {
  const { toast } = useToast()
  const { data: campers = [] } = usePortalCampers()
  const { data: events = [] } = useEvents()
  const [selectedCamperId, setSelectedCamperId] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ medicine_name: '', dosage: '', frequency: 'daily', scheduled_times: '', special_instructions: '', prescribed_by: '', start_date: '', end_date: '' })

  const { data: schedules = [], isLoading } = useMedicineSchedules(
    selectedCamperId ? { camper_id: selectedCamperId, event_id: selectedEventId || undefined } : undefined
  )
  const createSchedule = useCreateMedicineSchedule()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCamperId || !selectedEventId) return
    try {
      const times = form.scheduled_times ? form.scheduled_times.split(',').map(t => t.trim()) : undefined
      await createSchedule.mutateAsync({ camper_id: selectedCamperId, event_id: selectedEventId, medicine_name: form.medicine_name, dosage: form.dosage, frequency: form.frequency, scheduled_times: times, special_instructions: form.special_instructions || undefined, prescribed_by: form.prescribed_by || undefined, start_date: form.start_date, end_date: form.end_date || undefined })
      toast({ type: 'success', message: 'Medicine schedule submitted!' })
      setShowForm(false); setForm({ medicine_name: '', dosage: '', frequency: 'daily', scheduled_times: '', special_instructions: '', prescribed_by: '', start_date: '', end_date: '' })
    } catch { toast({ type: 'error', message: 'Failed to submit.' }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Medicine Schedules</h2>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"><Plus className="h-4 w-4" />Add Medicine</button>
      </div>
      <div className="flex items-center gap-3">
        <select value={selectedCamperId} onChange={(e) => setSelectedCamperId(e.target.value)} className="rounded-lg border bg-white px-3 py-2.5 text-sm"><option value="">Select camper</option>{campers.map((c: any) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select>
        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="rounded-lg border bg-white px-3 py-2.5 text-sm"><option value="">Select session</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Medicine Name *</label><input value={form.medicine_name} onChange={e => setForm({...form, medicine_name: e.target.value})} required className="rounded-lg border w-full px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Dosage *</label><input value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} required className="rounded-lg border w-full px-3 py-2 text-sm" placeholder="e.g. 10mg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Frequency</label><select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="rounded-lg border w-full px-3 py-2 text-sm">{FREQUENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Times (comma-separated)</label><input value={form.scheduled_times} onChange={e => setForm({...form, scheduled_times: e.target.value})} className="rounded-lg border w-full px-3 py-2 text-sm" placeholder="08:00, 12:00, 20:00" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Start Date *</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required className="rounded-lg border w-full px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="rounded-lg border w-full px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Prescribed By</label><input value={form.prescribed_by} onChange={e => setForm({...form, prescribed_by: e.target.value})} className="rounded-lg border w-full px-3 py-2 text-sm" placeholder="Dr. Name" /></div>
          <div><label className="block text-sm font-medium mb-1">Special Instructions</label><textarea value={form.special_instructions} onChange={e => setForm({...form, special_instructions: e.target.value})} rows={3} className="rounded-lg border w-full px-3 py-2 text-sm" placeholder="Take with food, etc." /></div>
          <div className="flex gap-2"><button type="submit" disabled={createSchedule.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">{createSchedule.isPending ? 'Submitting...' : 'Submit'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button></div>
        </form>
      )}

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      : schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-gray-50 py-12 text-center"><Pill className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-2 text-sm text-gray-500">No medicine schedules.</p></div>
      ) : (
        <div className="space-y-2">{schedules.map((s: MedicineSchedule) => (
          <div key={s.id} className="rounded-lg border bg-white px-5 py-3">
            <div className="flex items-center justify-between"><span className="text-sm font-medium">{s.medicine_name} - {s.dosage}</span><span className={`rounded-full px-2 py-0.5 text-xs ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></div>
            <p className="mt-1 text-xs text-gray-500">{s.frequency} | {s.scheduled_times?.join(', ') || 'As needed'} | {s.start_date} - {s.end_date || 'Ongoing'}</p>
            {s.special_instructions && <p className="mt-1 text-xs text-amber-600">{s.special_instructions}</p>}
          </div>
        ))}</div>
      )}
    </div>
  )
}

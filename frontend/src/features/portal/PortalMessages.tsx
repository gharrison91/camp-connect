import { useState } from 'react'
import { MessageCircle, Plus, Trash2, Loader2 } from 'lucide-react'
import { usePortalCampers } from '@/hooks/usePortal'
import { useEvents } from '@/hooks/useEvents'
import { useCamperMessages, useCreateCamperMessage, useDeleteCamperMessage } from '@/hooks/useCamperMessages'
import { useToast } from '@/components/ui/Toast'

export function PortalMessages() {
  const { toast } = useToast()
  const { data: campers = [] } = usePortalCampers()
  const { data: events = [] } = useEvents()
  const [selectedCamperId, setSelectedCamperId] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [messageText, setMessageText] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data: messages = [], isLoading } = useCamperMessages(
    selectedCamperId ? { camper_id: selectedCamperId, event_id: selectedEventId || undefined } : undefined
  )
  const createMsg = useCreateCamperMessage()
  const deleteMsg = useDeleteCamperMessage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCamperId || !selectedEventId || !messageText || !scheduledDate) return
    try {
      await createMsg.mutateAsync({ camper_id: selectedCamperId, contact_id: '', event_id: selectedEventId, message_text: messageText, scheduled_date: scheduledDate })
      toast({ type: 'success', message: 'Message scheduled!' })
      setMessageText(''); setScheduledDate(''); setShowForm(false)
    } catch { toast({ type: 'error', message: 'Failed to schedule message.' }) }
  }

  async function handleDelete(id: string) {
    try { await deleteMsg.mutateAsync(id); toast({ type: 'success', message: 'Message cancelled.' }) }
    catch { toast({ type: 'error', message: 'Failed to cancel.' }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Messages to Camper</h2>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"><Plus className="h-4 w-4" />New Message</button>
      </div>

      <div className="flex items-center gap-3">
        <select value={selectedCamperId} onChange={(e) => setSelectedCamperId(e.target.value)} className="rounded-lg border bg-white px-3 py-2.5 text-sm"><option value="">Select camper</option>{campers.map((c: any) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select>
        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="rounded-lg border bg-white px-3 py-2.5 text-sm"><option value="">Select session</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label><input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required className="rounded-lg border bg-white px-3 py-2 text-sm w-full" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} required rows={4} className="rounded-lg border bg-white px-3 py-2 text-sm w-full" placeholder="Write your message..." /></div>
          <div className="flex gap-2"><button type="submit" disabled={createMsg.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">{createMsg.isPending ? 'Sending...' : 'Schedule Message'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button></div>
        </form>
      )}

      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-gray-50 py-12 text-center"><MessageCircle className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-2 text-sm text-gray-500">No scheduled messages yet.</p></div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className="rounded-lg border bg-white px-5 py-3 flex items-start justify-between gap-4">
              <div><p className="text-sm font-medium">{msg.scheduled_date}</p><p className="mt-1 text-sm text-gray-700">{msg.message_text}</p><p className="mt-1 text-xs text-gray-400">{msg.is_read ? 'Read by staff' : 'Pending delivery'}</p></div>
              {!msg.is_read && <button onClick={() => handleDelete(msg.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

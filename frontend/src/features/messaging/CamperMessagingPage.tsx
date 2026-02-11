import { useState, useMemo, useCallback } from 'react'
import {
  MessageCircle,
  Calendar,
  Send,
  Edit3,
  Trash2,
  Check,
  Eye,
  Search,
  Users,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useEvents } from '@/hooks/useEvents'
import { useCampers } from '@/hooks/useCampers'
import { useContacts } from '@/hooks/useContacts'
import {
  useCamperMessages,
  useDailyMessages,
  useCreateCamperMessage,
  useUpdateCamperMessage,
  useDeleteCamperMessage,
  useMarkMessageRead,
  type CamperMessage,
} from '@/hooks/useCamperMessages'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Given a date string (YYYY-MM-DD), return the Monday of that ISO week. */
function getMonday(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

/** Return an array of 7 date strings (Mon-Sun) for the week containing `dateStr`. */
function getWeekDates(dateStr: string): string[] {
  const monday = getMonday(dateStr)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = 'send' | 'daily'

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function CamperMessagingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('send')

  const tabs: { id: Tab; label: string; icon: typeof Send }[] = [
    { id: 'send', label: 'Send Messages', icon: Send },
    { id: 'daily', label: 'Daily View', icon: Calendar },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Camper Messages
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Schedule and manage daily messages for campers from parents and contacts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'send' && <SendMessagesTab />}
      {activeTab === 'daily' && <DailyViewTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Send Messages Tab
// ---------------------------------------------------------------------------

function SendMessagesTab() {
  const { toast } = useToast()
  const { data: events = [] } = useEvents()
  const { data: contacts = [] } = useContacts()
  const createMessage = useCreateCamperMessage()
  const updateMessage = useUpdateCamperMessage()
  const deleteMessage = useDeleteCamperMessage()

  // Form state
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedCamperId, setSelectedCamperId] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [camperSearch, setCamperSearch] = useState('')
  const [showCamperDropdown, setShowCamperDropdown] = useState(false)

  // Week state
  const [weekAnchor, setWeekAnchor] = useState(todayStr())
  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor])
  const [weekMessages, setWeekMessages] = useState<Record<string, string>>({})

  // Editing state
  const [editingMessage, setEditingMessage] = useState<CamperMessage | null>(null)
  const [editText, setEditText] = useState('')

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Camper search
  const { data: camperData } = useCampers({
    search: camperSearch || undefined,
    limit: 10,
  })
  const camperResults = camperData?.items ?? []

  // Fetch existing messages for the selected camper + event
  const { data: existingMessages = [], isLoading: messagesLoading } =
    useCamperMessages(
      selectedCamperId && selectedEventId
        ? { camper_id: selectedCamperId, event_id: selectedEventId }
        : undefined
    )

  // Selected camper display name
  const selectedCamperName = useMemo(() => {
    if (!selectedCamperId) return ''
    const found = camperResults.find((c) => c.id === selectedCamperId)
    if (found) return `${found.first_name} ${found.last_name}`
    // Fallback: check existing messages for a name
    const msg = existingMessages.find((m) => m.camper_id === selectedCamperId)
    return msg?.camper_name ?? 'Selected Camper'
  }, [selectedCamperId, camperResults, existingMessages])

  const handleSelectCamper = useCallback(
    (id: string, name: string) => {
      setSelectedCamperId(id)
      setCamperSearch(name)
      setShowCamperDropdown(false)
    },
    []
  )

  const handleClearCamper = useCallback(() => {
    setSelectedCamperId('')
    setCamperSearch('')
    setWeekMessages({})
  }, [])

  // Week navigation
  const prevWeek = () => {
    const d = new Date(weekAnchor + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    setWeekAnchor(d.toISOString().split('T')[0])
    setWeekMessages({})
  }

  const nextWeek = () => {
    const d = new Date(weekAnchor + 'T00:00:00')
    d.setDate(d.getDate() + 7)
    setWeekAnchor(d.toISOString().split('T')[0])
    setWeekMessages({})
  }

  // Count non-empty day messages
  const daysWithText = Object.values(weekMessages).filter((v) => v.trim()).length

  // Submit all week messages
  const handleSubmitWeek = async () => {
    if (!selectedEventId || !selectedCamperId || !selectedContactId) {
      toast({ type: 'error', message: 'Please select an event, camper, and contact.' })
      return
    }

    const entries = Object.entries(weekMessages).filter(([, text]) => text.trim())
    if (entries.length === 0) {
      toast({ type: 'error', message: 'Please write at least one message.' })
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const [date, text] of entries) {
      try {
        await createMessage.mutateAsync({
          camper_id: selectedCamperId,
          contact_id: selectedContactId,
          event_id: selectedEventId,
          message_text: text.trim(),
          scheduled_date: date,
        })
        successCount++
      } catch {
        errorCount++
      }
    }

    if (successCount > 0) {
      toast({
        type: 'success',
        message: `Scheduled ${successCount} message${successCount !== 1 ? 's' : ''} successfully.`,
      })
      setWeekMessages({})
    }
    if (errorCount > 0) {
      toast({
        type: 'error',
        message: `Failed to schedule ${errorCount} message${errorCount !== 1 ? 's' : ''}.`,
      })
    }
  }

  // Edit existing message
  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return
    try {
      await updateMessage.mutateAsync({
        id: editingMessage.id,
        data: { message_text: editText.trim() },
      })
      toast({ type: 'success', message: 'Message updated.' })
      setEditingMessage(null)
      setEditText('')
    } catch {
      toast({ type: 'error', message: 'Failed to update message.' })
    }
  }

  // Delete existing message
  const handleDelete = async (id: string) => {
    try {
      await deleteMessage.mutateAsync(id)
      toast({ type: 'success', message: 'Message deleted.' })
      setDeletingId(null)
    } catch {
      toast({ type: 'error', message: 'Failed to delete message.' })
    }
  }

  const isSubmitting = createMessage.isPending

  return (
    <div className="space-y-6">
      {/* Selection controls */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Event selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select event...</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Camper search */}
          <div className="relative">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Camper
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search campers..."
                value={selectedCamperId ? selectedCamperName : camperSearch}
                onChange={(e) => {
                  if (selectedCamperId) handleClearCamper()
                  setCamperSearch(e.target.value)
                  setShowCamperDropdown(true)
                }}
                onFocus={() => {
                  if (!selectedCamperId) setShowCamperDropdown(true)
                }}
                onBlur={() => {
                  // Delay to allow click on dropdown item
                  setTimeout(() => setShowCamperDropdown(false), 200)
                }}
                className={cn(
                  'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
                  selectedCamperId && 'bg-emerald-50 border-emerald-200'
                )}
              />
              {selectedCamperId && (
                <button
                  onClick={handleClearCamper}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Autocomplete dropdown */}
            {showCamperDropdown && camperSearch && !selectedCamperId && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="max-h-48 overflow-y-auto py-1">
                  {camperResults.length === 0 ? (
                    <div className="px-4 py-3 text-center text-xs text-gray-500">
                      No campers found
                    </div>
                  ) : (
                    camperResults.map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          handleSelectCamper(c.id, `${c.first_name} ${c.last_name}`)
                        }
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-emerald-50"
                      >
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {c.first_name} {c.last_name}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contact selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Sender (Contact)
            </label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      {selectedEventId && selectedCamperId && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Week navigation */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <button
              onClick={prevWeek}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous Week
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(weekDates[0])} &ndash; {formatDate(weekDates[6])}
              </p>
              <p className="text-xs text-gray-500">
                Week of {formatDate(weekDates[0])}
              </p>
            </div>
            <button
              onClick={nextWeek}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Next Week
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Day columns */}
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {weekDates.map((date, idx) => {
              const isToday = date === todayStr()
              const existingForDay = existingMessages.filter(
                (m) => m.scheduled_date === date
              )
              return (
                <div
                  key={date}
                  className={cn('flex flex-col', isToday && 'bg-emerald-50/30')}
                >
                  {/* Day header */}
                  <div
                    className={cn(
                      'border-b border-gray-100 px-3 py-2.5 text-center',
                      isToday && 'bg-emerald-50'
                    )}
                  >
                    <p
                      className={cn(
                        'text-xs font-semibold',
                        isToday ? 'text-emerald-700' : 'text-gray-500'
                      )}
                    >
                      {DAY_LABELS[idx]}
                    </p>
                    <p
                      className={cn(
                        'text-[11px]',
                        isToday ? 'text-emerald-600' : 'text-gray-400'
                      )}
                    >
                      {formatDate(date)}
                    </p>
                    {isToday && (
                      <span className="mt-0.5 inline-block rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Text area */}
                  <div className="p-2">
                    <textarea
                      value={weekMessages[date] ?? ''}
                      onChange={(e) =>
                        setWeekMessages((prev) => ({
                          ...prev,
                          [date]: e.target.value,
                        }))
                      }
                      placeholder="Write message..."
                      rows={4}
                      className="w-full resize-none rounded-md border border-gray-200 px-2.5 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {(weekMessages[date] ?? '').trim() && (
                      <p className="mt-0.5 text-right text-[10px] text-gray-400">
                        {(weekMessages[date] ?? '').trim().length} chars
                      </p>
                    )}
                  </div>

                  {/* Existing messages indicator */}
                  {existingForDay.length > 0 && (
                    <div className="border-t border-gray-100 px-2 py-1.5">
                      <p className="text-[10px] font-medium text-emerald-600">
                        {existingForDay.length} scheduled
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Submit bar */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MessageCircle className="h-3.5 w-3.5" />
              {daysWithText} day{daysWithText !== 1 ? 's' : ''} with messages
              {!selectedContactId && (
                <span className="text-amber-600"> &mdash; Select a sender to submit</span>
              )}
            </div>
            <button
              onClick={handleSubmitWeek}
              disabled={
                isSubmitting || daysWithText === 0 || !selectedContactId
              }
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Schedule {daysWithText} Message{daysWithText !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Placeholder when no selection */}
      {(!selectedEventId || !selectedCamperId) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Mail className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            Select an event and camper
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Choose an event and search for a camper above to start scheduling messages.
          </p>
        </div>
      )}

      {/* Existing Scheduled Messages */}
      {selectedCamperId && selectedEventId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Scheduled Messages
            </h2>
            {messagesLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            )}
          </div>

          {!messagesLoading && existingMessages.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                No scheduled messages yet for this camper.
              </p>
            </div>
          )}

          {!messagesLoading && existingMessages.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">From</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {existingMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50/50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {formatDate(msg.scheduled_date)}
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p className="truncate text-sm text-gray-700">
                          {msg.message_text}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {msg.contact_name ?? 'Unknown'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {msg.is_read ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <Eye className="h-3 w-3" />
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            <EyeOff className="h-3 w-3" />
                            Unread
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingMessage(msg)
                              setEditText(msg.message_text)
                            }}
                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Edit message"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(msg.id)}
                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            title="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Message</h3>
              <button
                onClick={() => {
                  setEditingMessage(null)
                  setEditText('')
                }}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs text-gray-500">
                  Scheduled for{' '}
                  <span className="font-medium text-gray-700">
                    {formatDate(editingMessage.scheduled_date)}
                  </span>
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Message Text
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => {
                  setEditingMessage(null)
                  setEditText('')
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editText.trim() || updateMessage.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {updateMessage.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Delete Message
                </h3>
                <p className="text-xs text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this scheduled message?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteMessage.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMessage.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Daily View Tab
// ---------------------------------------------------------------------------

function DailyViewTab() {
  const { toast } = useToast()
  const { data: events = [] } = useEvents()
  const markRead = useMarkMessageRead()

  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [eventFilter, setEventFilter] = useState('')

  const { data: dailyData, isLoading } = useDailyMessages(
    selectedDate || undefined,
    eventFilter || undefined
  )

  const bunkGroups = dailyData?.bunk_groups ?? []

  const totalMessages = bunkGroups.reduce(
    (sum, group) => sum + group.messages.length,
    0
  )
  const unreadCount = bunkGroups.reduce(
    (sum, group) => sum + group.messages.filter((m) => !m.is_read).length,
    0
  )

  const handleMarkRead = async (messageId: string) => {
    try {
      await markRead.mutateAsync(messageId)
      toast({ type: 'success', message: 'Message marked as read.' })
    } catch {
      toast({ type: 'error', message: 'Failed to mark message as read.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Event
          </label>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Events</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Summary stats */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MessageCircle className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{totalMessages}</span> messages
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600">
              <EyeOff className="h-4 w-4" />
              <span className="font-medium">{unreadCount}</span> unread
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && bunkGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Calendar className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No messages for this day
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {selectedDate === todayStr()
              ? 'There are no camper messages scheduled for today.'
              : `No messages scheduled for ${formatDate(selectedDate)}.`}
          </p>
        </div>
      )}

      {/* Bunk groups */}
      {!isLoading &&
        bunkGroups.map((group) => (
          <div
            key={group.bunk_id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            {/* Bunk header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {group.bunk_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {group.messages.length} message
                    {group.messages.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {group.messages.some((m) => !m.is_read) && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    {group.messages.filter((m) => !m.is_read).length} unread
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="divide-y divide-gray-50">
              {group.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-start gap-4 px-5 py-4 transition-colors',
                    !msg.is_read && 'bg-amber-50/30'
                  )}
                >
                  {/* Avatar placeholder */}
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      msg.is_read
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-emerald-100 text-emerald-700'
                    )}
                  >
                    {msg.camper_name
                      ? msg.camper_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()
                      : '?'}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {msg.camper_name ?? 'Unknown Camper'}
                      </p>
                      {!msg.is_read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">
                      {msg.message_text}
                    </p>
                  </div>

                  {/* Mark as read button */}
                  {!msg.is_read && (
                    <button
                      onClick={() => handleMarkRead(msg.id)}
                      disabled={markRead.isPending}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark Read
                    </button>
                  )}
                  {msg.is_read && (
                    <div className="flex shrink-0 items-center gap-1 text-xs text-emerald-600">
                      <Check className="h-3.5 w-3.5" />
                      Read
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

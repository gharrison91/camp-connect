import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  MessageSquare,
  Send,
  Mail,
  Phone,
  Search,
  Loader2,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Users,
  CalendarDays,
  HelpCircle,
  ChevronDown,
  Smartphone,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'
import { useEvents } from '@/hooks/useEvents'
import {
  useMessages,
  useMessageTemplates,
  useSendMessage,
  useSendBulkMessages,
  useCreateMessageTemplate,
  useEventRecipients,
  type MessageFilters,
} from '@/hooks/useCommunications'
import { useToast } from '@/components/ui/Toast'
import type { Message } from '@/types'

// \u2500\u2500\u2500 Template variable definitions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

interface TemplateVariable {
  key: string
  label: string
  description: string
  category: 'system' | 'entity'
}

const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: 'today_date', label: 'Today Date', description: 'Current date', category: 'system' },
  { key: 'organization_name', label: 'Organization', description: 'Your organization name', category: 'system' },
  { key: 'sender_name', label: 'Sender Name', description: 'Logged-in user name', category: 'system' },
  { key: 'camper_name', label: 'Camper Name', description: 'Full name of the camper', category: 'entity' },
  { key: 'camper_first_name', label: 'Camper First Name', description: 'First name only', category: 'entity' },
  { key: 'parent_name', label: 'Parent Name', description: 'Primary contact name', category: 'entity' },
  { key: 'event_name', label: 'Event Name', description: 'Name of the event', category: 'entity' },
  { key: 'event_date', label: 'Event Date', description: 'Start date of the event', category: 'entity' },
  { key: 'amount_due', label: 'Amount Due', description: 'Outstanding balance amount', category: 'entity' },
  { key: 'balance', label: 'Balance', description: 'Current account balance', category: 'entity' },
  { key: 'bunk_name', label: 'Bunk Name', description: 'Assigned bunk/cabin', category: 'entity' },
]

function highlightVariables(text: string): React.ReactNode[] {
  const parts = text.split(/(\{\{[^}]+\}\})/g)
  return parts.map((part, i) => {
    if (/^\{\{[^}]+\}\}$/.test(part)) {
      return (
        <span
          key={i}
          className="inline-flex items-center rounded bg-blue-100 px-1 py-0.5 text-xs font-medium text-blue-700"
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// \u2500\u2500\u2500 Status configs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  queued: { label: 'Queued', color: 'bg-gray-100 text-gray-700', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
  bounced: { label: 'Bounced', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
}

type Tab = 'compose' | 'history' | 'templates' | 'texting'

export function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('compose')

  const tabs: { id: Tab; label: string; icon: typeof Send }[] = [
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'history', label: 'Message History', icon: Clock },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'texting', label: 'Texting', icon: Smartphone },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Communications
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Send SMS and email messages to contacts, parents, and staff
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
      {activeTab === 'compose' && <ComposeTab />}
      {activeTab === 'history' && <HistoryTab />}
      {activeTab === 'templates' && <TemplatesTab />}
      {activeTab === 'texting' && <TextingTab />}
    </div>
  )
}

// \u2500\u2500\u2500 Event Quick Send (with recipient list) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function EventQuickSend() {
  const { data: events = [] } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState('')
  const [quickChannel, setQuickChannel] = useState<'sms' | 'email'>('email')
  const [quickSubject, setQuickSubject] = useState('')
  const [quickBody, setQuickBody] = useState('')
  const [quickSent, setQuickSent] = useState(false)
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set())
  const [recipientSearch, setRecipientSearch] = useState('')
  const [showAddRecipient, setShowAddRecipient] = useState(false)
  const sendBulk = useSendBulkMessages()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const { data: recipients = [], isLoading: recipientsLoading } = useEventRecipients(
    selectedEventId || undefined
  )

  // Auto-select all recipients when they load
  useEffect(() => {
    if (recipients.length > 0) {
      setSelectedRecipientIds(new Set(recipients.map((r) => r.contact_id)))
    } else {
      setSelectedRecipientIds(new Set())
    }
  }, [recipients])

  const filteredRecipients = useMemo(() => {
    if (!recipientSearch.trim()) return recipients
    const q = recipientSearch.toLowerCase()
    return recipients.filter(
      (r) =>
        r.first_name.toLowerCase().includes(q) ||
        r.last_name.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(q))
    )
  }, [recipients, recipientSearch])

  const toggleRecipient = useCallback((contactId: string) => {
    setSelectedRecipientIds((prev) => {
      const next = new Set(prev)
      if (next.has(contactId)) {
        next.delete(contactId)
      } else {
        next.add(contactId)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedRecipientIds.size === recipients.length) {
      setSelectedRecipientIds(new Set())
    } else {
      setSelectedRecipientIds(new Set(recipients.map((r) => r.contact_id)))
    }
  }, [recipients, selectedRecipientIds.size])

  const handleQuickSend = async () => {
    if (!selectedEventId || !quickBody || selectedRecipientIds.size === 0) return
    if (quickChannel === 'email' && !quickSubject) return

    try {
      await sendBulk.mutateAsync({
        channel: quickChannel,
        subject: quickChannel === 'email' ? quickSubject : undefined,
        body: quickBody,
        recipient_ids: Array.from(selectedRecipientIds),
      })
      setQuickSent(true)
      setQuickSubject('')
      setQuickBody('')
      toast({
        type: 'success',
        message: `Message sent to ${selectedRecipientIds.size} recipient${selectedRecipientIds.size !== 1 ? 's' : ''}!`,
      })
      setTimeout(() => setQuickSent(false), 3000)
    } catch {
      toast({ type: 'error', message: 'Failed to send bulk message.' })
    }
  }

  if (!hasPermission('comms.messages.send')) return null

  return (
    <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
      <div className="border-b border-blue-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Quick Send to Event</h3>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          Send a message to all registered contacts for an event
        </p>
      </div>
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Select Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => { setSelectedEventId(e.target.value); setRecipientSearch(''); setShowAddRecipient(false) }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Choose event...</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>{evt.name} ({evt.enrolled_count} registered)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Channel</label>
            <div className="flex items-center gap-1 rounded-lg bg-white p-1 border border-gray-200">
              <button onClick={() => setQuickChannel('email')} className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors', quickChannel === 'email' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
              <button onClick={() => setQuickChannel('sms')} className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors', quickChannel === 'sms' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                <Phone className="h-3.5 w-3.5" /> SMS
              </button>
            </div>
          </div>
        </div>

        {/* Recipient List */}
        {selectedEventId && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">
                  Recipients ({selectedRecipientIds.size} of {recipients.length} selected)
                </label>
                <button onClick={() => setShowAddRecipient(!showAddRecipient)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                  <UserPlus className="h-3.5 w-3.5" /> Find Recipient
                </button>
              </div>

              {showAddRecipient && (
                <div className="mb-2 relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} placeholder="Search by name, email, or phone..." className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              )}

              {recipientsLoading ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>
              ) : recipients.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="w-8 px-3 py-2"><input type="checkbox" checked={selectedRecipientIds.size === recipients.length && recipients.length > 0} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRecipients.map((r) => (
                        <tr key={r.contact_id} className={cn('cursor-pointer transition-colors', selectedRecipientIds.has(r.contact_id) ? 'bg-blue-50/50' : 'hover:bg-gray-50')} onClick={() => toggleRecipient(r.contact_id)}>
                          <td className="w-8 px-3 py-1.5"><input type="checkbox" checked={selectedRecipientIds.has(r.contact_id)} onChange={() => toggleRecipient(r.contact_id)} className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                          <td className="px-3 py-1.5 text-xs font-medium text-gray-900">{r.first_name} {r.last_name}</td>
                          <td className="px-3 py-1.5 text-xs text-gray-600">{r.email || '--'}</td>
                          <td className="px-3 py-1.5 text-xs text-gray-600">{r.phone || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-xs text-gray-500">No contacts found for this event.</div>
              )}
            </div>

            {quickChannel === 'email' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Subject</label>
                <input type="text" value={quickSubject} onChange={(e) => setQuickSubject(e.target.value)} placeholder="Email subject line..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Message</label>
              <textarea value={quickBody} onChange={(e) => setQuickBody(e.target.value)} rows={4} placeholder="Type your message to all event registrants..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            {quickSent && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Message sent to all registrants!</div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Users className="h-3.5 w-3.5" />
                {selectedRecipientIds.size} of {recipients.length} recipients selected
              </div>
              <button onClick={handleQuickSend} disabled={sendBulk.isPending || !selectedEventId || !quickBody || selectedRecipientIds.size === 0 || (quickChannel === 'email' && !quickSubject)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50">
                {sendBulk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to {selectedRecipientIds.size} Recipient{selectedRecipientIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// \u2500\u2500\u2500 Compose Tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function ComposeTab() {
  const [channel, setChannel] = useState<'sms' | 'email'>('email')
  const [toAddress, setToAddress] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const sendMessage = useSendMessage()
  const { hasPermission } = usePermissions()

  const handleSend = async () => {
    if (!toAddress || !body) return
    if (channel === 'email' && !subject) return
    try {
      await sendMessage.mutateAsync({ channel, to_address: toAddress, subject: channel === 'email' ? subject : undefined, body })
      setSent(true); setToAddress(''); setSubject(''); setBody('')
      setTimeout(() => setSent(false), 3000)
    } catch (err) { console.error('Send failed:', err) }
  }

  if (!hasPermission('comms.messages.send')) {
    return <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">You don't have permission to send messages.</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EventQuickSend />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            <button onClick={() => setChannel('email')} className={cn('flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors', channel === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}><Mail className="h-4 w-4" /> Email</button>
            <button onClick={() => setChannel('sms')} className={cn('flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors', channel === 'sms' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}><Phone className="h-4 w-4" /> SMS</button>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">To</label>
            <input type="text" value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder={channel === 'email' ? 'recipient@example.com' : '+1 (555) 000-0000'} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          {channel === 'email' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Message subject" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Type your message here..." className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            {channel === 'sms' && <p className="mt-1 text-xs text-gray-400">{body.length}/160 characters{body.length > 160 && ' (will be split into multiple messages)'}</p>}
          </div>
          {sent && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Message sent successfully!</div>}
        </div>
        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button onClick={handleSend} disabled={sendMessage.isPending || !toAddress || !body || (channel === 'email' && !subject)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Message
          </button>
        </div>
      </div>
    </div>
  )
}

// \u2500\u2500\u2500 History Tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function HistoryTab() {
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  const filters: MessageFilters = {}
  if (channelFilter !== 'all') filters.channel = channelFilter as 'sms' | 'email'
  if (statusFilter !== 'all') filters.status = statusFilter as MessageFilters['status']
  if (searchQuery) filters.search = searchQuery

  const { data: messages = [], isLoading } = useMessages(filters)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"><option value="all">All Channels</option><option value="sms">SMS</option><option value="email">Email</option></select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"><option value="all">All Statuses</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="failed">Failed</option></select>
      </div>
      {isLoading && <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">To</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Subject / Preview</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {messages.map((msg) => {
                const status = statusConfig[msg.status] || statusConfig.queued
                const StatusIcon = status.icon
                return (
                  <tr key={msg.id} onClick={() => setSelectedMessage(msg)} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-4 py-3">{msg.channel === 'sms' ? <Phone className="h-4 w-4 text-violet-500" /> : <Mail className="h-4 w-4 text-blue-500" />}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{msg.to_address}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">{msg.subject || msg.body.substring(0, 50)}</td>
                    <td className="px-4 py-3"><span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', status.color)}><StatusIcon className="h-3 w-3" />{status.label}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{msg.sent_at ? new Date(msg.sent_at).toLocaleString() : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {messages.length === 0 && <div className="flex flex-col items-center justify-center py-12"><MessageSquare className="h-10 w-10 text-gray-300" /><p className="mt-2 text-sm text-gray-500">No messages found</p></div>}
        </div>
      )}
      {selectedMessage && <MessageDetailModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />}
    </div>
  )
}

// \u2500\u2500\u2500 Templates Tab (with variable highlighting) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function TemplatesTab() {
  const [showCreate, setShowCreate] = useState(false)
  const { data: templates = [], isLoading } = useMessageTemplates()
  const { hasPermission } = usePermissions()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-4">
        {/* Variable Reference Panel */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              <h4 className="text-xs font-semibold text-gray-900">Available Variables</h4>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">System</p>
                <div className="space-y-1">
                  {TEMPLATE_VARIABLES.filter((v) => v.category === 'system').map((v) => (
                    <VariableItem key={v.key} variable={v} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">Entity</p>
                <div className="space-y-1">
                  {TEMPLATE_VARIABLES.filter((v) => v.category === 'entity').map((v) => (
                    <VariableItem key={v.key} variable={v} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-end">
            {hasPermission('comms.templates.manage') && (
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Create Template</button>
            )}
          </div>
          {isLoading && <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>}
          {!isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{tmpl.name}</h3>
                    <div className="flex gap-1">
                      {tmpl.channel === 'sms' || tmpl.channel === 'both' ? <Phone className="h-4 w-4 text-violet-500" /> : null}
                      {tmpl.channel === 'email' || tmpl.channel === 'both' ? <Mail className="h-4 w-4 text-blue-500" /> : null}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{tmpl.category}</p>
                  <div className="mt-2 line-clamp-2 text-sm text-gray-600">{highlightVariables(tmpl.body)}</div>
                  {tmpl.variables.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tmpl.variables.map((v) => <span key={v} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 font-medium">{`{{${v}}}`}</span>)}
                    </div>
                  )}
                  {tmpl.is_system && <span className="mt-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">System</span>}
                </div>
              ))}
            </div>
          )}
          {!isLoading && templates.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
              <FileText className="h-12 w-12 text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-900">No templates yet</p><p className="mt-1 text-sm text-gray-500">Create message templates for common communications</p>
            </div>
          )}
        </div>
      </div>
      {showCreate && <TemplateCreateModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

function VariableItem({ variable }: { variable: TemplateVariable }) {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div className="group relative flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-gray-50 cursor-default" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <span className="text-xs font-mono text-blue-600">{`{{${variable.key}}}`}</span>
      <HelpCircle className="h-3 w-3 text-gray-300 group-hover:text-gray-400" />
      {showTooltip && (
        <div className="absolute left-full ml-2 z-10 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <p className="text-xs font-medium text-gray-900">{variable.label}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">{variable.description}</p>
        </div>
      )}
    </div>
  )
}

// \u2500\u2500\u2500 Texting Tab (Twilio-style) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function TextingTab() {
  const { data: allMessages = [], isLoading } = useMessages({ channel: 'sms' })
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [conversationSearch, setConversationSearch] = useState('')
  const sendMessage = useSendMessage()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const conversations = useMemo(() => {
    const map = new Map<string, { phone: string; messages: Message[]; lastMessage: Message }>()
    for (const msg of allMessages) {
      const phone = msg.direction === 'outbound' ? msg.to_address : msg.from_address
      if (!map.has(phone)) {
        map.set(phone, { phone, messages: [], lastMessage: msg })
      }
      const conv = map.get(phone)!
      conv.messages.push(msg)
      if (new Date(msg.created_at) > new Date(conv.lastMessage.created_at)) {
        conv.lastMessage = msg
      }
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime())
  }, [allMessages])

  const filteredConversations = useMemo(() => {
    if (!conversationSearch.trim()) return conversations
    const q = conversationSearch.toLowerCase()
    return conversations.filter((c) => c.phone.includes(q) || c.lastMessage.body.toLowerCase().includes(q))
  }, [conversations, conversationSearch])

  const activeConversation = useMemo(() => {
    if (!selectedPhone) return null
    return conversations.find((c) => c.phone === selectedPhone) ?? null
  }, [conversations, selectedPhone])

  const sortedMessages = useMemo(() => {
    if (!activeConversation) return []
    return [...activeConversation.messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [activeConversation])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [sortedMessages])

  const handleSendText = async () => {
    if (!newText.trim() || !selectedPhone) return
    try {
      await sendMessage.mutateAsync({ channel: 'sms', to_address: selectedPhone, body: newText.trim() })
      setNewText('')
    } catch { toast({ type: 'error', message: 'Failed to send text message.' }) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText() }
  }

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>

  return (
    <div className="flex h-[600px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Conversation List */}
      <div className="w-80 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="border-b border-gray-100 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input type="text" value={conversationSearch} onChange={(e) => setConversationSearch(e.target.value)} placeholder="Search conversations..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4"><Smartphone className="h-8 w-8 text-gray-300" /><p className="mt-2 text-xs text-gray-500">No SMS conversations</p></div>
          ) : filteredConversations.map((conv) => (
            <button key={conv.phone} onClick={() => setSelectedPhone(conv.phone)} className={cn('w-full text-left px-4 py-3 border-b border-gray-50 transition-colors', selectedPhone === conv.phone ? 'bg-emerald-50' : 'hover:bg-gray-50')}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{conv.phone}</span>
                <span className="text-[10px] text-gray-400">{new Date(conv.lastMessage.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-500">{conv.lastMessage.direction === 'outbound' ? 'You: ' : ''}{conv.lastMessage.body.substring(0, 60)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col">
        {!selectedPhone ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <MessageSquare className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">Select a conversation</p>
            <p className="mt-1 text-xs text-gray-500">Choose a conversation from the left panel to view messages</p>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-100 px-6 py-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100"><Phone className="h-4 w-4 text-emerald-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedPhone}</p>
                <p className="text-[10px] text-gray-500">{activeConversation?.messages.length ?? 0} messages</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sortedMessages.map((msg, idx) => {
                const isOutbound = msg.direction === 'outbound'
                const prev = idx > 0 ? sortedMessages[idx - 1] : null
                const showTimeSeparator = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 30 * 60 * 1000
                return (
                  <div key={msg.id}>
                    {showTimeSeparator && (
                      <div className="flex items-center justify-center my-2">
                        <span className="text-[10px] text-gray-400 bg-white px-2">{new Date(msg.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                    )}
                    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm', isOutbound ? 'bg-emerald-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md')}>
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        <p className={cn('mt-1 text-[10px]', isOutbound ? 'text-emerald-100' : 'text-gray-400')}>
                          {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          {isOutbound && msg.status === 'delivered' && ' -- Delivered'}
                          {isOutbound && msg.status === 'failed' && ' -- Failed'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-end gap-2">
                <textarea value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder="Type a message..." className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                <button onClick={handleSendText} disabled={!newText.trim() || sendMessage.isPending} className="inline-flex items-center justify-center rounded-xl bg-emerald-600 p-2.5 text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
                  {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// \u2500\u2500\u2500 Message Detail Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function MessageDetailModal({ message, onClose }: { message: Message; onClose: () => void }) {
  const status = statusConfig[message.status] || statusConfig.queued
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Message Details</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            {message.channel === 'sms' ? <Phone className="h-5 w-5 text-violet-500" /> : <Mail className="h-5 w-5 text-blue-500" />}
            <span className="text-sm font-medium text-gray-900">{message.channel.toUpperCase()}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.color)}>{status.label}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">To:</span> <span className="text-gray-900">{message.to_address}</span></div>
            <div><span className="text-gray-500">From:</span> <span className="text-gray-900">{message.from_address}</span></div>
            {message.subject && <div><span className="text-gray-500">Subject:</span> <span className="text-gray-900">{message.subject}</span></div>}
            <div><span className="text-gray-500">Sent:</span> <span className="text-gray-900">{message.sent_at ? new Date(message.sent_at).toLocaleString() : 'Pending'}</span></div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4"><p className="whitespace-pre-wrap text-sm text-gray-700">{message.body}</p></div>
          {message.error_message && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message.error_message}</div>}
        </div>
      </div>
    </div>
  )
}

// \u2500\u2500\u2500 Template Create Modal (with variable insertion) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function TemplateCreateModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<'sms' | 'email' | 'both'>('both')
  const [category, setCategory] = useState('general')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showVarDropdown, setShowVarDropdown] = useState(false)
  const [autocompleteVars, setAutocompleteVars] = useState<TemplateVariable[]>([])
  const [autocompletePos, setAutocompletePos] = useState<{ top: number; left: number } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const createTemplate = useCreateMessageTemplate()

  const extractedVariables = useMemo(() => {
    const matches = body.match(/\{\{(\w+)\}\}/g) || []
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
  }, [body])

  const handleBodyChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setBody(val)
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = val.substring(0, cursorPos)
    const match = textBeforeCursor.match(/\{\{(\w*)$/)
    if (match) {
      const partial = match[1].toLowerCase()
      const filtered = TEMPLATE_VARIABLES.filter((v) => v.key.toLowerCase().includes(partial) || v.label.toLowerCase().includes(partial))
      if (filtered.length > 0) {
        setAutocompleteVars(filtered)
        const ta = bodyRef.current
        if (ta) {
          const lineHeight = 20
          const lines = textBeforeCursor.split('\n')
          const row = lines.length - 1
          setAutocompletePos({ top: (row + 1) * lineHeight + 8, left: 16 })
        }
      } else { setAutocompleteVars([]); setAutocompletePos(null) }
    } else { setAutocompleteVars([]); setAutocompletePos(null) }
  }, [])

  const insertVariable = useCallback((varKey: string) => {
    const ta = bodyRef.current
    if (!ta) {
      setBody((prev) => prev + `{{${varKey}}}`)
      setShowVarDropdown(false); setAutocompleteVars([]); setAutocompletePos(null)
      return
    }
    const cursorPos = ta.selectionStart
    const textBeforeCursor = body.substring(0, cursorPos)
    const textAfterCursor = body.substring(cursorPos)
    const match = textBeforeCursor.match(/\{\{(\w*)$/)
    if (match) {
      const insertText = `{{${varKey}}}`
      const before = textBeforeCursor.substring(0, textBeforeCursor.length - match[0].length)
      setBody(before + insertText + textAfterCursor)
      setTimeout(() => { const newPos = before.length + insertText.length; ta.setSelectionRange(newPos, newPos); ta.focus() }, 0)
    } else {
      const insertText = `{{${varKey}}}`
      setBody(textBeforeCursor + insertText + textAfterCursor)
      setTimeout(() => { const newPos = cursorPos + insertText.length; ta.setSelectionRange(newPos, newPos); ta.focus() }, 0)
    }
    setShowVarDropdown(false); setAutocompleteVars([]); setAutocompletePos(null)
  }, [body])

  const handleCreate = async () => {
    if (!name || !body) return
    await createTemplate.mutateAsync({ name, channel, category, subject: channel !== 'sms' ? subject : undefined, body, variables: extractedVariables })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Template</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="flex">
          <div className="flex-1 space-y-4 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Channel</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value as 'sms' | 'email' | 'both')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="both">Both</option><option value="sms">SMS Only</option><option value="email">Email Only</option></select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="general">General</option><option value="registration">Registration</option><option value="waitlist">Waitlist</option><option value="reminder">Reminder</option><option value="emergency">Emergency</option></select>
              </div>
            </div>
            {channel !== 'sms' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Body</label>
                <div className="relative">
                  <button onClick={() => setShowVarDropdown(!showVarDropdown)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">Insert Variable <ChevronDown className="h-3 w-3" /></button>
                  {showVarDropdown && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                      <div className="max-h-48 overflow-y-auto p-1">
                        {TEMPLATE_VARIABLES.map((v) => (
                          <button key={v.key} onClick={() => insertVariable(v.key)} className="w-full text-left rounded px-3 py-1.5 text-xs hover:bg-blue-50">
                            <span className="font-mono text-blue-600">{`{{${v.key}}}`}</span><span className="ml-2 text-gray-500">{v.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <textarea ref={bodyRef} value={body} onChange={handleBodyChange} rows={5} placeholder={'Use {{variable}} for dynamic content. Type {{ to see autocomplete.'} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              {autocompleteVars.length > 0 && autocompletePos && (
                <div className="absolute z-20 w-56 rounded-lg border border-gray-200 bg-white shadow-lg" style={{ top: autocompletePos.top + 28, left: autocompletePos.left }}>
                  <div className="max-h-36 overflow-y-auto p-1">
                    {autocompleteVars.map((v) => (
                      <button key={v.key} onClick={() => insertVariable(v.key)} className="w-full text-left rounded px-3 py-1.5 text-xs hover:bg-blue-50">
                        <span className="font-mono text-blue-600">{`{{${v.key}}}`}</span><span className="ml-2 text-gray-500">{v.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {extractedVariables.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Detected variables:</p>
                <div className="flex flex-wrap gap-1">
                  {extractedVariables.map((v) => <span key={v} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">{`{{${v}}}`}</span>)}
                </div>
              </div>
            )}
          </div>
          <div className="hidden sm:block w-48 border-l border-gray-100 p-4 bg-gray-50/50">
            <div className="flex items-center gap-1.5 mb-3"><HelpCircle className="h-3.5 w-3.5 text-blue-500" /><p className="text-xs font-semibold text-gray-700">Variables</p></div>
            <div className="space-y-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <button key={v.key} onClick={() => insertVariable(v.key)} className="block w-full text-left rounded px-2 py-1 text-[11px] hover:bg-white transition-colors">
                  <span className="font-mono text-blue-600 block">{`{{${v.key}}}`}</span><span className="text-gray-400">{v.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} disabled={!name || !body || createTemplate.isPending} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {createTemplate.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create Template
          </button>
        </div>
      </div>
    </div>
  )
}

// \u2500\u2500\u2500 Compose Message Modal (reusable from detail pages) \u2500\u2500\u2500\u2500\u2500\u2500

export function ComposeMessageModal({ onClose, prefillTo, prefillChannel }: { onClose: () => void; prefillTo?: string; prefillChannel?: 'sms' | 'email' }) {
  const [channel, setChannel] = useState<'sms' | 'email'>(prefillChannel || 'email')
  const [toAddress, setToAddress] = useState(prefillTo || '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const sendMessage = useSendMessage()
  const { toast } = useToast()

  const handleSend = async () => {
    if (!toAddress || !body) return
    if (channel === 'email' && !subject) return
    try {
      await sendMessage.mutateAsync({ channel, to_address: toAddress, subject: channel === 'email' ? subject : undefined, body })
      toast({ type: 'success', message: 'Message sent!' })
      onClose()
    } catch { toast({ type: 'error', message: 'Failed to send message.' }) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Send {channel === 'email' ? 'Email' : 'Text Message'}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            <button onClick={() => setChannel('email')} className={cn('flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors', channel === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}><Mail className="h-4 w-4" /> Email</button>
            <button onClick={() => setChannel('sms')} className={cn('flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors', channel === 'sms' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}><Phone className="h-4 w-4" /> SMS</button>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">To</label>
            <input type="text" value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder={channel === 'email' ? 'recipient@example.com' : '+1 (555) 000-0000'} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          {channel === 'email' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Message subject" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Type your message here..." className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            {channel === 'sms' && <p className="mt-1 text-xs text-gray-400">{body.length}/160 characters{body.length > 160 && ' (will be split into multiple messages)'}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSend} disabled={sendMessage.isPending || !toAddress || !body || (channel === 'email' && !subject)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

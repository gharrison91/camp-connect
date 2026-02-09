import { useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'
import {
  useMessages,
  useMessageTemplates,
  useSendMessage,
  useCreateMessageTemplate,
  type MessageFilters,
} from '@/hooks/useCommunications'
import type { Message } from '@/types'

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  queued: { label: 'Queued', color: 'bg-gray-100 text-gray-700', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
  bounced: { label: 'Bounced', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
}

type Tab = 'compose' | 'history' | 'templates'

export function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('compose')

  const tabs: { id: Tab; label: string; icon: typeof Send }[] = [
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'history', label: 'Message History', icon: Clock },
    { id: 'templates', label: 'Templates', icon: FileText },
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
    </div>
  )
}

// ─── Compose Tab ─────────────────────────────────────────────

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
      await sendMessage.mutateAsync({
        channel,
        to_address: toAddress,
        subject: channel === 'email' ? subject : undefined,
        body,
      })
      setSent(true)
      setToAddress('')
      setSubject('')
      setBody('')
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      console.error('Send failed:', err)
    }
  }

  if (!hasPermission('comms.messages.send')) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
        You don't have permission to send messages.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Channel Toggle */}
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setChannel('email')}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                channel === 'email'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => setChannel('sms')}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                channel === 'sms'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Phone className="h-4 w-4" />
              SMS
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              To
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder={
                channel === 'email'
                  ? 'recipient@example.com'
                  : '+1 (555) 000-0000'
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {channel === 'email' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Type your message here..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {channel === 'sms' && (
              <p className="mt-1 text-xs text-gray-400">
                {body.length}/160 characters
                {body.length > 160 && ' (will be split into multiple messages)'}
              </p>
            )}
          </div>

          {/* Success message */}
          {sent && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Message sent successfully!
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            onClick={handleSend}
            disabled={
              sendMessage.isPending ||
              !toAddress ||
              !body ||
              (channel === 'email' && !subject)
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Message
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── History Tab ─────────────────────────────────────────────

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
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
        >
          <option value="all">All Channels</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Channel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Subject / Preview
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {messages.map((msg) => {
                const status = statusConfig[msg.status] || statusConfig.queued
                const StatusIcon = status.icon
                return (
                  <tr
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {msg.channel === 'sms' ? (
                        <Phone className="h-4 w-4 text-violet-500" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-500" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {msg.to_address}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">
                      {msg.subject || msg.body.substring(0, 50)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          status.color
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {msg.sent_at
                        ? new Date(msg.sent_at).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No messages found</p>
            </div>
          )}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  )
}

// ─── Templates Tab ───────────────────────────────────────────

function TemplatesTab() {
  const [showCreate, setShowCreate] = useState(false)
  const { data: templates = [], isLoading } = useMessageTemplates()
  const { hasPermission } = usePermissions()

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {hasPermission('comms.templates.manage') && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{tmpl.name}</h3>
                <div className="flex gap-1">
                  {tmpl.channel === 'sms' || tmpl.channel === 'both' ? (
                    <Phone className="h-4 w-4 text-violet-500" />
                  ) : null}
                  {tmpl.channel === 'email' || tmpl.channel === 'both' ? (
                    <Mail className="h-4 w-4 text-blue-500" />
                  ) : null}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">{tmpl.category}</p>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{tmpl.body}</p>
              {tmpl.variables.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {tmpl.variables.map((v) => (
                    <span
                      key={v}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
              {tmpl.is_system && (
                <span className="mt-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                  System
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No templates yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create message templates for common communications
          </p>
        </div>
      )}

      {showCreate && (
        <TemplateCreateModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}

// ─── Message Detail Modal ────────────────────────────────────

function MessageDetailModal({
  message,
  onClose,
}: {
  message: Message
  onClose: () => void
}) {
  const status = statusConfig[message.status] || statusConfig.queued

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Message Details</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            {message.channel === 'sms' ? (
              <Phone className="h-5 w-5 text-violet-500" />
            ) : (
              <Mail className="h-5 w-5 text-blue-500" />
            )}
            <span className="text-sm font-medium text-gray-900">
              {message.channel.toUpperCase()}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.color)}>
              {status.label}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">To:</span> <span className="text-gray-900">{message.to_address}</span></div>
            <div><span className="text-gray-500">From:</span> <span className="text-gray-900">{message.from_address}</span></div>
            {message.subject && (
              <div><span className="text-gray-500">Subject:</span> <span className="text-gray-900">{message.subject}</span></div>
            )}
            <div><span className="text-gray-500">Sent:</span> <span className="text-gray-900">{message.sent_at ? new Date(message.sent_at).toLocaleString() : 'Pending'}</span></div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-sm text-gray-700">{message.body}</p>
          </div>
          {message.error_message && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {message.error_message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Template Create Modal ───────────────────────────────────

function TemplateCreateModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<'sms' | 'email' | 'both'>('both')
  const [category, setCategory] = useState('general')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [variables, setVariables] = useState('')
  const createTemplate = useCreateMessageTemplate()

  const handleCreate = async () => {
    if (!name || !body) return
    await createTemplate.mutateAsync({
      name,
      channel,
      category,
      subject: channel !== 'sms' ? subject : undefined,
      body,
      variables: variables ? variables.split(',').map((v) => v.trim()) : [],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Template</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as 'sms' | 'email' | 'both')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="both">Both</option>
                <option value="sms">SMS Only</option>
                <option value="email">Email Only</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="general">General</option>
                <option value="registration">Registration</option>
                <option value="waitlist">Waitlist</option>
                <option value="reminder">Reminder</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          {channel !== 'sms' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder={'Use {{variable}} for dynamic content'} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Variables (comma-separated)</label>
            <input type="text" value={variables} onChange={(e) => setVariables(e.target.value)} placeholder="camper_name, event_name, parent_name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} disabled={!name || !body || createTemplate.isPending} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {createTemplate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Template
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Camp Connect - Team Chat Page
 * Slack-like layout with channel sidebar and message area.
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  MessageSquare,
  Hash,
  Megaphone,
  Pin,
  Smile,
  Paperclip,
  Send,
  Users,
  Plus,
  X,
  Search,
  ChevronDown,
  Tent,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useChannels,
  useMessages,
  useSendMessage,
  useCreateChannel,
  usePinMessage,
  useReactToMessage,
  usePinnedMessages,
  useUnreadCounts,
  useMarkAsRead,
} from '@/hooks/useTeamChat'
import type { ChatMessage } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, typeof Hash> = {
  general: Hash,
  cabin: Tent,
  activity: Tent,
  staff: UserCog,
  announcement: Megaphone,
}

function channelIcon(type: string) {
  return CHANNEL_ICONS[type] || Hash
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const QUICK_EMOJIS = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F389}', '\u{1F914}', '\u{1F4AF}']

// ─── Create Channel Modal ─────────────────────────────────────

function CreateChannelModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [channelType, setChannelType] = useState('general')
  const createChannel = useCreateChannel()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createChannel.mutateAsync({
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        description,
        channel_type: channelType,
        members: [],
      })
      toast({ type: 'success', message: 'Channel created!' })
      onCreated()
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to create channel' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Channel</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Channel Name</label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700">
              <Hash className="h-4 w-4 text-slate-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. waterfront-staff"
                className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
            <select
              value={channelType}
              onChange={(e) => setChannelType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              <option value="general">General</option>
              <option value="cabin">Cabin</option>
              <option value="activity">Activity</option>
              <option value="staff">Staff</option>
              <option value="announcement">Announcement</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createChannel.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {createChannel.isPending ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Pinned Messages Bar ──────────────────────────────────────

function PinnedBar({ channelId }: { channelId: string }) {
  const { data: pinned } = usePinnedMessages(channelId)
  const [expanded, setExpanded] = useState(false)

  if (!pinned || pinned.length === 0) return null

  return (
    <div className="border-b border-slate-200 bg-amber-50 px-4 py-2 dark:border-slate-700 dark:bg-amber-900/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-sm text-amber-700 dark:text-amber-400"
      >
        <Pin className="h-3.5 w-3.5" />
        <span className="font-medium">{pinned.length} pinned message{pinned.length !== 1 ? 's' : ''}</span>
        <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          {pinned.map((msg) => (
            <div key={msg.id} className="rounded-lg bg-white/60 px-3 py-2 text-sm dark:bg-slate-800/60">
              <span className="font-medium text-slate-900 dark:text-white">{msg.sender_name}: </span>
              <span className="text-slate-600 dark:text-slate-300">{msg.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────

function MessageBubble({
  message,
  channelId,
}: {
  message: ChatMessage
  channelId: string
}) {
  const [showActions, setShowActions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const pinMessage = usePinMessage()
  const reactToMessage = useReactToMessage()

  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div
      className="group relative flex gap-3 px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false) }}
    >
      {/* Avatar */}
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
        {message.sender_avatar ? (
          <img src={message.sender_avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          message.sender_name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{message.sender_name}</span>
          <span className="text-xs text-slate-400">{formatTime(message.created_at)}</span>
          {message.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{message.content}</p>

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {message.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
              >
                <Paperclip className="h-3 w-3" />
                {att.name || 'Attachment'}
              </a>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((r, i) => (
              <button
                key={i}
                onClick={() => reactToMessage.mutate({ channelId, messageId: message.id, emoji: r.emoji })}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                  'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600'
                )}
              >
                <span>{r.emoji}</span>
                <span className="text-slate-500 dark:text-slate-400">{r.user_ids.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions toolbar */}
      {showActions && (
        <div className="absolute -top-3 right-4 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-800">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            title="React"
          >
            <Smile className="h-4 w-4" />
          </button>
          <button
            onClick={() => pinMessage.mutate({ channelId, messageId: message.id, pinned: !message.is_pinned })}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            title={message.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute -top-3 right-20 z-10 flex gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-600 dark:bg-slate-800">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                reactToMessage.mutate({ channelId, messageId: message.id, emoji })
                setShowEmojiPicker(false)
              }}
              className="rounded p-1 text-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Message Input ────────────────────────────────────────────

function MessageInput({ channelId, channelName }: { channelId: string; channelName: string }) {
  const [content, setContent] = useState('')
  const sendMessage = useSendMessage()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!content.trim()) return
    try {
      await sendMessage.mutateAsync({ channelId, content: content.trim() })
      setContent('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch {
      // Error handled by react-query
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [content])

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
        <button className="mb-0.5 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700" title="Attach file">
          <Paperclip className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}`}
          rows={1}
          className="max-h-40 flex-1 resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || sendMessage.isPending}
          className={cn(
            'mb-0.5 rounded-lg p-1.5 transition-colors',
            content.trim()
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'text-slate-300 dark:text-slate-600'
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400">Press Enter to send, Shift+Enter for new line</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export function TeamChatPage() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: channels = [], isLoading: channelsLoading } = useChannels()
  const { data: unreadCounts = [] } = useUnreadCounts()
  const markAsRead = useMarkAsRead()

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || null

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id)
    }
  }, [channels, selectedChannelId])

  const { data: messages = [] } = useMessages(selectedChannelId ?? undefined)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark as read when channel changes
  useEffect(() => {
    if (selectedChannelId) {
      markAsRead.mutate(selectedChannelId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId])

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = []
    let currentDate = ''
    for (const msg of messages) {
      const date = formatDate(msg.created_at)
      if (date !== currentDate) {
        currentDate = date
        groups.push({ date, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    }
    return groups
  }, [messages])

  const unreadMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const u of unreadCounts) {
      map[u.channel_id] = u.count
    }
    return map
  }, [unreadCounts])

  // Filter channels by search
  const filteredChannels = useMemo(() => {
    if (!searchQuery) return channels
    const q = searchQuery.toLowerCase()
    return channels.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
  }, [channels, searchQuery])

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* ─── Channel Sidebar ──────────────────────────────── */}
      <div className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Team Chat</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
            title="Create channel"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 dark:bg-slate-700">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels..."
              className="flex-1 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {channelsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500">No channels yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Create one
              </button>
            </div>
          ) : (
            filteredChannels.map((ch) => {
              const Icon = channelIcon(ch.channel_type)
              const unread = unreadMap[ch.id] || 0
              const isSelected = ch.id === selectedChannelId
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors',
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn('flex-1 truncate text-sm', unread > 0 && 'font-semibold')}>{ch.name}</span>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ─── Message Area ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {selectedChannel ? (
          <>
            {/* Channel header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              {(() => {
                const Icon = channelIcon(selectedChannel.channel_type)
                return <Icon className="h-5 w-5 text-slate-400" />
              })()}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{selectedChannel.name}</h3>
                {selectedChannel.description && (
                  <p className="truncate text-xs text-slate-500">{selectedChannel.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Users className="h-4 w-4" />
                <span>{selectedChannel.members.length} members</span>
              </div>
            </div>

            {/* Pinned bar */}
            <PinnedBar channelId={selectedChannel.id} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30">
                    <MessageSquare className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Welcome to #{selectedChannel.name}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedChannel.description || 'This is the start of the conversation.'}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="relative my-4 flex items-center px-4">
                        <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                        <span className="mx-4 shrink-0 rounded-full bg-white px-3 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                          {group.date}
                        </span>
                        <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                      </div>
                      {group.messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          channelId={selectedChannel.id}
                        />
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <MessageInput channelId={selectedChannel.id} channelName={selectedChannel.name} />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <MessageSquare className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Select a channel</h4>
            <p className="mt-1 text-sm text-slate-500">Choose a channel from the sidebar to start chatting</p>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  )
}

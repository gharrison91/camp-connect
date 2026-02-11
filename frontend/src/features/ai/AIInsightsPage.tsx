/**
 * Camp Connect - AI Insights Page
 * Full-page chat interface powered by Claude for natural language data queries.
 * Features: CSV export, clickable entity links, fuzzy search.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Send,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Database,
  Table2,
  Download,
  ExternalLink,
  Users,
  DollarSign,
  AlertCircle,
  BarChart3,
  ClipboardList,
  Briefcase,
  Home,
  Clock,
  Heart,
  Star,
  List,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAIChat, useSuggestedPrompts } from '@/hooks/useAI'
import type { ChatMessage, ChatResponse } from '@/hooks/useAI'

// Icon map for suggested prompts
const ICON_MAP: Record<string, React.ElementType> = {
  users: Users,
  'dollar-sign': DollarSign,
  'alert-circle': AlertCircle,
  'bar-chart': BarChart3,
  clipboard: ClipboardList,
  briefcase: Briefcase,
  home: Home,
  clock: Clock,
  heart: Heart,
  star: Star,
  list: List,
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  sql?: string | null
  data?: Record<string, unknown>[] | null
  rowCount?: number | null
  entityLinks?: Record<string, string> | null
  error?: string | null
  timestamp: Date
}

export function AIInsightsPage() {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatMutation = useAIChat()
  const { data: suggestedPrompts = [] } = useSuggestedPrompts()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatMutation.isPending) return

    const userMessage: ConversationMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')

    // Build the message history for the API
    const apiMessages: ChatMessage[] = updatedMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    try {
      const response: ChatResponse = await chatMutation.mutateAsync({
        messages: apiMessages,
      })

      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response.response,
        sql: response.sql,
        data: response.data,
        rowCount: response.row_count,
        entityLinks: response.entity_links,
        error: response.error,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content:
          'Sorry, I encountered an error processing your request. Please try again.',
        error: 'request_failed',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                AI Insights
              </h1>
              <p className="text-xs text-gray-500">
                Ask questions about your camp data in plain English
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {isEmpty ? (
          /* Welcome / Suggested Prompts */
          <div className="flex flex-col items-center justify-center h-full px-4 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/25 mb-6">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ask me anything about your camp
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md text-center">
              I can query your registrations, campers, payments, events, staff,
              and more. Just ask in plain English.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl w-full">
              {suggestedPrompts.map((sp) => {
                const Icon = ICON_MAP[sp.icon] || Sparkles
                return (
                  <button
                    key={sp.title}
                    onClick={() => sendMessage(sp.prompt)}
                    className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-violet-200 hover:shadow-md hover:shadow-violet-500/5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-500 group-hover:bg-violet-100 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {sp.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                        {sp.prompt}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}

            {/* Loading indicator */}
            {chatMutation.isPending && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-white border border-gray-100 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing your data...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your camp data..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              disabled={chatMutation.isPending}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || chatMutation.isPending}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all',
                input.trim() && !chatMutation.isPending
                  ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            AI Insights uses Claude to query your data. Results are read-only
            and scoped to your organization.
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------- Message Bubble ----------

function MessageBubble({ message }: { message: ConversationMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-3 text-sm text-white shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 max-w-[85%] space-y-3">
        {/* Response text */}
        <div className="rounded-2xl rounded-tl-sm bg-white border border-gray-100 px-4 py-3 shadow-sm">
          <MarkdownContent content={message.content} />
        </div>

        {/* SQL collapsible */}
        {message.sql && <SQLViewer sql={message.sql} />}

        {/* Data table with CSV export and clickable links */}
        {message.data && message.data.length > 0 && (
          <DataTable
            data={message.data}
            rowCount={message.rowCount ?? message.data.length}
            entityLinks={message.entityLinks ?? null}
          />
        )}
      </div>
    </div>
  )
}

// ---------- Markdown Content (simple renderer) ----------

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="prose prose-sm max-w-none text-gray-700 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_strong]:text-gray-900 [&_li]:my-0.5">
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith('### '))
          return (
            <h3 key={i} className="mt-3 mb-1">
              {line.slice(4)}
            </h3>
          )
        if (line.startsWith('## '))
          return (
            <h2 key={i} className="mt-3 mb-1">
              {line.slice(3)}
            </h2>
          )
        if (line.startsWith('# '))
          return (
            <h1 key={i} className="mt-3 mb-1">
              {line.slice(2)}
            </h1>
          )

        // Bullet points
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <div key={i} className="flex items-start gap-2 ml-1 my-0.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
              <span className="text-sm">
                <InlineFormat text={line.slice(2)} />
              </span>
            </div>
          )

        // Numbered items
        const numMatch = line.match(/^(\d+)\.\s(.+)/)
        if (numMatch)
          return (
            <div key={i} className="flex items-start gap-2 ml-1 my-0.5">
              <span className="text-xs font-medium text-gray-400 mt-0.5 shrink-0 w-4 text-right">
                {numMatch[1]}.
              </span>
              <span className="text-sm">
                <InlineFormat text={numMatch[2]} />
              </span>
            </div>
          )

        // Empty lines
        if (line.trim() === '') return <div key={i} className="h-2" />

        // Regular text
        return (
          <p key={i} className="text-sm my-1">
            <InlineFormat text={line} />
          </p>
        )
      })}
    </div>
  )
}

function InlineFormat({ text }: { text: string }) {
  // Bold: **text** -> <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-gray-900">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// ---------- SQL Viewer ----------

function SQLViewer({ sql }: { sql: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <Database className="h-3.5 w-3.5" />
        View SQL Query
        {isOpen ? (
          <ChevronUp className="ml-auto h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="ml-auto h-3.5 w-3.5" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-gray-100 bg-slate-900 px-4 py-3">
          <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap font-mono">
            {sql}
          </pre>
        </div>
      )}
    </div>
  )
}

// ---------- CSV Export Helper ----------

function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return

  const columns = Object.keys(data[0])

  // Build CSV content
  const header = columns.map((col) => `"${col.replace(/"/g, '""')}"`).join(',')
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col]
        if (val === null || val === undefined) return '""'
        const str = String(val)
        return `"${str.replace(/"/g, '""')}"`
      })
      .join(',')
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

// ---------- Data Table ----------

function DataTable({
  data,
  rowCount,
  entityLinks,
}: {
  data: Record<string, unknown>[]
  rowCount: number
  entityLinks: Record<string, string> | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const columns = Object.keys(data[0] || {})
  const displayRows = data.slice(0, 50)

  // Determine which columns are ID columns that should be hidden
  // (we'll use them for linking but not display UUID values)
  const idColumns = new Set(
    entityLinks ? Object.keys(entityLinks) : []
  )

  // Visible columns = all columns except raw ID columns
  const visibleColumns = columns.filter((col) => !idColumns.has(col))

  // Figure out which visible column should be the "link" column for each entity type
  // e.g., if we have camper_id and first_name, the first_name cell becomes clickable
  const linkableColumns = _detectLinkableColumns(columns, entityLinks)

  const handleCellClick = (row: Record<string, unknown>, col: string) => {
    const linkInfo = linkableColumns[col]
    if (!linkInfo) return

    const id = row[linkInfo.idColumn]
    if (!id) return

    navigate(`/app/${linkInfo.entityType}/${id}`)
  }

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10)
    exportToCSV(data, `camp-connect-export-${timestamp}.csv`)
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Table2 className="h-3.5 w-3.5" />
          View Data ({rowCount} row{rowCount !== 1 ? 's' : ''})
          {isOpen ? (
            <ChevronUp className="ml-auto h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="ml-auto h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-colors border-l border-gray-100"
          title="Export to CSV"
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </button>
      </div>
      {isOpen && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                {visibleColumns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-100"
                  >
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-gray-50',
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  )}
                >
                  {visibleColumns.map((col) => {
                    const isLinkable = !!linkableColumns[col]
                    return (
                      <td
                        key={col}
                        className={cn(
                          'px-3 py-2 whitespace-nowrap max-w-[200px] truncate',
                          isLinkable
                            ? 'text-violet-600 font-medium cursor-pointer hover:text-violet-800 hover:underline'
                            : 'text-gray-700'
                        )}
                        title={String(row[col] ?? '')}
                        onClick={
                          isLinkable
                            ? () => handleCellClick(row, col)
                            : undefined
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          {formatCellValue(row[col])}
                          {isLinkable && (
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                          )}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {rowCount > 50 && (
            <div className="px-4 py-2 text-xs text-gray-400 text-center bg-gray-50 border-t border-gray-100">
              Showing 50 of {rowCount} rows
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- Helpers for clickable links ----------

interface LinkInfo {
  idColumn: string
  entityType: string
}

/**
 * Detect which visible columns should be clickable links.
 * For example, if we have "camper_id" and "first_name" in the same row,
 * the "first_name" column becomes a link to /app/campers/:camper_id.
 *
 * Strategy: for each entity ID column, find the best "display" column
 * to make clickable (name, first_name, email, title, etc.)
 */
function _detectLinkableColumns(
  columns: string[],
  entityLinks: Record<string, string> | null
): Record<string, LinkInfo> {
  if (!entityLinks) return {}

  const result: Record<string, LinkInfo> = {}

  // Name-like column patterns in priority order
  const namePatterns = [
    'name',
    'full_name',
    'first_name',
    'family_name',
    'title',
    'email',
    'event_name',
    'activity_name',
    'camper_name',
    'contact_name',
    'staff_name',
  ]

  for (const [idCol, entityType] of Object.entries(entityLinks)) {
    if (!columns.includes(idCol)) continue

    // Extract prefix from ID column (e.g., "camper" from "camper_id")
    const prefix = idCol.replace(/_id$/, '')

    // Find the best display column for this entity
    let bestCol: string | null = null

    // First, look for columns with the entity prefix
    for (const col of columns) {
      if (col === idCol) continue
      const colLower = col.toLowerCase()

      // Check for prefixed name columns (e.g., camper_name, event_name)
      if (colLower === `${prefix}_name`) {
        bestCol = col
        break
      }
    }

    // If no prefixed column, look for generic name patterns
    if (!bestCol) {
      for (const pattern of namePatterns) {
        const match = columns.find(
          (c) => c.toLowerCase() === pattern && c !== idCol
        )
        if (match) {
          bestCol = match
          break
        }
      }
    }

    // If still nothing, try partial matches
    if (!bestCol) {
      for (const pattern of namePatterns) {
        const match = columns.find(
          (c) =>
            c.toLowerCase().includes(pattern) &&
            c !== idCol &&
            !c.endsWith('_id')
        )
        if (match) {
          bestCol = match
          break
        }
      }
    }

    if (bestCol) {
      result[bestCol] = { idColumn: idCol, entityType }
    }
  }

  return result
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '\u2014'
  if (typeof value === 'number') {
    // Format currency-like numbers
    if (Number.isInteger(value)) return value.toLocaleString()
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

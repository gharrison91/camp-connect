/**
 * Camp Connect - QuotesTab
 * Quote list with create modal, status badges, and convert-to-invoice action.
 */

import { useState } from 'react'
import {
  FileText,
  Loader2,
  Plus,
  Send,
  ArrowRightLeft,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useContacts } from '@/hooks/useContacts'
import {
  useQuotes,
  useCreateQuote,
  useDeleteQuote,
  useSendQuote,
  useConvertQuoteToInvoice,
} from '@/hooks/useQuotes'
import type { Quote, QuoteLineItem } from '@/hooks/useQuotes'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
]

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-50 text-gray-600 ring-gray-500/20',
    sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    viewed: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    rejected: 'bg-red-50 text-red-700 ring-red-600/20',
    expired: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  }
  return styles[status] || styles.draft
}

// ---- Create Quote Modal ----

interface CreateQuoteModalProps {
  onClose: () => void
}

function CreateQuoteModal({ onClose }: CreateQuoteModalProps) {
  const { toast } = useToast()
  const createQuote = useCreateQuote()
  const { data: contacts = [] } = useContacts()

  const [contactId, setContactId] = useState('')
  const [quoteNumber, setQuoteNumber] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    { description: '', amount: 0, quantity: 1 },
  ])

  function addLineItem() {
    setLineItems([...lineItems, { description: '', amount: 0, quantity: 1 }])
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  function updateLineItem(index: number, field: keyof QuoteLineItem, value: string | number) {
    const updated = [...lineItems]
    if (field === 'description') {
      updated[index] = { ...updated[index], description: value as string }
    } else if (field === 'amount') {
      updated[index] = { ...updated[index], amount: Number(value) || 0 }
    } else {
      updated[index] = { ...updated[index], quantity: Number(value) || 1 }
    }
    setLineItems(updated)
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount * item.quantity, 0)
  const total = subtotal

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = lineItems.filter((item) => item.description.trim() !== '')
    if (validItems.length === 0) {
      toast({ type: 'error', message: 'Add at least one line item.' })
      return
    }
    try {
      await createQuote.mutateAsync({
        contact_id: contactId || undefined,
        quote_number: quoteNumber || undefined,
        line_items: validItems,
        subtotal,
        total,
        valid_until: validUntil || undefined,
        notes: notes || undefined,
      })
      toast({ type: 'success', message: 'Quote created.' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to create quote.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Quote</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select contact...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quote Number</label>
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                placeholder="Q-001"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Valid Until</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Line Items</label>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {lineItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
                    min={1}
                    className="w-16 rounded-lg border border-gray-200 px-2 py-2 text-sm text-center focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => updateLineItem(i, 'amount', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min={0}
                    className="w-24 rounded-lg border border-gray-200 px-2 py-2 text-sm text-right focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(i)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-right text-sm font-semibold text-gray-900">
              Total: ${total.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createQuote.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {createQuote.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Quote
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- QuotesTab ----

export function QuotesTab() {
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: quotes = [], isLoading } = useQuotes(
    statusFilter ? { status: statusFilter } : undefined
  )
  const deleteQuote = useDeleteQuote()
  const sendQuote = useSendQuote()
  const convertToInvoice = useConvertQuoteToInvoice()

  async function handleSend(quote: Quote) {
    try {
      await sendQuote.mutateAsync(quote.id)
      toast({ type: 'success', message: 'Quote marked as sent.' })
    } catch {
      toast({ type: 'error', message: 'Failed to send quote.' })
    }
  }

  async function handleConvert(quote: Quote) {
    try {
      await convertToInvoice.mutateAsync(quote.id)
      toast({ type: 'success', message: 'Quote converted to invoice.' })
    } catch {
      toast({ type: 'error', message: 'Failed to convert quote.' })
    }
  }

  async function handleDelete(quote: Quote) {
    try {
      await deleteQuote.mutateAsync(quote.id)
      toast({ type: 'success', message: 'Quote deleted.' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete quote.' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Quote
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <FileText className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No quotes found</p>
          <p className="mt-1 text-sm text-gray-500">Create a quote to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Valid Until</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotes.map((quote) => (
                <tr key={quote.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {quote.contact_name || quote.family_name || '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    ${Number(quote.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                        getStatusBadge(quote.status)
                      )}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {quote.valid_until || '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {quote.status === 'draft' && (
                        <button
                          onClick={() => handleSend(quote)}
                          title="Send quote"
                          className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {(quote.status === 'sent' || quote.status === 'viewed' || quote.status === 'accepted') &&
                        !quote.converted_invoice_id && (
                          <button
                            onClick={() => handleConvert(quote)}
                            title="Convert to invoice"
                            className="rounded p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                        )}
                      {quote.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(quote)}
                          title="Delete quote"
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && <CreateQuoteModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

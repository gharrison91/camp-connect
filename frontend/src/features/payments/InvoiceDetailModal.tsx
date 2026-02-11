/**
 * Camp Connect - InvoiceDetailModal
 * Shows invoice details, line items, and payment actions including ACH.
 */

import { X, Loader2, CheckCircle, Send, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMarkInvoicePaid, useUpdateInvoice, usePayments, useACHSetup } from '@/hooks/usePayments'
import { useToast } from '@/components/ui/Toast'
import type { Invoice } from '@/types'

interface InvoiceDetailModalProps {
  invoice: Invoice
  onClose: () => void
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-50 text-gray-600 ring-gray-500/20',
    sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    overdue: 'bg-red-50 text-red-700 ring-red-600/20',
    cancelled: 'bg-gray-50 text-gray-500 ring-gray-400/20',
  }
  return styles[status] || styles.draft
}

export function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
  const { toast } = useToast()
  const markPaid = useMarkInvoicePaid()
  const updateInvoice = useUpdateInvoice()
  const achSetup = useACHSetup()
  const { data: payments = [] } = usePayments({ invoice_id: invoice.id })

  async function handleMarkPaid() {
    try {
      await markPaid.mutateAsync(invoice.id)
      toast({ type: 'success', message: 'Invoice marked as paid.' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to mark invoice as paid.' })
    }
  }

  async function handleSend() {
    try {
      await updateInvoice.mutateAsync({ id: invoice.id, data: { status: 'sent' } })
      toast({ type: 'success', message: 'Invoice marked as sent.' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to send invoice.' })
    }
  }

  async function handleACH() {
    try {
      const result = await achSetup.mutateAsync({
        invoice_id: invoice.id,
        return_url: window.location.href,
      })
      window.location.href = result.checkout_url
    } catch {
      toast({ type: 'error', message: 'Failed to set up ACH payment. Make sure Stripe is configured.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              {invoice.contact_name || invoice.family_name || 'No contact'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
              getStatusBadge(invoice.status)
            )}>
              {invoice.status}
            </span>
            <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <div className="text-3xl font-bold text-gray-900">
            ${Number(invoice.total).toFixed(2)}
          </div>
          {invoice.due_date && (
            <p className="mt-1 text-sm text-gray-500">Due: {invoice.due_date}</p>
          )}
        </div>

        {/* Line Items */}
        {invoice.line_items && invoice.line_items.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
            <div className="mt-2 overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoice.line_items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                      <td className="px-3 py-2 text-right text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                        ${Number(item.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-3 space-y-1 text-right">
              <p className="text-sm text-gray-500">
                Subtotal: <span className="font-medium text-gray-900">${Number(invoice.subtotal).toFixed(2)}</span>
              </p>
              {Number(invoice.tax) > 0 && (
                <p className="text-sm text-gray-500">
                  Tax: <span className="font-medium text-gray-900">${Number(invoice.tax).toFixed(2)}</span>
                </p>
              )}
              <p className="text-sm font-semibold text-gray-900">
                Total: ${Number(invoice.total).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900">Payments</h3>
            <div className="mt-2 space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="text-sm text-gray-900">
                    ${Number(p.amount).toFixed(2)} via {p.payment_method || 'unknown'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '\u2014'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
            <p className="mt-1 text-sm text-gray-500">{invoice.notes}</p>
          </div>
        )}

        {/* Actions */}
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {invoice.status === 'draft' && (
              <button
                onClick={handleSend}
                disabled={updateInvoice.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {updateInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to Parent
              </button>
            )}
            <button
              onClick={handleACH}
              disabled={achSetup.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {achSetup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
              Pay via Bank Transfer (ACH)
            </button>
            <button
              onClick={handleMarkPaid}
              disabled={markPaid.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {markPaid.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Mark as Paid
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Camp Connect - PaymentsPage
 * Invoice list with status filters and payment history.
 */

import { useState } from 'react'
import { CreditCard, FileText, Loader2, Plus, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInvoices, usePayments } from '@/hooks/usePayments'
import { usePermissions } from '@/hooks/usePermissions'
import type { Invoice, Payment } from '@/types'
import { InvoiceDetailModal } from './InvoiceDetailModal'

type Tab = 'invoices' | 'payments'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-50 text-gray-600 ring-gray-500/20',
    sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    overdue: 'bg-red-50 text-red-700 ring-red-600/20',
    cancelled: 'bg-gray-50 text-gray-500 ring-gray-400/20',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    failed: 'bg-red-50 text-red-700 ring-red-600/20',
    refunded: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  }
  return styles[status] || styles.draft
}

export function PaymentsPage() {
  const { hasPermission } = usePermissions()
  const [tab, setTab] = useState<Tab>('invoices')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices(
    statusFilter ? { status: statusFilter } : undefined
  )
  const { data: payments = [], isLoading: paymentsLoading } = usePayments()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Payments</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('invoices')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            tab === 'invoices'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          )}
        >
          <FileText className="h-4 w-4" />
          Invoices
        </button>
        <button
          onClick={() => setTab('payments')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            tab === 'payments'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          )}
        >
          <CreditCard className="h-4 w-4" />
          Payment History
        </button>
      </div>

      {/* Invoices Tab */}
      {tab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === f.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {invoicesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
              <DollarSign className="h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">No invoices found</p>
              <p className="mt-1 text-sm text-gray-500">Create an invoice to get started.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className="cursor-pointer transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {invoice.contact_name || invoice.family_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ${Number(invoice.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                          getStatusBadge(invoice.status)
                        )}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {invoice.due_date || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div>
          {paymentsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
              <CreditCard className="h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">No payments recorded</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ${Number(payment.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                        {payment.payment_method || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                          getStatusBadge(payment.status)
                        )}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  )
}

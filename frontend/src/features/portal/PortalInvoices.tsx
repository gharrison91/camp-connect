/**
 * Camp Connect - PortalInvoices
 * Invoice list for parent portal.
 */

import { Receipt, Loader2, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePortalInvoices } from '@/hooks/usePortal'

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

export function PortalInvoices() {
  const { data: invoices = [], isLoading } = usePortalInvoices()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Receipt className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No invoices</p>
          <p className="mt-1 text-sm text-gray-500">You have no outstanding invoices.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice: any) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    ${Number(invoice.total).toFixed(2)}
                  </span>
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                    getStatusBadge(invoice.status)
                  )}>
                    {invoice.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {invoice.due_date ? `Due: ${invoice.due_date}` : `Created: ${new Date(invoice.created_at).toLocaleDateString()}`}
                </p>
              </div>

              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                  onClick={() => {
                    // Stripe checkout would redirect here
                    alert('Stripe checkout integration coming soon')
                  }}
                >
                  <CreditCard className="h-3 w-3" />
                  Pay Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

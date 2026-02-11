/**
 * Camp Connect - PortalInvoices
 * Invoice list for parent portal with Stripe checkout (card + ACH).
 */

import { useState } from 'react'
import { Receipt, Loader2, CreditCard, Building2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePortalInvoices } from '@/hooks/usePortal'
import { useCreatePortalCheckout } from '@/hooks/usePayments'
import { useToast } from '@/components/ui/Toast'

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
  const createCheckout = useCreatePortalCheckout()
  const { toast } = useToast()
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null)
  const [payingMethod, setPayingMethod] = useState<'card' | 'ach' | null>(null)

  async function handlePay(invoiceId: string, method: 'card' | 'ach') {
    setPayingInvoiceId(invoiceId)
    setPayingMethod(method)
    try {
      const currentUrl = window.location.href.split('?')[0]
      const result = await createCheckout.mutateAsync({
        invoiceId,
        success_url: currentUrl + '?payment=success',
        cancel_url: currentUrl + '?payment=cancelled',
        payment_method: method,
      })
      // Redirect to Stripe checkout
      if (result.checkout_url) {
        window.location.href = result.checkout_url
      } else {
        toast({ type: 'error', message: 'Could not create checkout session. Please try again.' })
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        'Payment checkout failed. Please try again or contact support.'
      toast({ type: 'error', message })
    } finally {
      setPayingInvoiceId(null)
      setPayingMethod(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // Check for payment return query params
  const params = new URLSearchParams(window.location.search)
  const paymentStatus = params.get('payment')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>

      {/* Payment status feedback */}
      {paymentStatus === 'success' && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CreditCard className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Payment submitted successfully!</p>
            <p className="text-xs text-emerald-600">
              Your payment is being processed. It may take a few moments for the invoice status to update.
            </p>
          </div>
        </div>
      )}

      {paymentStatus === 'cancelled' && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Payment cancelled</p>
            <p className="text-xs text-amber-600">
              You can try again at any time by clicking Pay Now on your invoice.
            </p>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Receipt className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No invoices</p>
          <p className="mt-1 text-sm text-gray-500">You have no outstanding invoices.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice: any) => {
            const isPayable = invoice.status !== 'paid' && invoice.status !== 'cancelled'
            const isThisLoading = payingInvoiceId === invoice.id

            return (
              <div
                key={invoice.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        ${Number(invoice.total).toFixed(2)}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                          getStatusBadge(invoice.status)
                        )}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {invoice.due_date
                        ? `Due: ${invoice.due_date}`
                        : `Created: ${new Date(invoice.created_at).toLocaleDateString()}`}
                    </p>
                    {invoice.line_items && invoice.line_items.length > 0 && (
                      <p className="mt-1 text-xs text-gray-400">
                        {invoice.line_items.map((li: any) => li.description).join(', ')}
                      </p>
                    )}
                  </div>

                  {isPayable && (
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        disabled={isThisLoading}
                        onClick={() => handlePay(invoice.id, 'card')}
                      >
                        {isThisLoading && payingMethod === 'card' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CreditCard className="h-3 w-3" />
                        )}
                        Pay Now
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        disabled={isThisLoading}
                        onClick={() => handlePay(invoice.id, 'ach')}
                        title="Pay with bank account (ACH)"
                      >
                        {isThisLoading && payingMethod === 'ach' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Building2 className="h-3 w-3" />
                        )}
                        Bank (ACH)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

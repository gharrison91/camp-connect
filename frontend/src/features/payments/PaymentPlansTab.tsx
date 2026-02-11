/**
 * Camp Connect - PaymentPlansTab
 * Payment plan list with create modal, progress bars, and installment schedule.
 */

import { useState } from 'react'
import {
  CalendarRange,
  Loader2,
  Plus,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useContacts } from '@/hooks/useContacts'
import { useInvoices } from '@/hooks/usePayments'
import {
  usePaymentPlans,
  useCreatePaymentPlan,
  useMarkInstallmentPaid,
} from '@/hooks/usePaymentPlans'
import type { PaymentPlan } from '@/hooks/usePaymentPlans'

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    cancelled: 'bg-gray-50 text-gray-500 ring-gray-400/20',
    defaulted: 'bg-red-50 text-red-700 ring-red-600/20',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    overdue: 'bg-red-50 text-red-700 ring-red-600/20',
    failed: 'bg-red-50 text-red-700 ring-red-600/20',
  }
  return styles[status] || styles.active
}

// ---- Create Plan Modal ----

interface CreatePlanModalProps {
  onClose: () => void
}

function CreatePlanModal({ onClose }: CreatePlanModalProps) {
  const { toast } = useToast()
  const createPlan = useCreatePaymentPlan()
  const { data: contacts = [] } = useContacts()
  const { data: invoices = [] } = useInvoices()

  const [invoiceId, setInvoiceId] = useState('')
  const [contactId, setContactId] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [numInstallments, setNumInstallments] = useState('3')
  const [frequency, setFrequency] = useState('monthly')
  const [startDate, setStartDate] = useState('')

  // Auto-fill total from invoice
  function handleInvoiceChange(id: string) {
    setInvoiceId(id)
    if (id) {
      const inv = invoices.find((i) => i.id === id)
      if (inv) {
        setTotalAmount(String(inv.total))
        if (inv.contact_id) setContactId(inv.contact_id)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!totalAmount || !startDate) {
      toast({ type: 'error', message: 'Total amount and start date are required.' })
      return
    }
    try {
      await createPlan.mutateAsync({
        invoice_id: invoiceId || undefined,
        contact_id: contactId || undefined,
        total_amount: Number(totalAmount),
        num_installments: Number(numInstallments),
        frequency,
        start_date: startDate,
      })
      toast({ type: 'success', message: 'Payment plan created.' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to create payment plan.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Payment Plan</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice (optional)</label>
            <select
              value={invoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select invoice...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.contact_name || inv.family_name || 'Invoice'} - ${Number(inv.total).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Amount</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                step="0.01"
                min="0"
                required
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Installments</label>
              <input
                type="number"
                value={numInstallments}
                onChange={(e) => setNumInstallments(e.target.value)}
                min="2"
                max="60"
                required
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
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
              disabled={createPlan.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {createPlan.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Plan Detail (inline expansion) ----

function PlanDetail({ plan }: { plan: PaymentPlan }) {
  const { toast } = useToast()
  const markPaid = useMarkInstallmentPaid()

  async function handleMarkPaid(installmentId: string) {
    try {
      await markPaid.mutateAsync({ planId: plan.id, installmentId })
      toast({ type: 'success', message: 'Installment marked as paid.' })
    } catch {
      toast({ type: 'error', message: 'Failed to mark installment as paid.' })
    }
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50/30 px-4 py-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Installment Schedule
      </h4>
      <div className="space-y-1.5">
        {plan.installments.map((inst) => (
          <div
            key={inst.id}
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500">#{inst.installment_number}</span>
              <span className="text-sm font-medium text-gray-900">${Number(inst.amount).toFixed(2)}</span>
              <span className="text-xs text-gray-500">Due: {inst.due_date}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                  getStatusBadge(inst.status)
                )}
              >
                {inst.status}
              </span>
              {inst.status === 'pending' && (
                <button
                  onClick={() => handleMarkPaid(inst.id)}
                  disabled={markPaid.isPending}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                >
                  <CheckCircle className="h-3 w-3" />
                  Paid
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- PaymentPlansTab ----

export function PaymentPlansTab() {
  const [showCreate, setShowCreate] = useState(false)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)

  const { data: plans = [], isLoading } = usePaymentPlans()

  function toggleExpand(planId: string) {
    setExpandedPlanId(expandedPlanId === planId ? null : planId)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <CalendarRange className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No payment plans</p>
          <p className="mt-1 text-sm text-gray-500">Create a payment plan to split invoices into installments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const progress = plan.num_installments > 0 ? (plan.paid_count / plan.num_installments) * 100 : 0
            const isExpanded = expandedPlanId === plan.id

            return (
              <div key={plan.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div
                  onClick={() => toggleExpand(plan.id)}
                  className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {plan.contact_name || '\u2014'}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{plan.frequency}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${Number(plan.total_amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {plan.paid_count}/{plan.num_installments} paid
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-24">
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                        getStatusBadge(plan.status)
                      )}
                    >
                      {plan.status}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded installments */}
                {isExpanded && <PlanDetail plan={plan} />}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

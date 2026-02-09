/**
 * Camp Connect - SpendingAccountModal
 * Manage a camper's spending account balance and daily limit.
 */

import { useState, useEffect } from 'react'
import { X, Loader2, Wallet } from 'lucide-react'
import { useSpendingAccount, useUpdateSpendingAccount, useStoreTransactions } from '@/hooks/useStore'
import { useToast } from '@/components/ui/Toast'

interface SpendingAccountModalProps {
  camperId: string
  camperName: string
  onClose: () => void
}

export function SpendingAccountModal({ camperId, camperName, onClose }: SpendingAccountModalProps) {
  const { toast } = useToast()
  const { data: account, isLoading } = useSpendingAccount(camperId)
  const updateAccount = useUpdateSpendingAccount()
  const { data: transactions = [] } = useStoreTransactions(camperId)

  const [balance, setBalance] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')

  useEffect(() => {
    if (account) {
      setBalance(String(account.balance))
      setDailyLimit(account.daily_limit != null ? String(account.daily_limit) : '')
    }
  }, [account])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      await updateAccount.mutateAsync({
        camperId,
        data: {
          balance: parseFloat(balance),
          daily_limit: dailyLimit ? parseFloat(dailyLimit) : undefined,
        },
      })
      toast({ type: 'success', message: 'Spending account updated.' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to update account.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">{camperName}'s Account</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
        ) : (
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Balance ($)</label>
                <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} min="0" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Daily Limit ($)</label>
                <input type="number" step="0.01" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} min="0" placeholder="No limit" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={updateAccount.isPending} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                {updateAccount.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        )}

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
            <div className="mt-2 space-y-2">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div>
                    <span className="text-sm text-gray-900">{tx.item_name || 'Item'}</span>
                    <span className="ml-2 text-xs text-gray-500">x{tx.quantity}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">${Number(tx.total).toFixed(2)}</span>
                    <p className="text-xs text-gray-400">{new Date(tx.transaction_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

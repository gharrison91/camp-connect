/**
 * Camp Connect - SpendingAccountsPage
 * Full spending accounts management with stats, search, accounts table,
 * expandable transaction history, and modals for creating accounts and adding transactions.
 */

import { useState, useMemo } from 'react'
import {
  Wallet,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Users,
  ArrowUpCircle,
  Loader2,
  X,
  Receipt,
  Filter,
  Calculator,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useSpendingAccounts,
  useSpendingSummary,
  useCreateSpendingAccount,
  useAccountTransactions,
  useAddSpendingTransaction,
} from '@/hooks/useSpendingAccounts'
import { useCampers } from '@/hooks/useCampers'
import { useToast } from '@/components/ui/Toast'
import type { SpendingAccountData, SpendingTransactionData } from '@/types'


// ── Transaction Type Badge ──────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    deposit: 'bg-emerald-100 text-emerald-700',
    purchase: 'bg-red-100 text-red-700',
    refund: 'bg-blue-100 text-blue-700',
    adjustment: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', styles[type] || styles.adjustment)}>
      {type}
    </span>
  )
}


// ── Status Badge ────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}


// ── Stat Card ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: typeof DollarSign
  color: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}


// ── Expandable Transaction Row ──────────────────────────────────────────

function AccountTransactions({ accountId }: { accountId: string }) {
  const { data, isLoading } = useAccountTransactions(accountId, { per_page: 10 })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  const transactions = data?.items || []

  if (transactions.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">
        No transactions yet
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium uppercase text-gray-500">
        <span>Date</span>
        <span>Type</span>
        <span>Description</span>
        <span className="text-right">Amount</span>
        <span>Staff</span>
      </div>
      {transactions.map((txn: SpendingTransactionData) => (
        <div key={txn.id} className="grid grid-cols-5 gap-4 px-4 py-3 text-sm">
          <span className="text-gray-600">
            {new Date(txn.created_at).toLocaleDateString()}
          </span>
          <span>
            <TypeBadge type={txn.type} />
          </span>
          <span className="truncate text-gray-600">{txn.description || '—'}</span>
          <span
            className={cn(
              'text-right font-medium',
              txn.type === 'purchase' ? 'text-red-600' : 'text-emerald-600'
            )}
          >
            {txn.type === 'purchase' ? '-' : '+'}${Number(txn.amount).toFixed(2)}
          </span>
          <span className="text-gray-500">{txn.staff_name || '—'}</span>
        </div>
      ))}
    </div>
  )
}


// ── Create Account Modal ────────────────────────────────────────────────

function CreateAccountModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const createAccount = useCreateSpendingAccount()
  const { data: camperData } = useCampers({ limit: 200 })
  const campers = camperData?.items || []

  const [camperId, setCamperId] = useState('')
  const [initialBalance, setInitialBalance] = useState('0.00')
  const [dailyLimit, setDailyLimit] = useState('')
  const [camperSearch, setCamperSearch] = useState('')

  const filteredCampers = useMemo(() => {
    if (!camperSearch) return campers
    const q = camperSearch.toLowerCase()
    return campers.filter(
      (c: { first_name: string; last_name: string }) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
    )
  }, [campers, camperSearch])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!camperId) {
      toast({ type: 'error', message: 'Please select a camper.' })
      return
    }
    try {
      await createAccount.mutateAsync({
        camper_id: camperId,
        initial_balance: parseFloat(initialBalance) || 0,
        daily_limit: dailyLimit ? parseFloat(dailyLimit) : null,
      })
      toast({ type: 'success', message: 'Spending account created.' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to create account.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Spending Account</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Camper selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Camper
            </label>
            <input
              type="text"
              placeholder="Search campers..."
              value={camperSearch}
              onChange={(e) => setCamperSearch(e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200">
              {filteredCampers.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-500">No campers found</p>
              ) : (
                filteredCampers.map((c: { id: string; first_name: string; last_name: string }) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCamperId(c.id)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-gray-50',
                      camperId === c.id && 'bg-emerald-50 text-emerald-700 font-medium'
                    )}
                  >
                    {c.first_name} {c.last_name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Initial Balance */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Initial Balance ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Daily Limit */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Daily Limit ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="No limit"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAccount.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {createAccount.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ── Add Transaction Modal ───────────────────────────────────────────────

function AddTransactionModal({
  account,
  onClose,
}: {
  account: SpendingAccountData
  onClose: () => void
}) {
  const { toast } = useToast()
  const addTransaction = useAddSpendingTransaction()

  const [amount, setAmount] = useState('')
  const [txnType, setTxnType] = useState('deposit')
  const [description, setDescription] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast({ type: 'error', message: 'Please enter a valid amount.' })
      return
    }
    try {
      await addTransaction.mutateAsync({
        accountId: account.id,
        data: {
          amount: parsedAmount,
          type: txnType,
          description: description || undefined,
        },
      })
      toast({ type: 'success', message: 'Transaction added successfully.' })
      onClose()
    } catch {
      toast({ type: 'error', message: 'Failed to add transaction. Check balance.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Transaction</h2>
            <p className="text-sm text-gray-500">{account.camper_name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">Current Balance</p>
          <p className={cn(
            'text-2xl font-bold',
            account.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            ${Number(account.balance).toFixed(2)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={txnType}
              onChange={(e) => setTxnType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="deposit">Deposit</option>
              <option value="purchase">Purchase</option>
              <option value="refund">Refund</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Amount ($)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addTransaction.isPending}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
                txnType === 'purchase'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              )}
            >
              {addTransaction.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {txnType === 'purchase' ? 'Record Purchase' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ── Main Page Component ─────────────────────────────────────────────────

export function SpendingAccountsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [transactionAccount, setTransactionAccount] = useState<SpendingAccountData | null>(null)

  const filters = useMemo(() => {
    const f: Record<string, string> = {}
    if (search) f.search = search
    if (statusFilter) f.status = statusFilter
    return f
  }, [search, statusFilter])

  const { data: accounts = [], isLoading } = useSpendingAccounts(filters)
  const { data: summary } = useSpendingSummary()

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spending Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage camper store balances, deposits, and purchases
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Account
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Accounts"
          value={summary?.total_accounts ?? 0}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Total Balance"
          value={`$${(summary?.total_balance ?? 0).toFixed(2)}`}
          icon={DollarSign}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Transactions Today"
          value={summary?.transactions_today ?? 0}
          icon={Receipt}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Average Balance"
          value={`$${(summary?.average_balance ?? 0).toFixed(2)}`}
          icon={Calculator}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by camper name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Table Header */}
        <div className="hidden grid-cols-7 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 md:grid">
          <span className="col-span-2">Camper</span>
          <span className="text-right">Balance</span>
          <span className="text-right">Daily Limit</span>
          <span>Status</span>
          <span>Last Transaction</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && accounts.length === 0 && (
          <div className="py-16 text-center">
            <Wallet className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">No spending accounts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a spending account to start tracking camper balances.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              New Account
            </button>
          </div>
        )}

        {/* Account rows */}
        {!isLoading &&
          accounts.map((account: SpendingAccountData) => {
            const isExpanded = expandedId === account.id
            return (
              <div key={account.id} className="border-b border-gray-100 last:border-b-0">
                {/* Main row */}
                <div
                  className="grid cursor-pointer grid-cols-1 gap-2 px-6 py-4 transition-colors hover:bg-gray-50 md:grid-cols-7 md:gap-4 md:items-center"
                  onClick={() => toggleExpanded(account.id)}
                >
                  {/* Camper name */}
                  <div className="col-span-2 flex items-center gap-3">
                    <button className="shrink-0 text-gray-400">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700">
                      {account.camper_name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{account.camper_name}</span>
                  </div>

                  {/* Balance */}
                  <div className="text-right">
                    <span
                      className={cn(
                        'text-base font-semibold',
                        account.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      ${Number(account.balance).toFixed(2)}
                    </span>
                  </div>

                  {/* Daily Limit */}
                  <div className="text-right text-sm text-gray-600">
                    {account.daily_limit != null
                      ? `$${Number(account.daily_limit).toFixed(2)}`
                      : 'No limit'}
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge active={account.is_active} />
                  </div>

                  {/* Last Transaction */}
                  <div className="text-sm text-gray-500">
                    {account.last_transaction_at
                      ? new Date(account.last_transaction_at).toLocaleDateString()
                      : '—'}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setTransactionAccount(account)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Add Txn
                    </button>
                  </div>
                </div>

                {/* Expanded transaction list */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Recent Transactions</h4>
                      <button
                        onClick={() => setTransactionAccount(account)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Transaction
                      </button>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white">
                      <AccountTransactions accountId={account.id} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAccountModal onClose={() => setShowCreateModal(false)} />
      )}
      {transactionAccount && (
        <AddTransactionModal
          account={transactionAccount}
          onClose={() => setTransactionAccount(null)}
        />
      )}
    </div>
  )
}

/**
 * Camp Connect – Budget Tracker
 * Camp budget planning with categories, expenses, and spend tracking.
 */

import { useState, useMemo } from 'react'
import {
  DollarSign,
  Plus,
  BarChart3,
  TrendingUp,
  Wallet,
  Trash2,
  X,
  FolderPlus,
  Receipt,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useBudgets,
  useBudgetStats,
  useBudgetCategories,
  useBudgetExpenses,
  useCreateBudget,
  useUpdateBudget,
  useCreateCategory,
  useCreateExpense,
  useDeleteExpense,
} from '@/hooks/useBudget'
import type { BudgetData } from '@/hooks/useBudget'

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const EXPENSE_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700' },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700' },
}

export function BudgetTrackerPage() {
  const { toast } = useToast()
  const [selectedBudget, setSelectedBudget] = useState<string | undefined>()
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('')
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('')
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetData | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ name: '', fiscal_year: String(new Date().getFullYear()), total_budget: '', notes: '' })
  const [catForm, setCatForm] = useState({ name: '', planned_amount: '' })
  const [expForm, setExpForm] = useState({ category_id: '', description: '', amount: '', date: '', vendor: '', status: 'pending' })

  const { data: budgets = [], isLoading } = useBudgets()
  const { data: stats } = useBudgetStats(selectedBudget)
  const { data: categories = [] } = useBudgetCategories(selectedBudget)
  const { data: expenses = [] } = useBudgetExpenses(selectedBudget, {
    category_id: expenseCategoryFilter || undefined,
    status: expenseStatusFilter || undefined,
  })

  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const createCategory = useCreateCategory()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()

  // Auto-select first budget
  const activeBudget = useMemo(() => {
    if (selectedBudget) return budgets.find(b => b.id === selectedBudget)
    if (budgets.length > 0) {
      setSelectedBudget(budgets[0].id)
      return budgets[0]
    }
    return undefined
  }, [budgets, selectedBudget])

  function openCreateBudget() {
    setEditingBudget(null)
    setBudgetForm({ name: '', fiscal_year: String(new Date().getFullYear()), total_budget: '', notes: '' })
    setShowBudgetModal(true)
  }

  function handleSaveBudget() {
    const payload = {
      name: budgetForm.name,
      fiscal_year: parseInt(budgetForm.fiscal_year),
      total_budget: parseFloat(budgetForm.total_budget) || 0,
      notes: budgetForm.notes || null,
    }
    if (editingBudget) {
      updateBudget.mutate({ id: editingBudget.id, data: payload }, {
        onSuccess: () => { toast({ type: 'success', message: 'Budget updated' }); setShowBudgetModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to update budget' }),
      })
    } else {
      createBudget.mutate(payload, {
        onSuccess: () => { toast({ type: 'success', message: 'Budget created' }); setShowBudgetModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to create budget' }),
      })
    }
  }

  function handleAddCategory() {
    if (!selectedBudget) return
    createCategory.mutate({ budgetId: selectedBudget, data: { name: catForm.name, planned_amount: parseFloat(catForm.planned_amount) || 0 } }, {
      onSuccess: () => { toast({ type: 'success', message: 'Category added' }); setShowCategoryModal(false); setCatForm({ name: '', planned_amount: '' }) },
      onError: () => toast({ type: 'error', message: 'Failed to add category' }),
    })
  }

  function handleAddExpense() {
    if (!selectedBudget) return
    createExpense.mutate({ budgetId: selectedBudget, data: { category_id: expForm.category_id, description: expForm.description, amount: parseFloat(expForm.amount) || 0, date: expForm.date, vendor: expForm.vendor || null, status: expForm.status } }, {
      onSuccess: () => { toast({ type: 'success', message: 'Expense added' }); setShowExpenseModal(false); setExpForm({ category_id: '', description: '', amount: '', date: '', vendor: '', status: 'pending' }) },
      onError: () => toast({ type: 'error', message: 'Failed to add expense' }),
    })
  }

  function handleDeleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return
    deleteExpense.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Expense deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete' }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Tracker</h1>
            <p className="text-sm text-gray-500">Plan and track camp spending by category</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedBudget && (
            <>
              <button onClick={() => setShowCategoryModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <FolderPlus className="h-4 w-4" /> Category
              </button>
              <button onClick={() => { setExpForm({ ...expForm, category_id: categories[0]?.id || '' }); setShowExpenseModal(true) }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Receipt className="h-4 w-4" /> Expense
              </button>
            </>
          )}
          <button onClick={openCreateBudget} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> New Budget
          </button>
        </div>
      </div>

      {/* Budget selector */}
      {budgets.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {budgets.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBudget(b.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${selectedBudget === b.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {b.name} ({b.fiscal_year})
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            { label: 'Total Budget', value: fmtCurrency(stats.total_budget), icon: Wallet, color: 'text-gray-600', bg: 'bg-gray-100' },
            { label: 'Planned', value: fmtCurrency(stats.total_planned), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Spent', value: fmtCurrency(stats.total_spent), icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
            { label: 'Remaining', value: fmtCurrency(stats.remaining), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Categories', value: stats.category_count, icon: FolderPlus, color: 'text-purple-600', bg: 'bg-purple-100' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>
      ) : !activeBudget ? (
        <div className="py-16 text-center rounded-xl border border-gray-200 bg-white">
          <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">No budgets yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first budget to start tracking expenses.</p>
        </div>
      ) : (
        <>
          {/* Category breakdown */}
          {categories.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Category Breakdown</h2>
              <div className="space-y-3">
                {categories.map(cat => {
                  const pct = cat.planned_amount > 0 ? Math.round((cat.actual_amount / cat.planned_amount) * 100) : 0
                  const over = pct > 100
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{cat.name}</span>
                        <span className="text-gray-500">{fmtCurrency(cat.actual_amount)} / {fmtCurrency(cat.planned_amount)} ({pct}%)</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Expense filters */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
            <div className="flex-1" />
            <select value={expenseCategoryFilter} onChange={e => setExpenseCategoryFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={expenseStatusFilter} onChange={e => setExpenseStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Expenses table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {expenses.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">No expenses found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {expenses.map(exp => {
                      const st = EXPENSE_STATUS[exp.status] || EXPENSE_STATUS.pending
                      return (
                        <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{exp.description}</td>
                          <td className="px-4 py-3 text-gray-600">{exp.category_name}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{fmtCurrency(exp.amount)}</td>
                          <td className="px-4 py-3 text-gray-500">{fmtDate(exp.date)}</td>
                          <td className="px-4 py-3 text-gray-500">{exp.vendor || '—'}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>{st.label}</span></td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDeleteExpense(exp.id)} className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Budget Create/Edit Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editingBudget ? 'Edit Budget' : 'New Budget'}</h3>
              <button onClick={() => setShowBudgetModal(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={budgetForm.name} onChange={e => setBudgetForm({...budgetForm, name: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label><input type="number" value={budgetForm.fiscal_year} onChange={e => setBudgetForm({...budgetForm, fiscal_year: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Budget ($)</label><input type="number" step="0.01" value={budgetForm.total_budget} onChange={e => setBudgetForm({...budgetForm, total_budget: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={budgetForm.notes} onChange={e => setBudgetForm({...budgetForm, notes: e.target.value})} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowBudgetModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveBudget} disabled={!budgetForm.name || createBudget.isPending || updateBudget.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {createBudget.isPending || updateBudget.isPending ? 'Saving...' : editingBudget ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="e.g. Food & Dining" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Planned Amount ($)</label><input type="number" step="0.01" value={catForm.planned_amount} onChange={e => setCatForm({...catForm, planned_amount: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCategoryModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddCategory} disabled={!catForm.name || createCategory.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {createCategory.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={expForm.category_id} onChange={e => setExpForm({...expForm, category_id: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><input value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label><input type="number" step="0.01" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date *</label><input type="date" value={expForm.date} onChange={e => setExpForm({...expForm, date: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label><input value={expForm.vendor} onChange={e => setExpForm({...expForm, vendor: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowExpenseModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddExpense} disabled={!expForm.category_id || !expForm.description || !expForm.amount || !expForm.date || createExpense.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {createExpense.isPending ? 'Adding...' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

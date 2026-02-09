/**
 * Camp Connect - StoreManagementPage
 * Full store management with items CRUD and transaction history.
 */

import { useState } from 'react'
import { ShoppingBag, Package, Plus, Edit2, Trash2, Loader2, X, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStoreItems, useCreateStoreItem, useUpdateStoreItem, useDeleteStoreItem, useStoreTransactions } from '@/hooks/useStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/Toast'
import type { StoreItem, StoreItemCreate } from '@/types'

type Tab = 'items' | 'transactions'

export function StoreManagementPage() {
  const { hasPermission } = usePermissions()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('items')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null)

  const { data: items = [], isLoading: itemsLoading } = useStoreItems()
  const { data: transactions = [], isLoading: txLoading } = useStoreTransactions()
  const createItem = useCreateStoreItem()
  const updateItem = useUpdateStoreItem()
  const deleteItem = useDeleteStoreItem()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [isActive, setIsActive] = useState(true)

  function openCreate() {
    setEditingItem(null); setName(''); setDescription(''); setCategory(''); setPrice(''); setStock(''); setIsActive(true); setShowModal(true)
  }

  function openEdit(item: StoreItem) {
    setEditingItem(item); setName(item.name); setDescription(item.description || ''); setCategory(item.category || ''); setPrice(String(item.price)); setStock(String(item.quantity_in_stock)); setIsActive(item.is_active); setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const data: StoreItemCreate = { name, description: description || undefined, category: category || undefined, price: parseFloat(price), quantity_in_stock: parseInt(stock) || 0, is_active: isActive }
    try {
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, data })
        toast({ type: 'success', message: 'Item updated.' })
      } else {
        await createItem.mutateAsync(data)
        toast({ type: 'success', message: 'Item created.' })
      }
      setShowModal(false)
    } catch {
      toast({ type: 'error', message: 'Failed to save item.' })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItem.mutateAsync(id)
      toast({ type: 'success', message: 'Item deleted.' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete item.' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Camp Store</h1>
        {tab === 'items' && hasPermission('store.manage.manage') && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setTab('items')} className={cn('flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors', tab === 'items' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <Package className="h-4 w-4" /> Items
        </button>
        <button onClick={() => setTab('transactions')} className={cn('flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors', tab === 'transactions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <Receipt className="h-4 w-4" /> Transactions
        </button>
      </div>

      {/* Items */}
      {tab === 'items' && (
        itemsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
            <ShoppingBag className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">No store items</p>
            <p className="mt-1 text-sm text-gray-500">Add items to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                    {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset', item.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-gray-50 text-gray-500 ring-gray-400/20')}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {item.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">${Number(item.price).toFixed(2)}</span>
                  <span className="text-xs text-gray-500">Stock: {item.quantity_in_stock}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Transactions */}
      {tab === 'transactions' && (
        txLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
            <Receipt className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">No transactions</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Camper</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Item</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{tx.camper_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tx.item_name || '—'}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">{tx.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">${Number(tx.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="snacks, clothing..." className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Stock</label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300" />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createItem.isPending || updateItem.isPending} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
                  {(createItem.isPending || updateItem.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

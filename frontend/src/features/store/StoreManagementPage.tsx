/**
 * Camp Connect - StoreManagementPage
 * Full store management with items CRUD, transaction history,
 * and e-commerce integration settings (Shopify / WooCommerce / Square).
 */

import { useState } from 'react'
import {
  ShoppingBag,
  Package,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Receipt,
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useStoreItems,
  useCreateStoreItem,
  useUpdateStoreItem,
  useDeleteStoreItem,
  useStoreTransactions,
  useStoreIntegration,
  useUpdateStoreIntegration,
  useTestStoreConnection,
  useSyncStoreProducts,
} from '@/hooks/useStore'
import type { StoreIntegrationUpdate } from '@/hooks/useStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/Toast'
import type { StoreItem, StoreItemCreate } from '@/types'

type Tab = 'items' | 'transactions' | 'integrations'

// --- Provider metadata ---
const PROVIDERS = [
  { value: 'none', label: 'None', description: 'No e-commerce integration', color: 'bg-gray-100 text-gray-600' },
  { value: 'shopify', label: 'Shopify', description: 'Sync products from your Shopify store', color: 'bg-green-100 text-green-700' },
  { value: 'woocommerce', label: 'WooCommerce', description: 'Connect your WooCommerce / WordPress store', color: 'bg-purple-100 text-purple-700' },
  { value: 'square', label: 'Square', description: 'Import items from Square POS', color: 'bg-blue-100 text-blue-700' },
] as const

// --- Integrations Tab Component ---
function IntegrationsTab() {
  const { toast } = useToast()
  const { data: integration, isLoading } = useStoreIntegration()
  const updateIntegration = useUpdateStoreIntegration()
  const testConnection = useTestStoreConnection()
  const syncProducts = useSyncStoreProducts()

  const [provider, setProvider] = useState<string>('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [storeUrl, setStoreUrl] = useState('')
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Sync local state with fetched data on first load
  if (integration && !initialized) {
    setProvider(integration.provider)
    setApiKey(integration.api_key)
    setApiSecret(integration.api_secret)
    setStoreUrl(integration.store_url)
    setSyncEnabled(integration.sync_enabled)
    setInitialized(true)
  }

  async function handleSave() {
    const data: StoreIntegrationUpdate = {
      provider,
      api_key: apiKey,
      api_secret: apiSecret,
      store_url: storeUrl,
      sync_enabled: syncEnabled,
    }
    try {
      await updateIntegration.mutateAsync(data)
      toast({ type: 'success', message: 'Integration settings saved.' })
    } catch {
      toast({ type: 'error', message: 'Failed to save integration settings.' })
    }
  }

  async function handleTestConnection() {
    try {
      const result = await testConnection.mutateAsync()
      if (result.success) {
        toast({ type: 'success', message: `${result.message} (${result.product_count} products found)` })
      } else {
        toast({ type: 'error', message: result.message })
      }
    } catch {
      toast({ type: 'error', message: 'Connection test failed.' })
    }
  }

  async function handleSync() {
    try {
      const result = await syncProducts.mutateAsync()
      if (result.errors === 0) {
        toast({ type: 'success', message: result.message })
      } else {
        toast({ type: 'error', message: `Synced ${result.synced} products with ${result.errors} errors.` })
      }
    } catch {
      toast({ type: 'error', message: 'Product sync failed.' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">E-Commerce Provider</h3>
        <p className="mt-1 text-xs text-gray-500">
          Connect your external e-commerce platform to sync products into the Camp Store.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProvider(p.value)}
              className={cn(
                'flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all',
                provider === p.value
                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold',
                  p.color
                )}
              >
                {p.label}
              </span>
              <span className="mt-2 text-xs text-gray-500">{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Credentials */}
      {provider !== 'none' && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">API Credentials</h3>
          <p className="mt-1 text-xs text-gray-500">
            Enter the API credentials from your {PROVIDERS.find((p) => p.value === provider)?.label} account.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter API secret..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">Store URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://your-store.myshopify.com"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {storeUrl && (
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-200 p-2.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Auto-sync toggle */}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={syncEnabled}
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                syncEnabled ? 'bg-emerald-500' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                  syncEnabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-gray-900">Auto-sync enabled</span>
              <p className="text-xs text-gray-500">Automatically sync products on a daily schedule.</p>
            </div>
          </div>

          {/* Last sync */}
          {integration?.last_sync && (
            <p className="mt-3 text-xs text-gray-400">
              Last synced: {new Date(integration.last_sync).toLocaleString()}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateIntegration.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {updateIntegration.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Settings
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testConnection.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {testConnection.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : testConnection.data?.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : testConnection.data && !testConnection.data.success ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Plug className="h-4 w-4" />
              )}
              Test Connection
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncProducts.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {syncProducts.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync Products
            </button>
          </div>

          {/* Test result feedback */}
          {testConnection.data && (
            <div
              className={cn(
                'mt-4 rounded-lg border px-4 py-3 text-sm',
                testConnection.data.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              )}
            >
              {testConnection.data.message}
              {testConnection.data.product_count != null && (
                <span className="ml-1 font-medium">
                  ({testConnection.data.product_count} products found)
                </span>
              )}
            </div>
          )}

          {/* Sync result feedback */}
          {syncProducts.data && (
            <div
              className={cn(
                'mt-3 rounded-lg border px-4 py-3 text-sm',
                syncProducts.data.errors === 0
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              )}
            >
              {syncProducts.data.message}
            </div>
          )}
        </div>
      )}

      {/* No provider selected info */}
      {provider === 'none' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
          <Plug className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No integration configured</p>
          <p className="mt-1 text-sm text-gray-500">
            Select a provider above to connect your e-commerce store.
          </p>
        </div>
      )}
    </div>
  )
}

// --- Main Page ---
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
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setTab('items')} className={cn('flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors', tab === 'items' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <Package className="h-4 w-4" /> Items
        </button>
        <button onClick={() => setTab('transactions')} className={cn('flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors', tab === 'transactions' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <Receipt className="h-4 w-4" /> Transactions
        </button>
        <button onClick={() => setTab('integrations')} className={cn('flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors', tab === 'integrations' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
          <Plug className="h-4 w-4" /> Integrations
        </button>
      </div>

      {/* Items */}
      {tab === 'items' && (
        itemsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
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
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
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
                    <td className="px-4 py-3 text-sm text-gray-900">{tx.camper_name || '\u2014'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tx.item_name || '\u2014'}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">{tx.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">${Number(tx.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Integrations */}
      {tab === 'integrations' && <IntegrationsTab />}

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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="snacks, clothing..." className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Stock</label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
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
                <button type="submit" disabled={createItem.isPending || updateItem.isPending} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">
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

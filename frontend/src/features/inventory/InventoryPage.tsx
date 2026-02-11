import { useState, useEffect } from 'react'
import {
  Package,
  Search,
  Plus,
  AlertCircle,
  ArrowRightLeft,
  DollarSign,
  MapPin,
  Loader2,
  Trash2,
  Pencil,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Boxes,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  useInventoryItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useCheckoutItem,
  useReturnItem,
  useCheckouts,
  useLowStockItems,
  useInventoryStats,
} from '@/hooks/useInventory'
import type { InventoryItem, CheckoutRecord } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: 'sports', label: 'Sports', color: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  { value: 'arts', label: 'Arts', color: 'bg-purple-50 text-purple-700 ring-purple-600/20' },
  { value: 'kitchen', label: 'Kitchen', color: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
  { value: 'medical', label: 'Medical', color: 'bg-red-50 text-red-700 ring-red-600/20' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-slate-50 text-slate-700 ring-slate-600/20' },
  { value: 'office', label: 'Office', color: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20' },
  { value: 'other', label: 'Other', color: 'bg-gray-50 text-gray-700 ring-gray-600/20' },
] as const

const CONDITION_BADGES: Record<string, string> = {
  new: 'bg-green-50 text-green-700 ring-green-600/20',
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  fair: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  poor: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  broken: 'bg-red-50 text-red-700 ring-red-600/20',
}

const STATUS_BADGES: Record<string, string> = {
  out: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  returned: 'bg-green-50 text-green-700 ring-green-600/20',
  overdue: 'bg-red-50 text-red-700 ring-red-600/20',
}

type Tab = 'items' | 'low-stock' | 'checkouts'
type SortBy = 'name' | 'quantity' | 'value' | 'last_checked'

function getCategoryMeta(cat: string) {
  return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[CATEGORIES.length - 1]
}

// ---------------------------------------------------------------------------
// ItemFormModal
// ---------------------------------------------------------------------------

function ItemFormModal({
  item,
  onClose,
  onSave,
  isSaving,
}: {
  item: InventoryItem | null
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  isSaving: boolean
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<string>(item?.category ?? 'other')
  const [sku, setSku] = useState(item?.sku ?? '')
  const [quantity, setQuantity] = useState(item?.quantity ?? 0)
  const [minQuantity, setMinQuantity] = useState(item?.min_quantity ?? 0)
  const [location, setLocation] = useState(item?.location ?? '')
  const [condition, setCondition] = useState<string>(item?.condition ?? 'good')
  const [unitCost, setUnitCost] = useState(item?.unit_cost ?? 0)
  const [notes, setNotes] = useState(item?.notes ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {item ? 'Edit Item' : 'Add Item'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Soccer Balls"
              />
            </div>
            {/* Category + Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="broken">Broken</option>
                </select>
              </div>
            </div>
            {/* SKU */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Optional SKU"
              />
            </div>
            {/* Quantity + Min Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Min Quantity</label>
                <input
                  type="number"
                  min={0}
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            {/* Location */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Equipment Shed A"
              />
            </div>
            {/* Unit Cost */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Unit Cost ($)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {/* Notes */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                name,
                category,
                sku: sku || undefined,
                quantity,
                min_quantity: minQuantity,
                location: location || undefined,
                condition,
                unit_cost: unitCost,
                notes: notes || undefined,
              })
            }
            disabled={!name.trim() || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {item ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CheckoutModal
// ---------------------------------------------------------------------------

function CheckoutModal({
  item,
  onClose,
  onCheckout,
  isSaving,
}: {
  item: InventoryItem
  onClose: () => void
  onCheckout: (data: { quantity: number; checked_out_by: string; checked_out_to: string; expected_return?: string }) => void
  isSaving: boolean
}) {
  const [qty, setQty] = useState(1)
  const [checkedOutBy, setCheckedOutBy] = useState('')
  const [checkedOutTo, setCheckedOutTo] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Checkout: {item.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Quantity (max {item.quantity})
            </label>
            <input
              type="number"
              min={1}
              max={item.quantity}
              value={qty}
              onChange={(e) => setQty(Math.min(Number(e.target.value), item.quantity))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Checked Out By *</label>
            <input
              type="text"
              value={checkedOutBy}
              onChange={(e) => setCheckedOutBy(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Staff name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Checked Out To *</label>
            <input
              type="text"
              value={checkedOutTo}
              onChange={(e) => setCheckedOutTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Staff/activity name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Expected Return</label>
            <input
              type="date"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onCheckout({
                quantity: qty,
                checked_out_by: checkedOutBy,
                checked_out_to: checkedOutTo,
                expected_return: expectedReturn || undefined,
              })
            }
            disabled={!checkedOutBy.trim() || !checkedOutTo.trim() || qty < 1 || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// InventoryPage (main export)
// ---------------------------------------------------------------------------

export function InventoryPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [checkoutItem, setCheckoutItem] = useState<InventoryItem | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Queries
  const { data: items = [], isLoading: itemsLoading } = useInventoryItems({
    search: debouncedSearch || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  })
  const { data: lowStockItems = [], isLoading: lowStockLoading } = useLowStockItems()
  const { data: checkouts = [], isLoading: checkoutsLoading } = useCheckouts()
  const { data: stats } = useInventoryStats()

  // Mutations
  const createMut = useCreateItem()
  const updateMut = useUpdateItem()
  const deleteMut = useDeleteItem()
  const checkoutMut = useCheckoutItem()
  const returnMut = useReturnItem()

  // Sorted items
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'quantity') return b.quantity - a.quantity
    if (sortBy === 'value') return b.total_value - a.total_value
    if (sortBy === 'last_checked') return (b.last_checked ?? '').localeCompare(a.last_checked ?? '')
    return 0
  })

  const handleSaveItem = (data: Record<string, unknown>) => {
    if (editingItem) {
      updateMut.mutate(
        { id: editingItem.id, data },
        {
          onSuccess: () => {
            toast({ type: 'success', message: 'Item updated' })
            setShowItemModal(false)
            setEditingItem(null)
          },
          onError: () => toast({ type: 'error', message: 'Failed to update item' }),
        }
      )
    } else {
      createMut.mutate(data as unknown as Parameters<typeof createMut.mutate>[0], {
        onSuccess: () => {
          toast({ type: 'success', message: 'Item created' })
          setShowItemModal(false)
        },
        onError: () => toast({ type: 'error', message: 'Failed to create item' }),
      })
    }
  }

  const handleDelete = (item: InventoryItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    deleteMut.mutate(item.id, {
      onSuccess: () => toast({ type: 'success', message: 'Item deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete item' }),
    })
  }

  const handleCheckout = (data: { quantity: number; checked_out_by: string; checked_out_to: string; expected_return?: string }) => {
    if (!checkoutItem) return
    checkoutMut.mutate(
      { itemId: checkoutItem.id, data },
      {
        onSuccess: () => {
          toast({ type: 'success', message: `Checked out ${data.quantity} x ${checkoutItem.name}` })
          setCheckoutItem(null)
        },
        onError: () => toast({ type: 'error', message: 'Checkout failed' }),
      }
    )
  }

  const handleReturn = (co: CheckoutRecord) => {
    returnMut.mutate(co.id, {
      onSuccess: () => toast({ type: 'success', message: `${co.item_name} returned` }),
      onError: () => toast({ type: 'error', message: 'Return failed' }),
    })
  }

  const isLoading = activeTab === 'items' ? itemsLoading : activeTab === 'low-stock' ? lowStockLoading : checkoutsLoading

  // Format currency
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Inventory</h1>
          {stats && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {stats.total_items} items
            </span>
          )}
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowItemModal(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Boxes className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_items}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats.low_stock_count}</p>
                  {stats.low_stock_count > 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      Alert
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Checked Out</p>
                <p className="text-2xl font-bold text-gray-900">{stats.checked_out_count}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(stats.total_value)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex gap-6">
          {([
            { key: 'items' as Tab, label: 'All Items', icon: Package },
            { key: 'low-stock' as Tab, label: 'Low Stock', icon: AlertCircle, badge: stats?.low_stock_count },
            { key: 'checkouts' as Tab, label: 'Checkouts', icon: ArrowRightLeft, badge: stats?.checked_out_count },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                  tab.key === 'low-stock' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* All Items Tab */}
      {activeTab === 'items' && !isLoading && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search items..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="name">Sort: Name</option>
              <option value="quantity">Sort: Quantity</option>
              <option value="value">Sort: Value</option>
              <option value="last_checked">Sort: Last Checked</option>
            </select>
          </div>

          {/* Items Table */}
          {sortedItems.length === 0 ? (
            <div className="rounded-xl border bg-white py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No inventory items found</p>
              <button
                onClick={() => { setEditingItem(null); setShowItemModal(true) }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" /> Add First Item
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                      <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Quantity</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Location</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Condition</th>
                      <th className="px-4 py-3 font-medium text-gray-600 text-right">Value</th>
                      <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedItems.map((item) => {
                      const cat = getCategoryMeta(item.category)
                      const isLow = item.quantity <= item.min_quantity
                      const pct = item.min_quantity > 0 ? Math.min((item.quantity / item.min_quantity) * 100, 100) : 100
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', cat.color)}>
                              {cat.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{item.sku || '\u2014'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={cn('font-medium', isLow ? 'text-red-600' : 'text-gray-900')}>
                                {item.quantity}
                              </span>
                              <span className="text-gray-400">/ {item.min_quantity}</span>
                            </div>
                            {item.min_quantity > 0 && (
                              <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-100">
                                <div
                                  className={cn('h-full rounded-full transition-all', isLow ? 'bg-red-500' : 'bg-emerald-500')}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {item.location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {item.location}
                              </span>
                            ) : '\u2014'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize', CONDITION_BADGES[item.condition] ?? '')}>
                              {item.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(item.total_value)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditingItem(item); setShowItemModal(true) }}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setCheckoutItem(item)}
                                disabled={item.quantity === 0}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30"
                                title="Checkout"
                              >
                                <ArrowUpFromLine className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Low Stock Tab */}
      {activeTab === 'low-stock' && !isLoading && (
        <>
          {lowStockItems.length === 0 ? (
            <div className="rounded-xl border bg-white py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">All items are above their minimum quantity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => {
                const cat = getCategoryMeta(item.category)
                const deficit = item.min_quantity - item.quantity
                const severity = deficit >= item.min_quantity ? 'red' : 'amber'
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        severity === 'red' ? 'bg-red-50' : 'bg-amber-50'
                      )}>
                        <AlertCircle className={cn('h-5 w-5', severity === 'red' ? 'text-red-600' : 'text-amber-600')} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', cat.color)}>
                            {cat.label}
                          </span>
                          {item.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={cn('text-lg font-bold', severity === 'red' ? 'text-red-600' : 'text-amber-600')}>
                          {item.quantity} / {item.min_quantity}
                        </p>
                        <p className="text-xs text-gray-500">Need {deficit} more</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingItem(item)
                          setShowItemModal(true)
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Checkouts Tab */}
      {activeTab === 'checkouts' && !isLoading && (
        <>
          {checkouts.length === 0 ? (
            <div className="rounded-xl border bg-white py-12 text-center">
              <ArrowRightLeft className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No checkout records</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">Item</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Checked Out By</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Checked Out To</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Qty</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Checkout Date</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Expected Return</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {checkouts.map((co) => (
                      <tr
                        key={co.id}
                        className={cn('transition-colors', co.status === 'overdue' ? 'bg-red-50/50' : 'hover:bg-gray-50/50')}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{co.item_name}</td>
                        <td className="px-4 py-3 text-gray-600">{co.checked_out_by}</td>
                        <td className="px-4 py-3 text-gray-600">{co.checked_out_to}</td>
                        <td className="px-4 py-3 text-gray-900">{co.quantity_out}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(co.checkout_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {co.expected_return ? new Date(co.expected_return).toLocaleDateString() : '\u2014'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize',
                            STATUS_BADGES[co.status] ?? ''
                          )}>
                            {co.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {co.status !== 'returned' && (
                            <button
                              onClick={() => handleReturn(co)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" /> Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showItemModal && (
        <ItemFormModal
          item={editingItem}
          onClose={() => { setShowItemModal(false); setEditingItem(null) }}
          onSave={handleSaveItem}
          isSaving={createMut.isPending || updateMut.isPending}
        />
      )}
      {checkoutItem && (
        <CheckoutModal
          item={checkoutItem}
          onClose={() => setCheckoutItem(null)}
          onCheckout={handleCheckout}
          isSaving={checkoutMut.isPending}
        />
      )}
    </div>
  )
}

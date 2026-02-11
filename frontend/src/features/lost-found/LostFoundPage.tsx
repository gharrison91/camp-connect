/**
 * Camp Connect - Lost & Found Page
 * Track found items, manage claims, filter by category/status.
 */

import { useState, useMemo } from "react"
import {
  Package,
  Plus,
  Search,
  X,
  Loader2,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Archive,
  Shirt,
  Smartphone,
  Dumbbell,
  Briefcase,
  HelpCircle,
  ImageOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"
import {
  useLostFoundItems,
  useLostFoundStats,
  useCreateLostItem,
  useUpdateLostItem,
  useDeleteLostItem,
  useClaimLostItem,
  useUnclaimLostItem,
} from "@/hooks/useLostFound"
import type { LostItemData } from "@/hooks/useLostFound"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "clothing", label: "Clothing" },
  { value: "electronics", label: "Electronics" },
  { value: "sports", label: "Sports" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
] as const

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "unclaimed", label: "Unclaimed" },
  { value: "claimed", label: "Claimed" },
  { value: "disposed", label: "Disposed" },
] as const

const categoryMeta: Record<string, { icon: typeof Package; bg: string; text: string; label: string }> = {
  clothing:    { icon: Shirt,      bg: "bg-blue-50",   text: "text-blue-700",   label: "Clothing" },
  electronics: { icon: Smartphone,  bg: "bg-purple-50", text: "text-purple-700", label: "Electronics" },
  sports:      { icon: Dumbbell,    bg: "bg-orange-50", text: "text-orange-700", label: "Sports" },
  personal:    { icon: Briefcase,   bg: "bg-teal-50",   text: "text-teal-700",   label: "Personal" },
  other:       { icon: HelpCircle,  bg: "bg-gray-50",   text: "text-gray-700",   label: "Other" },
}

const statusMeta: Record<string, { bg: string; text: string; label: string }> = {
  unclaimed: { bg: "bg-amber-50",   text: "text-amber-700",   label: "Unclaimed" },
  claimed:   { bg: "bg-emerald-50", text: "text-emerald-700", label: "Claimed" },
  disposed:  { bg: "bg-red-50",     text: "text-red-700",     label: "Disposed" },
}

function fmtDate(d: string | null) {
  if (!d) return "N/A"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Package; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  )
}

export function LostFoundPage() {
  const { toast } = useToast()

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<LostItemData | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimItemId, setClaimItemId] = useState<string | null>(null)
  const [claimName, setClaimName] = useState("")

  // Form state
  const [form, setForm] = useState({
    item_name: "",
    description: "",
    category: "other" as LostItemData["category"],
    location_found: "",
    found_date: "",
    found_by: "",
    photo_url: "",
    status: "unclaimed" as LostItemData["status"],
  })

  // Data
  const apiFilters = useMemo(() => ({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
  }), [categoryFilter, statusFilter, search])

  const { data: items = [], isLoading } = useLostFoundItems(apiFilters)
  const { data: stats } = useLostFoundStats()

  // Mutations
  const createItem = useCreateLostItem()
  const updateItem = useUpdateLostItem()
  const deleteItem = useDeleteLostItem()
  const claimItem = useClaimLostItem()
  const unclaimItem = useUnclaimLostItem()

  function openCreate() {
    setEditing(null)
    setForm({ item_name: "", description: "", category: "other", location_found: "", found_date: "", found_by: "", photo_url: "", status: "unclaimed" })
    setShowModal(true)
  }

  function openEdit(item: LostItemData) {
    setEditing(item)
    setForm({
      item_name: item.item_name,
      description: item.description || "",
      category: item.category,
      location_found: item.location_found || "",
      found_date: item.found_date || "",
      found_by: item.found_by || "",
      photo_url: item.photo_url || "",
      status: item.status,
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.item_name.trim()) {
      toast({ type: "error", message: "Item name is required" })
      return
    }
    try {
      const payload = {
        ...form,
        description: form.description || null,
        location_found: form.location_found || null,
        found_date: form.found_date || null,
        found_by: form.found_by || null,
        photo_url: form.photo_url || null,
      }
      if (editing) {
        await updateItem.mutateAsync({ id: editing.id, data: payload })
        toast({ type: "success", message: "Item updated" })
      } else {
        await createItem.mutateAsync(payload)
        toast({ type: "success", message: "Item reported" })
      }
      setShowModal(false)
    } catch {
      toast({ type: "error", message: "Failed to save item" })
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItem.mutateAsync(id)
      toast({ type: "success", message: "Item deleted" })
    } catch {
      toast({ type: "error", message: "Failed to delete item" })
    }
  }

  async function handleClaim() {
    if (!claimItemId || !claimName.trim()) return
    try {
      await claimItem.mutateAsync({ id: claimItemId, claimed_by: claimName })
      toast({ type: "success", message: "Item marked as claimed" })
      setShowClaimModal(false)
      setClaimName("")
      setClaimItemId(null)
    } catch {
      toast({ type: "error", message: "Failed to claim item" })
    }
  }

  async function handleUnclaim(id: string) {
    try {
      await unclaimItem.mutateAsync(id)
      toast({ type: "success", message: "Item returned to unclaimed" })
    } catch {
      toast({ type: "error", message: "Failed to unclaim item" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
          <p className="mt-1 text-sm text-gray-500">Track found items, manage claims, and keep camp organized.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Report Found Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Items" value={stats?.total_items ?? 0} icon={Package} color="bg-gray-600" />
        <StatCard label="Unclaimed" value={stats?.unclaimed ?? 0} icon={Clock} color="bg-amber-500" />
        <StatCard label="Claimed" value={stats?.claimed ?? 0} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label="Disposed" value={stats?.disposed ?? 0} icon={Archive} color="bg-red-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <Package className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No items found</p>
          <p className="mt-1 text-xs text-gray-400">Report a found item to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const cat = categoryMeta[item.category] || categoryMeta.other
            const st = statusMeta[item.status] || statusMeta.unclaimed
            const CatIcon = cat.icon
            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Photo or placeholder */}
                <div className="relative h-40 w-full bg-gray-100">
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={item.item_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <ImageOff className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                  {/* Category badge */}
                  <span className={cn("absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", cat.bg, cat.text)}>
                    <CatIcon className="h-3 w-3" />
                    {cat.label}
                  </span>
                  {/* Status badge */}
                  <span className={cn("absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold", st.bg, st.text)}>
                    {st.label}
                  </span>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.item_name}</h3>
                  {item.description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    {item.location_found && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{item.location_found}</span>
                      </div>
                    )}
                    {item.found_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>{fmtDate(item.found_date)}</span>
                      </div>
                    )}
                    {item.found_by && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Found by {item.found_by}</span>
                      </div>
                    )}
                    {item.claimed_by && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-500" />
                        <span className="truncate">Claimed by {item.claimed_by}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2 pt-3 border-t border-gray-100">
                    {item.status === "unclaimed" && (
                      <button
                        onClick={() => { setClaimItemId(item.id); setClaimName(""); setShowClaimModal(true) }}
                        className="flex-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        Claim
                      </button>
                    )}
                    {item.status === "claimed" && (
                      <button
                        onClick={() => handleUnclaim(item.id)}
                        className="flex-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        Unclaim
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(item)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? "Edit Item" : "Report Found Item"}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Item Name *</label>
                <input
                  type="text"
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Blue water bottle"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Describe the item..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as LostItemData["category"] })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="clothing">Clothing</option>
                    <option value="electronics">Electronics</option>
                    <option value="sports">Sports</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as LostItemData["status"] })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="unclaimed">Unclaimed</option>
                    <option value="claimed">Claimed</option>
                    <option value="disposed">Disposed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Location Found</label>
                  <input
                    type="text"
                    value={form.location_found}
                    onChange={(e) => setForm({ ...form, location_found: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Main Lodge"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Found Date</label>
                  <input
                    type="date"
                    value={form.found_date}
                    onChange={(e) => setForm({ ...form, found_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Found By</label>
                  <input
                    type="text"
                    value={form.found_by}
                    onChange={(e) => setForm({ ...form, found_by: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Staff member name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Photo URL</label>
                  <input
                    type="text"
                    value={form.photo_url}
                    onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={createItem.isPending || updateItem.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {(createItem.isPending || updateItem.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Report Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Claim Item</h2>
              <button onClick={() => setShowClaimModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Claimed By *</label>
              <input
                type="text"
                value={claimName}
                onChange={(e) => setClaimName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Name of person claiming"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowClaimModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClaim}
                disabled={!claimName.trim() || claimItem.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {claimItem.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

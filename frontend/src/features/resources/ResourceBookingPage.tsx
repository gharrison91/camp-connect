/**
 * Camp Connect – Resource Booking
 * Reserve facilities, equipment, and vehicles.
 */

import { useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  MapPin,
  Trash2,
  Edit3,
  X,
  BarChart3,
  Wrench,
  Car,
  Box,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useResources,
  useResourceStats,
  useBookings,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useCreateBooking,
  useDeleteBooking,
} from '@/hooks/useResourceBooking'
import type { ResourceData } from '@/hooks/useResourceBooking'

const TYPE_ICONS: Record<string, typeof Building2> = {
  facility: Building2,
  equipment: Wrench,
  vehicle: Car,
  other: Box,
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  facility: { bg: 'bg-blue-50', text: 'text-blue-700' },
  equipment: { bg: 'bg-amber-50', text: 'text-amber-700' },
  vehicle: { bg: 'bg-purple-50', text: 'text-purple-700' },
  other: { bg: 'bg-gray-50', text: 'text-gray-600' },
}

const BOOKING_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700' },
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function ResourceBookingPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [tab, setTab] = useState<'resources' | 'bookings'>('resources')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('')
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceData | null>(null)
  const [resForm, setResForm] = useState({ name: '', resource_type: 'facility', description: '', location: '', capacity: '' })
  const [bookForm, setBookForm] = useState({ resource_id: '', title: '', start_time: '', end_time: '', notes: '' })

  const { data: resources = [], isLoading: loadingRes } = useResources({
    search: search || undefined,
    resource_type: typeFilter || undefined,
  })
  const { data: stats } = useResourceStats()
  const { data: bookings = [], isLoading: loadingBook } = useBookings({
    status: bookingStatusFilter || undefined,
  })

  const createResource = useCreateResource()
  const updateResource = useUpdateResource()
  const deleteResource = useDeleteResource()
  const createBooking = useCreateBooking()
  const deleteBooking = useDeleteBooking()

  function openCreateResource() {
    setEditingResource(null)
    setResForm({ name: '', resource_type: 'facility', description: '', location: '', capacity: '' })
    setShowResourceModal(true)
  }

  function openEditResource(r: ResourceData) {
    setEditingResource(r)
    setResForm({
      name: r.name,
      resource_type: r.resource_type,
      description: r.description || '',
      location: r.location || '',
      capacity: r.capacity != null ? String(r.capacity) : '',
    })
    setShowResourceModal(true)
  }

  function handleSaveResource() {
    const payload = {
      name: resForm.name,
      resource_type: resForm.resource_type,
      description: resForm.description || undefined,
      location: resForm.location || undefined,
      capacity: resForm.capacity ? parseInt(resForm.capacity) : null,
    }
    if (editingResource) {
      updateResource.mutate({ id: editingResource.id, data: payload }, {
        onSuccess: () => { toast({ type: 'success', message: 'Resource updated' }); setShowResourceModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to update' }),
      })
    } else {
      createResource.mutate(payload, {
        onSuccess: () => { toast({ type: 'success', message: 'Resource created' }); setShowResourceModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to create' }),
      })
    }
  }

  function handleDeleteResource(id: string) {
    if (!confirm('Delete this resource?')) return
    deleteResource.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Resource deleted' }),
      onError: () => toast({ type: 'error', message: 'Failed to delete' }),
    })
  }

  function openBookResource(resourceId: string) {
    setBookForm({ resource_id: resourceId, title: '', start_time: '', end_time: '', notes: '' })
    setShowBookingModal(true)
  }

  function handleCreateBooking() {
    createBooking.mutate({
      resource_id: bookForm.resource_id,
      title: bookForm.title,
      start_time: bookForm.start_time,
      end_time: bookForm.end_time,
      notes: bookForm.notes || undefined,
    }, {
      onSuccess: () => { toast({ type: 'success', message: 'Booking created' }); setShowBookingModal(false) },
      onError: () => toast({ type: 'error', message: 'Failed to book — may conflict with existing reservation' }),
    })
  }

  function handleDeleteBooking(id: string) {
    if (!confirm('Cancel this booking?')) return
    deleteBooking.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Booking cancelled' }),
      onError: () => toast({ type: 'error', message: 'Failed to cancel' }),
    })
  }

  const isLoading = tab === 'resources' ? loadingRes : loadingBook

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resource Booking</h1>
            <p className="text-sm text-gray-500">Reserve facilities, equipment, and vehicles</p>
          </div>
        </div>
        <button onClick={openCreateResource} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Resource
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Resources', value: stats.total_resources, icon: Building2, color: 'text-gray-600', bg: 'bg-gray-100' },
            { label: 'Total Bookings', value: stats.total_bookings, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Upcoming', value: stats.upcoming_bookings, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Utilization', value: `${stats.utilization_rate}%`, icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-100' },
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

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        {(['resources', 'bookings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'resources' ? 'Resources' : 'Bookings'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {tab === 'resources' && (
          <>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500">
              <option value="">All Types</option>
              <option value="facility">Facility</option>
              <option value="equipment">Equipment</option>
              <option value="vehicle">Vehicle</option>
              <option value="other">Other</option>
            </select>
          </>
        )}
        {tab === 'bookings' && (
          <select value={bookingStatusFilter} onChange={e => setBookingStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>
      ) : tab === 'resources' ? (
        /* Resources grid */
        resources.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-gray-200 bg-white">
            <Building2 className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-lg font-medium text-gray-900">No resources</h3>
            <p className="mt-1 text-sm text-gray-500">Add facilities, equipment, or vehicles to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map(r => {
              const TypeIcon = TYPE_ICONS[r.resource_type] || Box
              const tc = TYPE_COLORS[r.resource_type] || TYPE_COLORS.other
              return (
                <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tc.bg}`}>
                        <TypeIcon className={`h-5 w-5 ${tc.text}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{r.name}</h3>
                        <span className={`text-[11px] font-medium ${tc.text}`}>{r.resource_type}</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {r.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  {r.description && <p className="mt-2 text-xs text-gray-500 line-clamp-2">{r.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {r.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.location}</span>}
                    {r.capacity != null && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Capacity {r.capacity}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {r.booking_count} bookings</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button onClick={() => openBookResource(r.id)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">Book</button>
                    <button onClick={() => openEditResource(r)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteResource(r.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Bookings table */
        bookings.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-gray-200 bg-white">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-lg font-medium text-gray-900">No bookings</h3>
            <p className="mt-1 text-sm text-gray-500">Book a resource to see reservations here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Resource</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Booked By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Start</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">End</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map(b => {
                    const bs = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending
                    return (
                      <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{b.title}</td>
                        <td className="px-4 py-3 text-gray-600">{b.resource_name}</td>
                        <td className="px-4 py-3 text-gray-600">{b.booked_by_name}</td>
                        <td className="px-4 py-3 text-gray-500">{fmtDateTime(b.start_time)}</td>
                        <td className="px-4 py-3 text-gray-500">{fmtDateTime(b.end_time)}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${bs.bg} ${bs.text}`}>{bs.label}</span></td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteBooking(b.id)} className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Resource Create/Edit Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editingResource ? 'Edit Resource' : 'New Resource'}</h3>
              <button onClick={() => setShowResourceModal(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={resForm.name} onChange={e => setResForm({...resForm, name: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={resForm.resource_type} onChange={e => setResForm({...resForm, resource_type: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500">
                    <option value="facility">Facility</option><option value="equipment">Equipment</option><option value="vehicle">Vehicle</option><option value="other">Other</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label><input type="number" value={resForm.capacity} onChange={e => setResForm({...resForm, capacity: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input value={resForm.location} onChange={e => setResForm({...resForm, location: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={resForm.description} onChange={e => setResForm({...resForm, description: e.target.value})} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowResourceModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveResource} disabled={!resForm.name || createResource.isPending || updateResource.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {createResource.isPending || updateResource.isPending ? 'Saving...' : editingResource ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Book Resource</h3>
              <button onClick={() => setShowBookingModal(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} placeholder="e.g. Morning swim class" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start *</label><input type="datetime-local" value={bookForm.start_time} onChange={e => setBookForm({...bookForm, start_time: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End *</label><input type="datetime-local" value={bookForm.end_time} onChange={e => setBookForm({...bookForm, end_time: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={bookForm.notes} onChange={e => setBookForm({...bookForm, notes: e.target.value})} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowBookingModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateBooking} disabled={!bookForm.title || !bookForm.start_time || !bookForm.end_time || createBooking.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {createBooking.isPending ? 'Booking...' : 'Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

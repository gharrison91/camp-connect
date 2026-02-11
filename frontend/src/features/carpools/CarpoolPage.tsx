/**
 * Camp Connect - Carpool Coordination Page
 * Manage carpools, drivers, riders, and seat availability.
 */

import { useState, useMemo } from 'react'
import {
  Car,
  Plus,
  Users,
  MapPin,
  Clock,
  Phone,
  Mail,
  Trash2,
  X,
  Pencil,
  UserPlus,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useCarpools,
  useCarpoolStats,
  useCreateCarpool,
  useUpdateCarpool,
  useDeleteCarpool,
  useAddRider,
  useUpdateRider,
  useRemoveRider,
} from '@/hooks/useCarpools'
import type { CarpoolData, CarpoolRider } from '@/hooks/useCarpools'

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

export function CarpoolPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCarpoolModal, setShowCarpoolModal] = useState(false)
  const [editingCarpool, setEditingCarpool] = useState<CarpoolData | null>(null)
  const [showRiderModal, setShowRiderModal] = useState(false)
  const [riderCarpoolId, setRiderCarpoolId] = useState<string | null>(null)

  const [carpoolForm, setCarpoolForm] = useState({
    driver_name: '',
    phone: '',
    email: '',
    pickup_location: '',
    dropoff_location: 'Camp',
    departure_time: '',
    seats_available: '4',
    days: [] as string[],
    notes: '',
  })
  const [riderForm, setRiderForm] = useState({
    camper_name: '',
    parent_name: '',
  })

  const { data: carpools = [], isLoading } = useCarpools()
  const { data: stats } = useCarpoolStats()

  const createCarpool = useCreateCarpool()
  const updateCarpool = useUpdateCarpool()
  const deleteCarpool = useDeleteCarpool()
  const addRider = useAddRider()
  const updateRider = useUpdateRider()
  const removeRider = useRemoveRider()

  const filtered = useMemo(() => {
    if (!search.trim()) return carpools
    const q = search.toLowerCase()
    return carpools.filter(
      (c) =>
        c.driver_name.toLowerCase().includes(q) ||
        c.pickup_location.toLowerCase().includes(q) ||
        c.dropoff_location.toLowerCase().includes(q)
    )
  }, [carpools, search])

  function openCreateCarpool() {
    setEditingCarpool(null)
    setCarpoolForm({
      driver_name: '', phone: '', email: '', pickup_location: '',
      dropoff_location: 'Camp', departure_time: '', seats_available: '4',
      days: [], notes: '',
    })
    setShowCarpoolModal(true)
  }

  function openEditCarpool(cp: CarpoolData) {
    setEditingCarpool(cp)
    setCarpoolForm({
      driver_name: cp.driver_name, phone: cp.phone || '', email: cp.email || '',
      pickup_location: cp.pickup_location, dropoff_location: cp.dropoff_location,
      departure_time: cp.departure_time, seats_available: String(cp.seats_available),
      days: cp.days || [], notes: cp.notes || '',
    })
    setShowCarpoolModal(true)
  }

  function handleSaveCarpool() {
    const payload = {
      driver_name: carpoolForm.driver_name,
      phone: carpoolForm.phone || null,
      email: carpoolForm.email || null,
      pickup_location: carpoolForm.pickup_location,
      dropoff_location: carpoolForm.dropoff_location || 'Camp',
      departure_time: carpoolForm.departure_time,
      seats_available: parseInt(carpoolForm.seats_available) || 4,
      days: carpoolForm.days,
      notes: carpoolForm.notes || null,
    }
    if (editingCarpool) {
      updateCarpool.mutate({ id: editingCarpool.id, data: payload }, {
        onSuccess: () => { toast({ type: 'success', message: 'Carpool updated' }); setShowCarpoolModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to update carpool' }),
      })
    } else {
      createCarpool.mutate(payload, {
        onSuccess: () => { toast({ type: 'success', message: 'Carpool created' }); setShowCarpoolModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to create carpool' }),
      })
    }
  }

  function handleDeleteCarpool(id: string) {
    if (!confirm('Remove this carpool? All riders will be removed.')) return
    deleteCarpool.mutate(id, {
      onSuccess: () => toast({ type: 'success', message: 'Carpool removed' }),
      onError: () => toast({ type: 'error', message: 'Failed to remove carpool' }),
    })
  }

  function openAddRider(carpoolId: string) {
    setRiderCarpoolId(carpoolId)
    setRiderForm({ camper_name: '', parent_name: '' })
    setShowRiderModal(true)
  }

  function handleAddRider() {
    if (!riderCarpoolId) return
    addRider.mutate(
      { carpoolId: riderCarpoolId, data: { camper_name: riderForm.camper_name, parent_name: riderForm.parent_name, status: 'pending' } },
      {
        onSuccess: () => { toast({ type: 'success', message: 'Rider added' }); setShowRiderModal(false) },
        onError: () => toast({ type: 'error', message: 'Failed to add rider. Carpool may be full.' }),
      }
    )
  }

  function handleConfirmRider(rider: CarpoolRider) {
    const newStatus = rider.status === 'confirmed' ? 'pending' : 'confirmed'
    updateRider.mutate(
      { id: rider.id, data: { status: newStatus } },
      {
        onSuccess: () => toast({ type: 'success', message: newStatus === 'confirmed' ? 'Rider confirmed' : 'Rider set to pending' }),
        onError: () => toast({ type: 'error', message: 'Failed to update rider' }),
      }
    )
  }

  function handleRemoveRider(riderId: string) {
    if (!confirm('Remove this rider from the carpool?')) return
    removeRider.mutate(riderId, {
      onSuccess: () => toast({ type: 'success', message: 'Rider removed' }),
      onError: () => toast({ type: 'error', message: 'Failed to remove rider' }),
    })
  }

  function toggleDay(day: string) {
    setCarpoolForm((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }))
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carpool Coordination</h1>
          <p className="mt-1 text-sm text-gray-500">Manage ride shares, drivers, and rider assignments</p>
        </div>
        <button onClick={openCreateCarpool} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors">
          <Plus className="h-4 w-4" />
          New Carpool
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total Carpools', value: stats.total, icon: Car, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Total Riders', value: stats.total_riders, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
            { label: 'Avg Occupancy', value: `${stats.avg_occupancy}%`, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-100' },
          ].map((s) => (
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by driver or location..." className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500" />
      </div>

      {/* Carpool List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-gray-200 bg-white">
          <Car className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-lg font-medium text-gray-900">{search ? 'No carpools match your search' : 'No carpools yet'}</h3>
          <p className="mt-1 text-sm text-gray-500">{search ? 'Try a different search term.' : 'Create a carpool to start coordinating rides.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((cp) => {
            const isExpanded = expandedId === cp.id
            const seatsOpen = cp.seats_available - cp.rider_count
            const occupancyPct = cp.seats_available > 0 ? Math.round((cp.rider_count / cp.seats_available) * 100) : 0
            return (
              <div key={cp.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Car className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{cp.driver_name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          {cp.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{cp.phone}</span>}
                          {cp.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{cp.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openAddRider(cp.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Add rider"><UserPlus className="h-4 w-4" /></button>
                      <button onClick={() => openEditCarpool(cp)} className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteCarpool(cp.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-gray-400 shrink-0" /><span className="text-gray-700 truncate">{cp.pickup_location} &rarr; {cp.dropoff_location}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-gray-400 shrink-0" /><span className="text-gray-700">{cp.departure_time}</span></div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-gray-700">{cp.rider_count}/{cp.seats_available} seats</span>
                      {seatsOpen > 0 ? <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{seatsOpen} open</span> : <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Full</span>}
                    </div>
                  </div>
                  <div className="mt-3"><div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full transition-all ${occupancyPct >= 100 ? 'bg-red-500' : occupancyPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(occupancyPct, 100)}%` }} /></div></div>
                  {cp.days && cp.days.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{cp.days.map((day) => <span key={day} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{day.slice(0, 3)}</span>)}</div>}
                  {cp.notes && <p className="mt-2 text-sm text-gray-500 italic">{cp.notes}</p>}
                  {cp.rider_count > 0 && (
                    <button onClick={() => setExpandedId(isExpanded ? null : cp.id)} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                      {isExpanded ? <><ChevronUp className="h-4 w-4" /> Hide riders</> : <><ChevronDown className="h-4 w-4" /> Show {cp.rider_count} rider{cp.rider_count !== 1 ? 's' : ''}</>}
                    </button>
                  )}
                </div>
                {isExpanded && cp.riders && cp.riders.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-100"><th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Camper</th><th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Parent/Guardian</th><th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Status</th><th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500">Actions</th></tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {cp.riders.map((rider) => {
                            const st = STATUS_STYLES[rider.status] || STATUS_STYLES.pending
                            return (
                              <tr key={rider.id} className="hover:bg-white/60 transition-colors">
                                <td className="px-5 py-2.5 font-medium text-gray-900">{rider.camper_name}</td>
                                <td className="px-5 py-2.5 text-gray-600">{rider.parent_name}</td>
                                <td className="px-5 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>{st.label}</span></td>
                                <td className="px-5 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleConfirmRider(rider)} className="rounded-md p-1 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600" title={rider.status === 'confirmed' ? 'Set pending' : 'Confirm'}><CheckCircle2 className="h-4 w-4" /></button>
                                    <button onClick={() => handleRemoveRider(rider.id)} className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Remove"><Trash2 className="h-4 w-4" /></button>
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
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Carpool Modal */}
      {showCarpoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{editingCarpool ? 'Edit Carpool' : 'New Carpool'}</h3>
              <button onClick={() => setShowCarpoolModal(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                <input value={carpoolForm.driver_name} onChange={(e) => setCarpoolForm({ ...carpoolForm, driver_name: e.target.value })} placeholder="Full name of the driver" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={carpoolForm.phone} onChange={(e) => setCarpoolForm({ ...carpoolForm, phone: e.target.value })} placeholder="(555) 123-4567" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={carpoolForm.email} onChange={(e) => setCarpoolForm({ ...carpoolForm, email: e.target.value })} placeholder="driver@example.com" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location *</label>
                  <input value={carpoolForm.pickup_location} onChange={(e) => setCarpoolForm({ ...carpoolForm, pickup_location: e.target.value })} placeholder="e.g. Main St & Oak Ave" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drop-off Location</label>
                  <input value={carpoolForm.dropoff_location} onChange={(e) => setCarpoolForm({ ...carpoolForm, dropoff_location: e.target.value })} placeholder="Camp" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time *</label>
                  <input value={carpoolForm.departure_time} onChange={(e) => setCarpoolForm({ ...carpoolForm, departure_time: e.target.value })} placeholder="e.g. 7:30 AM" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seats Available *</label>
                  <input type="number" min="1" max="20" value={carpoolForm.seats_available} onChange={(e) => setCarpoolForm({ ...carpoolForm, seats_available: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const selected = carpoolForm.days.includes(day)
                    return (
                      <button key={day} type="button" onClick={() => toggleDay(day)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {day.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={carpoolForm.notes} onChange={(e) => setCarpoolForm({ ...carpoolForm, notes: e.target.value })} rows={2} placeholder="Any additional info for riders..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCarpoolModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveCarpool} disabled={!carpoolForm.driver_name || !carpoolForm.pickup_location || !carpoolForm.departure_time || createCarpool.isPending || updateCarpool.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {createCarpool.isPending || updateCarpool.isPending ? 'Saving...' : editingCarpool ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rider Modal */}
      {showRiderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Rider</h3>
              <button onClick={() => setShowRiderModal(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Camper Name *</label>
                <input value={riderForm.camper_name} onChange={(e) => setRiderForm({ ...riderForm, camper_name: e.target.value })} placeholder="Camper's full name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name *</label>
                <input value={riderForm.parent_name} onChange={(e) => setRiderForm({ ...riderForm, parent_name: e.target.value })} placeholder="Parent or guardian name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowRiderModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddRider} disabled={!riderForm.camper_name || !riderForm.parent_name || addRider.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {addRider.isPending ? 'Adding...' : 'Add Rider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

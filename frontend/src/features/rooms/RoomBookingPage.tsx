/**
 * Camp Connect – Room / Space Booking
 * Manage rooms and schedule bookings with calendar view.
 */

import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Building2,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  BarChart3,
  DoorOpen,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
  useRoomBookings,
  useCreateRoomBooking,
  useUpdateRoomBooking,
  useDeleteRoomBooking,
  useRoomBookingStats,
  type RoomData,
  type RoomBookingData,
  type RoomCreate,
  type BookingCreate,
} from '@/hooks/useRoomBooking'

// ─── helpers ────────────────────────────────────────────────────────────────
const ROOM_TYPES = [
  { value: 'classroom', label: 'Classroom' },
  { value: 'gym', label: 'Gym' },
  { value: 'auditorium', label: 'Auditorium' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'meeting_room', label: 'Meeting Room' },
  { value: 'arts_room', label: 'Arts Room' },
  { value: 'other', label: 'Other' },
] as const

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
] as const

function statusBadge(status: string) {
  const s = STATUS_OPTIONS.find((o) => o.value === status)
  if (!s) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
      {status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'pending' && <AlertCircle className="h-3 w-3" />}
      {status === 'cancelled' && <XCircle className="h-3 w-3" />}
      {s.label}
    </span>
  )
}

function roomTypeBadge(t: string) {
  const label = ROOM_TYPES.find((r) => r.value === t)?.label ?? t
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      <Building2 className="h-3 w-3" />
      {label}
    </span>
  )
}

function fmtDT(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ─── empty room form ────────────────────────────────────────────────────────
const emptyRoomForm: RoomCreate & { id?: string } = {
  name: '',
  type: 'classroom',
  capacity: 0,
  amenities: [],
  is_active: true,
}

// ─── empty booking form ─────────────────────────────────────────────────────
const emptyBookingForm: BookingCreate & { id?: string } = {
  room_id: '',
  booked_by: '',
  purpose: '',
  start_time: '',
  end_time: '',
  recurring: false,
  recurrence_pattern: null,
  status: 'confirmed',
  notes: null,
}

// ═══════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════

export function RoomBookingPage() {
  const { toast } = useToast()

  // ── tabs ────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'rooms' | 'bookings'>('rooms')

  // ── filters ─────────────────────────────────────────────────────────────
  const [roomSearch, setRoomSearch] = useState('')
  const [roomTypeFilter, setRoomTypeFilter] = useState('')
  const [bookingRoomFilter, setBookingRoomFilter] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('')

  // ── modals ──────────────────────────────────────────────────────────────
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [roomForm, setRoomForm] = useState<RoomCreate & { id?: string }>({ ...emptyRoomForm })
  const [bookingForm, setBookingForm] = useState<BookingCreate & { id?: string }>({ ...emptyBookingForm })
  const [amenityInput, setAmenityInput] = useState('')

  // ── queries ─────────────────────────────────────────────────────────────
  const { data: rooms = [], isLoading: loadingRooms } = useRooms({
    search: roomSearch || undefined,
    room_type: roomTypeFilter || undefined,
  })
  const { data: bookings = [], isLoading: loadingBookings } = useRoomBookings({
    room_id: bookingRoomFilter || undefined,
    status: bookingStatusFilter || undefined,
  })
  const { data: stats } = useRoomBookingStats()

  // ── mutations ───────────────────────────────────────────────────────────
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const deleteRoom = useDeleteRoom()
  const createBooking = useCreateRoomBooking()
  const updateBooking = useUpdateRoomBooking()
  const deleteBooking = useDeleteRoomBooking()

  // ── room CRUD ───────────────────────────────────────────────────────────
  function openCreateRoom() {
    setRoomForm({ ...emptyRoomForm })
    setAmenityInput('')
    setShowRoomModal(true)
  }

  function openEditRoom(r: RoomData) {
    setRoomForm({
      id: r.id,
      name: r.name,
      type: r.type,
      capacity: r.capacity,
      amenities: r.amenities ?? [],
      is_active: r.is_active,
    })
    setAmenityInput('')
    setShowRoomModal(true)
  }

  async function saveRoom() {
    try {
      const payload: RoomCreate = {
        name: roomForm.name,
        type: roomForm.type,
        capacity: roomForm.capacity,
        amenities: roomForm.amenities?.length ? roomForm.amenities : null,
        is_active: roomForm.is_active,
      }
      if (roomForm.id) {
        await updateRoom.mutateAsync({ id: roomForm.id, data: payload })
        toast({ type: 'success', message: 'Room updated' })
      } else {
        await createRoom.mutateAsync(payload)
        toast({ type: 'success', message: 'Room created' })
      }
      setShowRoomModal(false)
    } catch {
      toast({ type: 'error', message: 'Failed to save room' })
    }
  }

  async function handleDeleteRoom(id: string) {
    if (!confirm('Delete this room and all associated bookings?')) return
    try {
      await deleteRoom.mutateAsync(id)
      toast({ type: 'success', message: 'Room deleted' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete room' })
    }
  }

  function addAmenity() {
    const val = amenityInput.trim()
    if (!val) return
    setRoomForm((f) => ({ ...f, amenities: [...(f.amenities ?? []), val] }))
    setAmenityInput('')
  }

  function removeAmenity(idx: number) {
    setRoomForm((f) => ({ ...f, amenities: (f.amenities ?? []).filter((_, i) => i !== idx) }))
  }

  // ── booking CRUD ────────────────────────────────────────────────────────
  function openCreateBooking() {
    setBookingForm({ ...emptyBookingForm, room_id: rooms[0]?.id ?? '' })
    setShowBookingModal(true)
  }

  function openEditBooking(b: RoomBookingData) {
    setBookingForm({
      id: b.id,
      room_id: b.room_id,
      booked_by: b.booked_by,
      purpose: b.purpose,
      start_time: b.start_time.slice(0, 16),
      end_time: b.end_time.slice(0, 16),
      recurring: b.recurring,
      recurrence_pattern: b.recurrence_pattern,
      status: b.status,
      notes: b.notes,
    })
    setShowBookingModal(true)
  }

  async function saveBooking() {
    try {
      const payload: BookingCreate = {
        room_id: bookingForm.room_id,
        booked_by: bookingForm.booked_by,
        purpose: bookingForm.purpose,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        recurring: bookingForm.recurring,
        recurrence_pattern: bookingForm.recurrence_pattern || null,
        status: bookingForm.status as RoomBookingData['status'],
        notes: bookingForm.notes || null,
      }
      if (bookingForm.id) {
        await updateBooking.mutateAsync({ id: bookingForm.id, data: payload })
        toast({ type: 'success', message: 'Booking updated' })
      } else {
        await createBooking.mutateAsync(payload)
        toast({ type: 'success', message: 'Booking created' })
      }
      setShowBookingModal(false)
    } catch {
      toast({ type: 'error', message: 'Failed to save booking' })
    }
  }

  async function handleDeleteBooking(id: string) {
    if (!confirm('Delete this booking?')) return
    try {
      await deleteBooking.mutateAsync(id)
      toast({ type: 'success', message: 'Booking deleted' })
    } catch {
      toast({ type: 'error', message: 'Failed to delete booking' })
    }
  }

  // ── active rooms for booking select ─────────────────────────────────────
  const activeRooms = useMemo(() => rooms.filter((r) => r.is_active), [rooms])

  // ═════════════════════════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Room Booking</h1>
          <p className="text-sm text-slate-500">Manage rooms &amp; schedule bookings</p>
        </div>
        <button
          onClick={tab === 'rooms' ? openCreateRoom : openCreateBooking}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          {tab === 'rooms' ? 'Add Room' : 'New Booking'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Rooms', value: stats.total_rooms, icon: DoorOpen, color: 'text-blue-600 bg-blue-50' },
            { label: 'Total Bookings', value: stats.total_bookings, icon: Calendar, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Most Booked', value: stats.most_booked_room ?? '—', icon: BarChart3, color: 'text-violet-600 bg-violet-50' },
            { label: 'Utilization', value: `${Math.round(stats.utilization_rate)}%`, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {(['rooms', 'bookings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'rooms' ? 'Rooms' : 'Bookings'}
          </button>
        ))}
      </div>

      {/* ─── ROOMS TAB ───────────────────────────────────────────────────── */}
      {tab === 'rooms' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search rooms…"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Types</option>
              {ROOM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Room cards */}
          {loadingRooms ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading rooms…</div>
          ) : rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No rooms found</p>
              <p className="text-xs text-slate-400">Add your first room to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div key={room.id} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">{room.name}</h3>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {roomTypeBadge(room.type)}
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          <Users className="h-3 w-3" /> {room.capacity}
                        </span>
                        {!room.is_active && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEditRoom(room)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteRoom(room.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {room.amenities && room.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {room.amenities.map((a, i) => (
                        <span key={i} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── BOOKINGS TAB ────────────────────────────────────────────────── */}
      {tab === 'bookings' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={bookingRoomFilter}
              onChange={(e) => setBookingRoomFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Rooms</option>
              {activeRooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Bookings table */}
          {loadingBookings ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading bookings…</div>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No bookings found</p>
              <p className="text-xs text-slate-400">Create a booking to get started</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">Booked By</th>
                      <th className="px-4 py-3">Start</th>
                      <th className="px-4 py-3">End</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                          {b.room_name ?? b.room_id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{b.purpose}</td>
                        <td className="px-4 py-3 text-slate-600">{b.booked_by}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDT(b.start_time)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDT(b.end_time)}</td>
                        <td className="px-4 py-3">{statusBadge(b.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEditBooking(b)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteBooking(b.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      {/* ─── ROOM MODAL ──────────────────────────────────────────────────── */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{roomForm.id ? 'Edit Room' : 'New Room'}</h2>
              <button onClick={() => setShowRoomModal(false)} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Main Gym"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={roomForm.type}
                    onChange={(e) => setRoomForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Capacity</label>
                  <input
                    type="number"
                    min={0}
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Amenities</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add amenity…"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button onClick={addAmenity} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Add</button>
                </div>
                {(roomForm.amenities ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {roomForm.amenities!.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {a}
                        <button onClick={() => removeAmenity(i)} className="text-emerald-500 hover:text-emerald-700">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roomForm.is_active}
                  onChange={(e) => setRoomForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Active</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowRoomModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button
                onClick={saveRoom}
                disabled={!roomForm.name || createRoom.isPending || updateRoom.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {roomForm.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BOOKING MODAL ───────────────────────────────────────────────── */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{bookingForm.id ? 'Edit Booking' : 'New Booking'}</h2>
              <button onClick={() => setShowBookingModal(false)} className="rounded-md p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Room</label>
                <select
                  value={bookingForm.room_id}
                  onChange={(e) => setBookingForm((f) => ({ ...f, room_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Select a room…</option>
                  {activeRooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.capacity} capacity)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Booked By</label>
                  <input
                    type="text"
                    value={bookingForm.booked_by}
                    onChange={(e) => setBookingForm((f) => ({ ...f, booked_by: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={bookingForm.status}
                    onChange={(e) => setBookingForm((f) => ({ ...f, status: e.target.value as RoomBookingData['status'] }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Purpose</label>
                <input
                  type="text"
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm((f) => ({ ...f, purpose: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Arts & Crafts session"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Start</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">End</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm((f) => ({ ...f, end_time: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={bookingForm.notes ?? ''}
                  onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value || null }))}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Optional notes…"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bookingForm.recurring ?? false}
                  onChange={(e) => setBookingForm((f) => ({ ...f, recurring: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Recurring</span>
              </label>

              {bookingForm.recurring && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Recurrence Pattern</label>
                  <input
                    type="text"
                    value={bookingForm.recurrence_pattern ?? ''}
                    onChange={(e) => setBookingForm((f) => ({ ...f, recurrence_pattern: e.target.value || null }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. weekly, MWF, daily"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowBookingModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button
                onClick={saveBooking}
                disabled={!bookingForm.room_id || !bookingForm.booked_by || !bookingForm.purpose || !bookingForm.start_time || !bookingForm.end_time || createBooking.isPending || updateBooking.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {bookingForm.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

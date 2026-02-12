/**
 * Camp Connect - Room Booking React Query Hooks
 * Hooks for rooms, room bookings, and stats.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomData {
  id: string
  org_id: string
  name: string
  type: 'classroom' | 'gym' | 'auditorium' | 'outdoor' | 'meeting_room' | 'arts_room' | 'other'
  capacity: number
  amenities: string[] | null
  is_active: boolean
  created_at: string
}

export interface RoomBookingData {
  id: string
  org_id: string
  room_id: string
  room_name: string | null
  booked_by: string
  purpose: string
  start_time: string
  end_time: string
  recurring: boolean
  recurrence_pattern: string | null
  status: 'confirmed' | 'pending' | 'cancelled'
  notes: string | null
  created_at: string
}

export interface RoomBookingStats {
  total_rooms: number
  total_bookings: number
  most_booked_room: string | null
  utilization_rate: number
}

// ---------------------------------------------------------------------------
// Create / Update types
// ---------------------------------------------------------------------------

export interface RoomCreate {
  name: string
  type: string
  capacity: number
  amenities?: string[] | null
  is_active?: boolean
}

export type RoomUpdate = Partial<RoomCreate>

export interface BookingCreate {
  room_id: string
  booked_by: string
  purpose: string
  start_time: string
  end_time: string
  recurring?: boolean
  recurrence_pattern?: string | null
  status?: string
  notes?: string | null
}

export type BookingUpdate = Partial<BookingCreate>

interface RoomFilters {
  search?: string
  room_type?: string
  is_active?: boolean
}

interface BookingFilters {
  room_id?: string
  status?: string
}

// ---------------------------------------------------------------------------
// Room hooks
// ---------------------------------------------------------------------------

export function useRooms(filters?: RoomFilters) {
  return useQuery<RoomData[]>({
    queryKey: ['rooms', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.search) params.search = filters.search
      if (filters?.room_type) params.room_type = filters.room_type
      if (filters?.is_active !== undefined) params.is_active = String(filters.is_active)
      return api.get('/room-booking/rooms', { params }).then((r) => r.data)
    },
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RoomCreate) =>
      api.post('/room-booking/rooms', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['room-booking-stats'] })
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoomUpdate }) =>
      api.put(`/room-booking/rooms/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['room-booking-stats'] })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/room-booking/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['room-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['room-booking-stats'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Booking hooks
// ---------------------------------------------------------------------------

export function useRoomBookings(filters?: BookingFilters) {
  return useQuery<RoomBookingData[]>({
    queryKey: ['room-bookings', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.room_id) params.room_id = filters.room_id
      if (filters?.status) params.status = filters.status
      return api.get('/room-booking/bookings', { params }).then((r) => r.data)
    },
  })
}

export function useCreateRoomBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BookingCreate) =>
      api.post('/room-booking/bookings', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['room-booking-stats'] })
    },
  })
}

export function useUpdateRoomBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BookingUpdate }) =>
      api.put(`/room-booking/bookings/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['room-booking-stats'] })
    },
  })
}

export function useDeleteRoomBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/room-booking/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['room-booking-stats'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Stats hook
// ---------------------------------------------------------------------------

export function useRoomBookingStats() {
  return useQuery<RoomBookingStats>({
    queryKey: ['room-booking-stats'],
    queryFn: () => api.get('/room-booking/stats').then((r) => r.data),
  })
}

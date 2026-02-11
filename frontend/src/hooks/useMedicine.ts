/**
 * Camp Connect - Medicine React Query Hooks
 * CRUD for medicine schedules, nurse view, and administration tracking.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface MedicineScheduleCreate {
  camper_id: string
  event_id: string
  medicine_name: string
  dosage: string
  frequency?: string
  scheduled_times?: string[]
  special_instructions?: string
  prescribed_by?: string
  start_date: string
  end_date?: string
  submitted_by_contact_id?: string
}

export interface MedicineScheduleUpdate {
  medicine_name?: string
  dosage?: string
  frequency?: string
  scheduled_times?: string[]
  special_instructions?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
}

export interface MedicineSchedule {
  id: string
  camper_id: string
  event_id: string
  medicine_name: string
  dosage: string
  frequency: string
  scheduled_times: string[] | null
  special_instructions: string | null
  prescribed_by: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  camper_name: string | null
  bunk_name: string | null
  created_at: string
}

export interface NurseViewItem {
  schedule_id: string
  camper_id: string
  camper_name: string | null
  bunk_name: string | null
  medicine_name: string
  dosage: string
  scheduled_time: string
  special_instructions: string | null
  administered: {
    id: string
    status: string
    administered_at: string
    notes: string | null
  } | null
}

export interface NurseViewResponse {
  date: string
  time_slots: Record<string, NurseViewItem[]>
  total: number
  completed: number
  completion_pct: number
}

export interface AdministrationCreate {
  schedule_id: string
  scheduled_time?: string
  administration_date: string
  status?: string
  notes?: string
}

export interface Administration {
  id: string
  schedule_id: string
  administered_at: string
  administered_by: string
  scheduled_time: string | null
  administration_date: string
  status: string
  notes: string | null
  parent_notified: boolean
  nurse_name: string | null
}

export function useMedicineSchedules(filters?: {
  camper_id?: string
  event_id?: string
  is_active?: boolean
}) {
  return useQuery<MedicineSchedule[]>({
    queryKey: ['medicine-schedules', filters],
    queryFn: () =>
      api.get('/medicine/schedules', { params: filters }).then((r) => r.data),
  })
}

export function useNurseView(date: string | undefined, eventId?: string) {
  return useQuery<NurseViewResponse>({
    queryKey: ['medicine', 'nurse-view', date, eventId],
    queryFn: () =>
      api
        .get(`/medicine/nurse-view/${date}`, {
          params: eventId ? { event_id: eventId } : undefined,
        })
        .then((r) => r.data),
    enabled: !!date,
  })
}

export function useAdministrations(filters?: {
  schedule_id?: string
  administration_date?: string
}) {
  return useQuery<Administration[]>({
    queryKey: ['medicine', 'administrations', filters],
    queryFn: () =>
      api
        .get('/medicine/administrations', { params: filters })
        .then((r) => r.data),
  })
}

export function useCreateMedicineSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MedicineScheduleCreate) =>
      api.post('/medicine/schedules', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-schedules'] })
    },
  })
}

export function useUpdateMedicineSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MedicineScheduleUpdate }) =>
      api.put(`/medicine/schedules/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-schedules'] })
      queryClient.invalidateQueries({ queryKey: ['medicine', 'nurse-view'] })
    },
  })
}

export function useDeleteMedicineSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/medicine/schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-schedules'] })
      queryClient.invalidateQueries({ queryKey: ['medicine', 'nurse-view'] })
    },
  })
}

export function useRecordAdministration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdministrationCreate) =>
      api.post('/medicine/administrations', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine'] })
    },
  })
}
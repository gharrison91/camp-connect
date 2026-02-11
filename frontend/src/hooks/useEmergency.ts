/**
 * Camp Connect - Emergency Action Plans & Drills React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { EmergencyPlan, DrillRecord } from "../types";

interface EmergencyStats {
  total_active_plans: number;
  drills_this_quarter: number;
  avg_drill_score: number | null;
  overdue_reviews: number;
}

// ---- Plans ----

export function useEmergencyPlans(filters?: { status?: string; plan_type?: string; search?: string }) {
  return useQuery<EmergencyPlan[]>({
    queryKey: ["emergency-plans", filters],
    queryFn: () => api.get("/emergency/plans", { params: filters }).then((r) => r.data),
  });
}

export function useEmergencyPlan(id: string | null) {
  return useQuery<EmergencyPlan>({
    queryKey: ["emergency-plan", id],
    queryFn: () => api.get(`/emergency/plans/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateEmergencyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/emergency/plans", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-plans"] });
      qc.invalidateQueries({ queryKey: ["emergency-stats"] });
    },
  });
}

export function useUpdateEmergencyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/emergency/plans/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-plans"] });
      qc.invalidateQueries({ queryKey: ["emergency-plan"] });
      qc.invalidateQueries({ queryKey: ["emergency-stats"] });
    },
  });
}

export function useDeleteEmergencyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/emergency/plans/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency-plans"] });
      qc.invalidateQueries({ queryKey: ["emergency-stats"] });
    },
  });
}

// ---- Drills ----

export function useDrillRecords(filters?: { status?: string; plan_id?: string }) {
  return useQuery<DrillRecord[]>({
    queryKey: ["drill-records", filters],
    queryFn: () => api.get("/emergency/drills", { params: filters }).then((r) => r.data),
  });
}

export function useCreateDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/emergency/drills", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drill-records"] });
      qc.invalidateQueries({ queryKey: ["emergency-stats"] });
    },
  });
}

export function useUpdateDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/emergency/drills/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drill-records"] });
      qc.invalidateQueries({ queryKey: ["emergency-stats"] });
    },
  });
}

export function useDeleteDrill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/emergency/drills/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drill-records"] });
      qc.invalidateQueries({ queryKey: ["emergency-stats"] });
    },
  });
}

// ---- Stats ----

export function useEmergencyStats() {
  return useQuery<EmergencyStats>({
    queryKey: ["emergency-stats"],
    queryFn: () => api.get("/emergency/stats").then((r) => r.data),
  });
}

// ---- Overdue Reviews ----

export function useOverdueReviews() {
  return useQuery<EmergencyPlan[]>({
    queryKey: ["emergency-overdue"],
    queryFn: () => api.get("/emergency/plans/overdue-reviews").then((r) => r.data),
  });
}

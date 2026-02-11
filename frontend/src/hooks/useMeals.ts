/**
 * Camp Connect - Meals React Query Hooks
 * Hooks for meal planning, dietary restrictions, and allergen checking.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Meal, MealPlan, DietaryRestriction } from '../types'

// ---- Meals ----

interface MealFilters {
  dateFrom?: string
  dateTo?: string
  mealType?: string
}

export function useMeals(filters?: MealFilters) {
  return useQuery<Meal[]>({
    queryKey: ['meals', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.dateFrom) params.date_from = filters.dateFrom
      if (filters?.dateTo) params.date_to = filters.dateTo
      if (filters?.mealType) params.meal_type = filters.mealType
      return api.get('/meals', { params }).then((r) => r.data)
    },
  })
}

export interface MealCreateData {
  name: string
  meal_type: string
  date: string
  description?: string
  menu_items?: string[]
  allergens?: string[]
  nutritional_info?: Record<string, unknown>
}

export function useCreateMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MealCreateData) => api.post('/meals', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals'] })
      qc.invalidateQueries({ queryKey: ['meal-stats'] })
    },
  })
}

export function useUpdateMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: MealCreateData & { id: string }) =>
      api.put(`/meals/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals'] })
      qc.invalidateQueries({ queryKey: ['meal-stats'] })
    },
  })
}

export function useDeleteMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/meals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals'] })
      qc.invalidateQueries({ queryKey: ['meal-stats'] })
    },
  })
}

// ---- Meal Plans ----

export function useMealPlans(weekStart?: string) {
  return useQuery<MealPlan[]>({
    queryKey: ['meal-plans', weekStart],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (weekStart) params.week_start = weekStart
      return api.get('/meals/plans', { params }).then((r) => r.data)
    },
  })
}

export function useCreateMealPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; week_start: string; meal_ids: string[] }) =>
      api.post('/meals/plans', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-plans'] })
    },
  })
}

// ---- Dietary Restrictions ----

export function useDietaryRestrictions(camperId?: string) {
  return useQuery<DietaryRestriction[]>({
    queryKey: ['dietary-restrictions', camperId],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (camperId) params.camper_id = camperId
      return api.get('/meals/dietary-restrictions', { params }).then((r) => r.data)
    },
  })
}

export function useCreateDietaryRestriction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      camper_id: string
      restriction_type: string
      item: string
      severity?: string
      notes?: string
    }) => api.post('/meals/dietary-restrictions', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dietary-restrictions'] })
      qc.invalidateQueries({ queryKey: ['meal-stats'] })
    },
  })
}

// ---- Allergen Check ----

interface AllergenCheckResult {
  meal_id: string
  meal_name: string
  meal_allergens: string[]
  conflicts: Array<{
    camper_id: string
    camper_name: string
    restriction_type: string
    item: string
    severity: string
    meal_allergen: string
  }>
  warning_count: number
  severe_count: number
}

export function useAllergenCheck(mealId: string | undefined) {
  return useQuery<AllergenCheckResult>({
    queryKey: ['allergen-check', mealId],
    queryFn: () => api.get(`/meals/allergen-check/${mealId}`).then((r) => r.data),
    enabled: !!mealId,
  })
}

// ---- Stats ----

interface MealStats {
  total_meals: number
  total_plans: number
  total_restrictions: number
  campers_with_restrictions: number
  meals_by_type: Record<string, number>
  top_allergens: Array<{ name: string; count: number }>
  restrictions_by_type: Record<string, number>
}

export function useMealStats() {
  return useQuery<MealStats>({
    queryKey: ['meal-stats'],
    queryFn: () => api.get('/meals/stats').then((r) => r.data),
  })
}

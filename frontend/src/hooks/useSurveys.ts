/**
 * Camp Connect - Surveys React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface SurveyQuestion {
  id: string
  survey_id: string
  question_text: string
  question_type: 'text' | 'rating' | 'multiple_choice' | 'yes_no'
  options: string[] | null
  required: boolean
  order: number
  created_at: string
}

export interface SurveyData {
  id: string
  organization_id: string
  title: string
  description: string | null
  target_audience: 'parents' | 'staff' | 'campers' | 'all'
  status: 'draft' | 'active' | 'closed'
  start_date: string | null
  end_date: string | null
  question_count: number
  response_count: number
  created_at: string
  questions?: SurveyQuestion[]
}

export interface AnswerItem {
  question_id: string
  answer: string
}

export interface SurveyResponseData {
  id: string
  survey_id: string
  respondent_name: string | null
  respondent_email: string | null
  answers: AnswerItem[] | null
  submitted_at: string
  created_at: string
}

export interface SurveyStats {
  total_surveys: number
  active_count: number
  total_responses: number
  avg_completion_rate: number
}

export interface SurveyCreatePayload {
  title: string
  description?: string
  target_audience?: string
  status?: string
  start_date?: string | null
  end_date?: string | null
  questions?: {
    question_text: string
    question_type: string
    options?: string[] | null
    required?: boolean
    order?: number
  }[]
}

export type SurveyUpdatePayload = Partial<Omit<SurveyCreatePayload, 'questions'>>

interface SurveyFilters {
  search?: string
  status?: string
  target_audience?: string
}

// ---------------------------------------------------------------------------
// Survey hooks
// ---------------------------------------------------------------------------

export function useSurveys(filters?: SurveyFilters) {
  return useQuery<SurveyData[]>({
    queryKey: ['surveys', filters],
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters?.search) params.search = filters.search
      if (filters?.status) params.status = filters.status
      if (filters?.target_audience) params.target_audience = filters.target_audience
      return api.get('/surveys', { params }).then((r) => r.data)
    },
  })
}

export function useSurvey(surveyId: string | undefined) {
  return useQuery<SurveyData>({
    queryKey: ['surveys', surveyId],
    queryFn: () => api.get(`/surveys/${surveyId}`).then((r) => r.data),
    enabled: !!surveyId,
  })
}

export function useSurveyStats() {
  return useQuery<SurveyStats>({
    queryKey: ['surveys', 'stats'],
    queryFn: () => api.get('/surveys/stats').then((r) => r.data),
  })
}

export function useCreateSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SurveyCreatePayload) =>
      api.post('/surveys', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SurveyUpdatePayload }) =>
      api.put(`/surveys/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/surveys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Question hooks
// ---------------------------------------------------------------------------

export function useSurveyQuestions(surveyId: string | undefined) {
  return useQuery<SurveyQuestion[]>({
    queryKey: ['surveys', surveyId, 'questions'],
    queryFn: () => api.get(`/surveys/${surveyId}/questions`).then((r) => r.data),
    enabled: !!surveyId,
  })
}

export function useAddQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      surveyId,
      data,
    }: {
      surveyId: string
      data: {
        question_text: string
        question_type: string
        options?: string[] | null
        required?: boolean
        order?: number
      }
    }) => api.post(`/surveys/${surveyId}/questions`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Response hooks
// ---------------------------------------------------------------------------

export function useSurveyResponses(surveyId: string | undefined) {
  return useQuery<SurveyResponseData[]>({
    queryKey: ['surveys', surveyId, 'responses'],
    queryFn: () => api.get(`/surveys/${surveyId}/responses`).then((r) => r.data),
    enabled: !!surveyId,
  })
}

export function useSubmitResponse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      surveyId,
      data,
    }: {
      surveyId: string
      data: {
        respondent_name?: string
        respondent_email?: string
        answers: AnswerItem[]
      }
    }) => api.post(`/surveys/${surveyId}/responses`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })
}

/**
 * Camp Connect - API Client
 * Axios instance with Supabase JWT interceptor.
 */

import axios from 'axios'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 60000, // 60s — accounts for Render free tier cold starts (can take 50s+)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach Supabase JWT to every request
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 (redirect to login)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — sign out and redirect
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('north-auth')
    if (raw) {
      try {
        const state = JSON.parse(raw)
        const token = state?.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch {}
    }
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('north-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

import type {
  AuthTokens,
  User,
  UserProfile,
  Category,
  Transaction,
  SummaryReport,
  CategoryReportItem,
  PaginatedResponse,
  ForecastReport,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

class ApiError extends Error {
  status: number
  data: any

  constructor(status: number, message: string, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Token storage helpers
const TOKEN_KEY = 'atelier_auth_tokens'
const USER_KEY = 'atelier_user'

export const tokenStorage = {
  getTokens(): AuthTokens | null {
    try {
      const item = localStorage.getItem(TOKEN_KEY)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  setTokens(tokens: AuthTokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
  },
  getUser(): User | null {
    try {
      const item = localStorage.getItem(USER_KEY)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

// Format DRF error response into readable message
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError && error.data) {
    if (typeof error.data === 'string') return error.data
    if (typeof error.data === 'object') {
      const messages: string[] = []
      for (const [key, value] of Object.entries(error.data)) {
        const valStr = Array.isArray(value) ? value.join(' ') : String(value)
        if (key === 'non_field_errors' || key === 'detail') {
          messages.push(valStr)
        } else {
          messages.push(`${key}: ${valStr}`)
        }
      }
      if (messages.length > 0) return messages.join(' | ')
    }
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado al conectar con el servidor.'
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const tokens = tokenStorage.getTokens()
  if (tokens?.access) {
    headers.set('Authorization', `Bearer ${tokens.access}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle Token Expiry & Automatic Refresh
  if (response.status === 401 && retry && tokens?.refresh) {
    try {
      const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: tokens.refresh }),
      })

      if (refreshRes.ok) {
        const data = await refreshRes.json()
        const newTokens: AuthTokens = {
          access: data.access,
          refresh: tokens.refresh,
        }
        tokenStorage.setTokens(newTokens)

        // Retry initial request with new access token
        headers.set('Authorization', `Bearer ${newTokens.access}`)
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        })
        if (!retryResponse.ok) {
          const errData = await retryResponse.json().catch(() => null)
          throw new ApiError(retryResponse.status, retryResponse.statusText, errData)
        }
        return (await retryResponse.json()) as T
      } else {
        tokenStorage.clear()
        window.dispatchEvent(new Event('auth:unauthorized'))
      }
    } catch {
      tokenStorage.clear()
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
  }

  if (response.status === 204) {
    return {} as T
  }

  let data: any
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, data)
  }

  return data as T
}

export const api = {
  auth: {
    async register(payload: {
      email: string
      password: string
      password_confirm?: string
      username?: string
    }) {
      const res = await request<{
        user: User
        tokens: AuthTokens
        message: string
      }>('/api/v1/auth/register/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, false)
      if (res.tokens) {
        tokenStorage.setTokens(res.tokens)
        tokenStorage.setUser(res.user)
      }
      return res
    },

    async login(payload: { email: string; password: string }) {
      const res = await request<{
        access: string
        refresh: string
        user: User
      }>('/api/v1/auth/login/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, false)
      const tokens: AuthTokens = { access: res.access, refresh: res.refresh }
      tokenStorage.setTokens(tokens)
      tokenStorage.setUser(res.user)
      return { user: res.user, tokens }
    },

    logout() {
      tokenStorage.clear()
    },

    async getProfile(): Promise<UserProfile> {
      return request<UserProfile>('/api/v1/auth/me/')
    },

    async updateProfile(payload: { username: string }): Promise<UserProfile> {
      const updated = await request<UserProfile>('/api/v1/auth/me/', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      tokenStorage.setUser({
        id: updated.id,
        email: updated.email,
        username: updated.username,
      })
      return updated
    },

    async changePassword(payload: {
      old_password: string
      new_password: string
      new_password_confirm: string
    }): Promise<{ message: string }> {
      return request<{ message: string }>('/api/v1/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    async deleteAccount(payload: { password: string }): Promise<{ message: string }> {
      const res = await request<{ message: string }>('/api/v1/auth/delete-account/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      tokenStorage.clear()
      return res
    },
  },

  categories: {
    async list(): Promise<Category[]> {
      const res = await request<PaginatedResponse<Category> | Category[]>('/api/v1/categories/')
      if (Array.isArray(res)) return res
      return res.results || []
    },
  },

  transactions: {
    async list(params?: {
      date_from?: string
      date_to?: string
      category?: number
      kind?: string
      search?: string
      ordering?: string
      page?: number
    }): Promise<PaginatedResponse<Transaction>> {
      const query = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, String(val))
          }
        })
      }
      const qs = query.toString() ? `?${query.toString()}` : ''
      return request<PaginatedResponse<Transaction>>(`/api/v1/transactions/${qs}`)
    },

    async create(payload: {
      category: number
      amount: string | number
      kind: 'INCOME' | 'EXPENSE'
      date: string
      description: string
    }): Promise<Transaction> {
      return request<Transaction>('/api/v1/transactions/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    async delete(id: number): Promise<void> {
      return request<void>(`/api/v1/transactions/${id}/`, {
        method: 'DELETE',
      })
    },
  },

  reports: {
    async summary(params?: { date_from?: string; date_to?: string }): Promise<SummaryReport> {
      const query = new URLSearchParams()
      if (params?.date_from) query.append('date_from', params.date_from)
      if (params?.date_to) query.append('date_to', params.date_to)
      const qs = query.toString() ? `?${query.toString()}` : ''
      return request<SummaryReport>(`/api/v1/reports/summary/${qs}`)
    },

    async byCategory(params?: {
      date_from?: string
      date_to?: string
      kind?: string
    }): Promise<CategoryReportItem[]> {
      const query = new URLSearchParams()
      if (params?.date_from) query.append('date_from', params.date_from)
      if (params?.date_to) query.append('date_to', params.date_to)
      if (params?.kind) query.append('kind', params.kind)
      const qs = query.toString() ? `?${query.toString()}` : ''
      return request<CategoryReportItem[]>(`/api/v1/reports/by-category/${qs}`)
    },

    async forecast(months_ahead = 3): Promise<ForecastReport> {
      return request<ForecastReport>(`/api/v1/reports/forecast/?months_ahead=${months_ahead}`)
    },
  },
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, AuthTokens } from '../types'
import { api, tokenStorage } from '../services/api'

interface AuthContextValue {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  register: (data: {
    email: string
    password: string
    password_confirm?: string
    username?: string
  }) => Promise<void>
  logout: () => void
  updateUser: (updatedUser: User) => void
  deleteAccount: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => tokenStorage.getUser())
  const [tokens, setTokens] = useState<AuthTokens | null>(() => tokenStorage.getTokens())
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const logout = useCallback(() => {
    api.auth.logout()
    setUser(null)
    setTokens(null)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [logout])

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true)
    try {
      const res = await api.auth.login(credentials)
      setUser(res.user)
      setTokens(res.tokens)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: {
    email: string
    password: string
    password_confirm?: string
    username?: string
  }) => {
    setIsLoading(true)
    try {
      const res = await api.auth.register(data)
      setUser(res.user)
      setTokens(res.tokens)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
    tokenStorage.setUser(updatedUser)
  }, [])

  const deleteAccount = async (password: string) => {
    setIsLoading(true)
    try {
      await api.auth.deleteAccount({ password })
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextValue = {
    user,
    tokens,
    isAuthenticated: Boolean(user && tokens?.access),
    isLoading,
    login,
    register,
    logout,
    updateUser,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

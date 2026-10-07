import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  Category,
  Transaction,
  SummaryReport,
  CategoryReportItem,
} from '../types'
import { api, formatApiError } from '../services/api'
import { useAuth } from '../context/AuthContext'

export interface FinanceFilters {
  category?: number
  kind?: string
  search?: string
  date_from?: string
  date_to?: string
  ordering?: string
  page?: number
}

export function useFinanceData(initialFilters?: FinanceFilters) {
  const { isAuthenticated } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [summary, setSummary] = useState<SummaryReport>({
    income: '0.00',
    expense: '0.00',
    balance: '0.00',
    count: 0,
  })
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryReportItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FinanceFilters>(initialFilters || {
    ordering: '-date',
    page: 1,
  })

  // Prevent race conditions with ref
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await api.categories.list()
      if (isMounted.current) setCategories(data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [isAuthenticated])

  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await api.reports.summary({
        date_from: filters.date_from,
        date_to: filters.date_to,
      })
      if (isMounted.current) setSummary(data)
    } catch (err) {
      console.error('Error fetching summary:', err)
    }
  }, [isAuthenticated, filters.date_from, filters.date_to])

  const fetchCategoryBreakdown = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await api.reports.byCategory({
        date_from: filters.date_from,
        date_to: filters.date_to,
      })
      if (isMounted.current) setCategoryBreakdown(data)
    } catch (err) {
      console.error('Error fetching category breakdown:', err)
    }
  }, [isAuthenticated, filters.date_from, filters.date_to])

  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.transactions.list(filters)
      if (isMounted.current) {
        setTransactions(res.results || [])
        setTotalCount(res.count || 0)
      }
    } catch (err) {
      if (isMounted.current) {
        setError(formatApiError(err))
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [isAuthenticated, filters])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchCategories(),
      fetchSummary(),
      fetchCategoryBreakdown(),
      fetchTransactions(),
    ])
  }, [fetchCategories, fetchSummary, fetchCategoryBreakdown, fetchTransactions])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories()
    }
  }, [isAuthenticated, fetchCategories])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary()
      fetchCategoryBreakdown()
    }
  }, [isAuthenticated, fetchSummary, fetchCategoryBreakdown])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions()
    }
  }, [isAuthenticated, fetchTransactions])

  const createTransaction = async (payload: {
    category: number
    amount: string | number
    kind: 'INCOME' | 'EXPENSE'
    date: string
    description: string
  }) => {
    const newTx = await api.transactions.create(payload)
    await refreshAll()
    return newTx
  }

  const deleteTransaction = async (id: number) => {
    await api.transactions.delete(id)
    await refreshAll()
  }

  return {
    categories,
    transactions,
    totalCount,
    summary,
    categoryBreakdown,
    loading,
    error,
    filters,
    setFilters,
    createTransaction,
    deleteTransaction,
    refreshAll,
  }
}

export interface User {
  id: number
  email: string
  username: string
}

export interface UserProfile extends User {
  date_joined: string
  category_count: number
  transaction_count: number
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
  message?: string
}

export type TransactionKind = 'INCOME' | 'EXPENSE'

export interface Category {
  id: number
  name: string
  kind: TransactionKind
  created_at: string
}

export interface Transaction {
  id: number
  category: number
  category_name: string
  amount: string
  kind: TransactionKind
  date: string
  description: string
  created_at: string
}

export interface SummaryReport {
  income: string
  expense: string
  balance: string
  count: number
}

export interface CategoryReportItem {
  category_id?: number
  category_name?: string
  category__id?: number
  category__name?: string
  kind: TransactionKind
  total: string
  count: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface HistoricalPeriod {
  period: string
  income: number
  expense: number
  balance: number
}

export interface ForecastStatistics {
  avg_monthly_income: number
  avg_monthly_expense: number
  std_dev_expense: number
  median_expense: number
  savings_rate_pct: number
  trend_direction: 'increasing' | 'decreasing' | 'stable'
  expense_growth_rate_pct: number
  r_squared: number
}

export interface PredictionPeriod {
  period: string
  expected_income: number
  expected_expense: number
  expected_balance: number
  expense_lower_bound: number
  expense_upper_bound: number
  confidence_level: number
}

export interface CategoryPrediction {
  category_name: string
  historical_avg: number
  predicted_next_month: number
  trend_pct: number
  risk_level: 'alto' | 'moderado' | 'optimo'
}

export interface ForecastReport {
  historical: HistoricalPeriod[]
  statistics: ForecastStatistics
  predictions: PredictionPeriod[]
  category_predictions: CategoryPrediction[]
  insights: string[]
}

import { useState, useEffect } from 'react'
import { useFinanceData, type FinanceFilters } from '../hooks/useFinanceData'
import { BalanceSummary } from '../components/dashboard/BalanceSummary'
import { LedgerTable } from '../components/dashboard/LedgerTable'
import { EnvelopeBreakdown } from '../components/dashboard/EnvelopeBreakdown'
import { TransactionForm } from '../components/dashboard/TransactionForm'
import { StatisticalForecastView } from '../components/dashboard/StatisticalForecastView'
import { Modal } from '../components/common/Modal'

interface DashboardPageProps {
  onOpenNewTxTrigger?: (trigger: () => void) => void
  onOpenAccountSettings?: (tab?: 'profile' | 'security' | 'danger') => void
  activeViewTab?: 'ledger' | 'forecast'
  onTabChange?: (tab: 'ledger' | 'forecast') => void
}

export function DashboardPage({
  onOpenAccountSettings,
  activeViewTab = 'ledger',
  onTabChange,
}: DashboardPageProps) {
  const [currentTab, setCurrentTab] = useState<'ledger' | 'forecast'>(activeViewTab)

  useEffect(() => {
    if (activeViewTab) {
      setCurrentTab(activeViewTab)
    }
  }, [activeViewTab])

  const handleTabSelect = (tab: 'ledger' | 'forecast') => {
    setCurrentTab(tab)
    if (onTabChange) onTabChange(tab)
  }
  const {
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
  } = useFinanceData()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await refreshAll()
    } finally {
      setIsSyncing(false)
    }
  }

  const handleFilterChange = (newFilters: Partial<FinanceFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
  }

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      alert('No hay transacciones disponibles para exportar.')
      return
    }

    const headers = ['ID', 'Fecha', 'Descripcion', 'Categoria', 'Tipo', 'Monto']
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category_name}"`,
      t.kind === 'INCOME' ? 'Ingreso' : 'Gasto',
      t.amount,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `atelier_libro_mayor_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const expenseTotal = parseFloat(summary.expense || '0')
  const incomeTotal = parseFloat(summary.income || '0')

  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-12 py-6 flex flex-col gap-6">
      {/* Subheader / Audit Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-paper-hairline gap-2">
        <div>
          <h1 className="text-headline-md font-headline-md text-primary tracking-tight">
            Libro Mayor de Flujo de Caja
          </h1>
          <p className="text-body-sm font-body-sm text-slate">
            Registro canónico bajo metodología Kakebo • Auditoría de saldo continua conectada a Django API
          </p>
        </div>
        <div className="flex items-center space-x-4 text-label-sm font-label-sm text-slate self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            LEDGER SALDO: CUADRADO
          </span>
          <span className="text-paper-hairline">|</span>
          <span>MONEDA: USD ($)</span>
          <span className="text-paper-hairline">|</span>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="text-sage-forest hover:underline flex items-center gap-1"
          >
            <span className={`material-symbols-outlined text-[15px] ${isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isSyncing ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>
          {onOpenAccountSettings && (
            <>
              <span className="text-paper-hairline">|</span>
              <button
                onClick={() => onOpenAccountSettings('profile')}
                className="text-slate hover:text-primary transition-colors flex items-center gap-1 cursor-pointer font-medium"
                title="Ajustes y control de cuenta"
              >
                <span className="material-symbols-outlined text-[15px]">manage_accounts</span>
                <span>Mi Cuenta</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Global Error Banner if API fails */}
      {error && (
        <div className="p-3 bg-error-container/40 border border-muted-terracotta/40 rounded text-muted-terracotta text-body-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={handleSync}
            className="text-xs uppercase font-semibold underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* View Switcher: Libro Mayor vs Predicciones Estadísticas */}
      <div className="flex items-center gap-2 border-b border-paper-hairline pb-2">
        <button
          onClick={() => handleTabSelect('ledger')}
          className={`px-4 py-2 rounded-md text-body-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
            currentTab === 'ledger'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'border border-paper-hairline bg-cardstock text-on-surface-variant hover:text-primary hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          <span>Libro Diario & Sobres Kakebo</span>
        </button>

        <button
          onClick={() => handleTabSelect('forecast')}
          className={`px-4 py-2 rounded-md text-body-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
            currentTab === 'forecast'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'border border-paper-hairline bg-cardstock text-on-surface-variant hover:text-primary hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">query_stats</span>
          <span>Predicciones Estadísticas (Python OLS)</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-secondary-fixed/40 text-secondary ml-1">
            NUEVO
          </span>
        </button>
      </div>

      {currentTab === 'forecast' ? (
        <StatisticalForecastView onRefreshTrigger={refreshAll} />
      ) : (
        <>
          {/* 1. Financial Summary Strip */}
          <BalanceSummary summary={summary} />

          {/* 2. Primary Content Area: Asymmetric 8/4 Grid Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): Transaction Ledger Table */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <LedgerTable
                transactions={transactions}
                categories={categories}
                totalCount={totalCount}
                loading={loading}
                onDelete={deleteTransaction}
                onFilterChange={handleFilterChange}
                currentPage={filters.page || 1}
              />
            </div>

            {/* Right Column (4 cols): Kakebo Breakdown & Quick Entry Form */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              <EnvelopeBreakdown
                breakdown={categoryBreakdown}
                totalExpense={expenseTotal}
                totalIncome={incomeTotal}
              />

              <TransactionForm
                categories={categories}
                onSubmit={createTransaction}
              />
            </aside>
          </div>
        </>
      )}

      {/* Floating Action / Modal for New Transaction (e.g., from Navbar or Mobile) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ASENTAR NUEVA TRANSACCIÓN"
        maxWidth="max-w-md"
      >
        <TransactionForm
          categories={categories}
          onSubmit={createTransaction}
          onSuccess={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Hidden button exposed for navbar access */}
      <button
        id="btn-export-csv"
        onClick={handleExportCsv}
        className="hidden"
        aria-hidden="true"
      ></button>
      <button
        id="btn-open-new-tx"
        onClick={() => setIsModalOpen(true)}
        className="hidden"
        aria-hidden="true"
      ></button>
      <button
        id="btn-sync-all"
        onClick={handleSync}
        className="hidden"
        aria-hidden="true"
      ></button>
    </main>
  )
}

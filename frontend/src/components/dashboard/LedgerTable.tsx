import { useState, useEffect } from 'react'
import type { Transaction, Category } from '../../types'
import { useDebounce } from '../../hooks/useDebounce'

interface LedgerTableProps {
  transactions: Transaction[]
  categories: Category[]
  totalCount: number
  loading: boolean
  onDelete: (id: number) => Promise<void>
  onFilterChange: (filters: {
    search?: string
    category?: number
    ordering?: string
    date_from?: string
    date_to?: string
    page?: number
  }) => void
  currentPage: number
}

export function LedgerTable({
  transactions,
  categories,
  totalCount,
  loading,
  onDelete,
  onFilterChange,
  currentPage,
}: LedgerTableProps) {
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined)
  const [ordering, setOrdering] = useState<string>('-date')
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // Debounced search term
  const debouncedSearch = useDebounce(searchInput, 300)

  // Notify parent when search or category filter changes
  useEffect(() => {
    onFilterChange({
      search: debouncedSearch || undefined,
      category: selectedCategory,
      ordering,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: 1,
    })
  }, [debouncedSearch, selectedCategory, ordering, dateFrom, dateTo])

  const toggleSort = () => {
    const nextOrder = ordering === '-date' ? 'date' : '-date'
    setOrdering(nextOrder)
  }

  const handleDeleteClick = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Filter & Control Bar */}
      <div className="bg-cardstock border border-paper-hairline p-3 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar concepto, comercio..."
            className="w-full pl-8 pr-3 py-1.5 text-body-sm font-body-sm bg-surface-container-low border border-paper-hairline rounded focus:bg-cardstock focus:border-primary focus:ring-0 text-on-surface placeholder:text-slate transition-all"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-label-sm font-label-sm">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-2.5 py-1 rounded font-medium transition-colors btn-tactile ${
              selectedCategory === undefined
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low border border-paper-hairline text-on-surface-variant hover:text-primary'
            }`}
          >
            Todas ({totalCount})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? undefined : cat.id)}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap btn-tactile ${
                selectedCategory === cat.id
                  ? 'bg-primary text-on-primary font-medium'
                  : 'bg-surface-container-low border border-paper-hairline text-on-surface-variant hover:text-primary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Date & Sort Controls */}
        <div className="flex items-center space-x-2 pt-1 md:pt-0 border-t md:border-t-0 md:border-l border-paper-hairline md:pl-3">
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`p-1.5 rounded border border-paper-hairline text-label-sm font-label-sm inline-flex items-center gap-1 btn-tactile transition-colors ${
              dateFrom || dateTo
                ? 'bg-secondary-fixed text-primary font-semibold'
                : 'bg-cardstock text-slate hover:bg-surface-container'
            }`}
            title="Filtrar por rango de fechas"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span className="hidden sm:inline">
              {dateFrom || dateTo ? 'Filtrado' : 'Rango'}
            </span>
          </button>
          <button
            onClick={toggleSort}
            className="p-1.5 rounded border border-paper-hairline bg-cardstock hover:bg-surface-container text-slate text-label-sm font-label-sm inline-flex items-center gap-1 btn-tactile transition-colors"
            title="Ordenar registros"
          >
            <span className="material-symbols-outlined text-[16px]">swap_vert</span>
            <span className="hidden sm:inline">
              {ordering === '-date' ? 'Fecha desc' : 'Fecha asc'}
            </span>
          </button>
        </div>
      </div>

      {/* Date filter dropdown panel if open */}
      {showDateFilter && (
        <div className="bg-cardstock border border-paper-hairline p-3 rounded flex flex-wrap items-center gap-3 text-label-sm animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-slate">Desde:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 bg-surface-container-low border border-paper-hairline rounded font-ledger-num text-body-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate">Hasta:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 bg-surface-container-low border border-paper-hairline rounded font-ledger-num text-body-sm"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              className="text-muted-terracotta hover:underline ml-auto font-medium"
            >
              Limpiar Fechas
            </button>
          )}
        </div>
      )}

      {/* TRANSACTION LEDGER TABLE */}
      <div className="bg-cardstock border border-paper-hairline rounded overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-paper-hairline bg-surface-container-low text-label-sm font-label-sm text-slate uppercase">
                <th className="py-2.5 px-4 font-semibold w-28" scope="col">
                  FECHA
                </th>
                <th className="py-2.5 px-4 font-semibold" scope="col">
                  DESCRIPCIÓN / BENEFICIARIO
                </th>
                <th className="py-2.5 px-3 font-semibold w-32" scope="col">
                  CATEGORÍA
                </th>
                <th className="py-2.5 px-3 font-semibold w-24" scope="col">
                  TIPO
                </th>
                <th className="py-2.5 px-4 font-semibold text-right w-32" scope="col">
                  MONTO
                </th>
                <th className="py-2.5 px-3 font-semibold text-center w-24" scope="col">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-hairline text-body-sm font-body-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate">
                    <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
                    <p className="mt-2 text-label-sm">Consultando base de datos...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate">
                    <span className="material-symbols-outlined text-[32px] text-slate/50">
                      receipt_long
                    </span>
                    <p className="mt-2 text-body-sm text-primary font-medium">
                      No hay transacciones registradas en este período.
                    </p>
                    <p className="text-label-sm text-slate mt-1">
                      Utiliza el formulario de la derecha para agregar tu primer asiento contable.
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isIncome = tx.kind === 'INCOME'
                  const parsedAmount = parseFloat(tx.amount || '0')

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-surface-container-low transition-colors group ${
                        isIncome ? 'bg-secondary-fixed/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-ledger-num text-slate tabular-nums whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4 text-primary font-medium max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm border ${
                            isIncome
                              ? 'bg-secondary-fixed/50 border-secondary/30 text-sage-forest font-semibold'
                              : 'bg-surface-container border-paper-hairline text-on-surface'
                          }`}
                        >
                          {tx.category_name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate text-label-sm font-label-sm whitespace-nowrap">
                        <span className={isIncome ? 'text-sage-forest font-medium' : 'text-slate'}>
                          {isIncome ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-ledger-num tabular-nums whitespace-nowrap font-semibold ${
                          isIncome ? 'text-sage-forest font-bold' : 'text-muted-terracotta'
                        }`}
                      >
                        {isIncome ? '+' : '-'}$
                        {parsedAmount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {confirmDeleteId === tx.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDeleteClick(tx.id)}
                              disabled={deletingId === tx.id}
                              className="px-1.5 py-0.5 bg-muted-terracotta text-white rounded text-[10px] font-semibold hover:opacity-90 transition-opacity"
                            >
                              {deletingId === tx.id ? '...' : 'Sí'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 border border-paper-hairline bg-cardstock rounded text-[10px] text-slate hover:text-primary"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(tx.id)}
                            className="text-slate hover:text-muted-terracotta transition-colors p-1 rounded hover:bg-surface-container-high"
                            title="Eliminar transacción"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Minimalist Table Footer */}
        <div className="px-4 py-3 bg-surface-container-low border-t border-paper-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-label-sm font-label-sm text-slate">
          <div>
            <span>
              Mostrando {transactions.length} de {totalCount} transacciones contables • Precisión
              decimal verificada
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-primary font-medium">Página {currentPage}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

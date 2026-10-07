import React, { useState, useEffect } from 'react'
import type { Category, TransactionKind } from '../../types'
import { formatApiError } from '../../services/api'

interface TransactionFormProps {
  categories: Category[]
  onSubmit: (payload: {
    category: number
    amount: string
    kind: TransactionKind
    date: string
    description: string
  }) => Promise<any>
  onSuccess?: () => void
}

export function TransactionForm({ categories, onSubmit, onSuccess }: TransactionFormProps) {
  const [kind, setKind] = useState<TransactionKind>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filter categories by selected kind
  const filteredCategories = categories.filter((cat) => cat.kind === kind)

  // Auto-select first matching category when kind changes or categories load
  useEffect(() => {
    if (filteredCategories.length > 0) {
      // Check if current category matches
      const stillValid = filteredCategories.some((c) => c.id === categoryId)
      if (!stillValid) {
        setCategoryId(filteredCategories[0].id)
      }
    } else {
      setCategoryId('')
    }
  }, [kind, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Por favor ingresa un monto mayor a 0.00.')
      return
    }

    if (!categoryId) {
      setError('Por favor selecciona una categoría válida.')
      return
    }

    if (!description.trim()) {
      setError('Por favor ingresa una breve descripción del concepto.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        category: Number(categoryId),
        amount: numAmount.toFixed(2),
        kind,
        date,
        description: description.trim(),
      })

      // Reset fields
      setAmount('')
      setDescription('')
      setSuccessMsg('Asiento contable registrado exitosamente.')
      setTimeout(() => setSuccessMsg(null), 3000)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-cardstock border border-paper-hairline rounded p-5 flex flex-col gap-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-paper-hairline pb-2.5">
        <h2 className="text-label-sm font-label-sm uppercase tracking-wider text-slate font-bold">
          NUEVO ASIENTO CONTABLE
        </h2>
        <span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> LISTO
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="p-2.5 bg-error-container/40 border border-muted-terracotta/40 rounded text-muted-terracotta text-body-sm font-body-sm flex items-start gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-2.5 bg-secondary-fixed/40 border border-secondary/40 rounded text-sage-forest text-body-sm font-body-sm flex items-start gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Kind Segmented Toggle */}
        <div>
          <span className="block text-label-sm font-label-sm text-slate mb-1">
            TIPO DE OPERACIÓN
          </span>
          <div className="grid grid-cols-2 p-1 bg-surface-container-low border border-paper-hairline rounded">
            <button
              type="button"
              onClick={() => setKind('EXPENSE')}
              className={`py-1 text-label-sm font-label-sm font-semibold rounded btn-tactile transition-all ${
                kind === 'EXPENSE'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-slate hover:text-primary'
              }`}
            >
              GASTO
            </button>
            <button
              type="button"
              onClick={() => setKind('INCOME')}
              className={`py-1 text-label-sm font-label-sm font-semibold rounded btn-tactile transition-all ${
                kind === 'INCOME'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-slate hover:text-primary'
              }`}
            >
              INGRESO
            </button>
          </div>
        </div>

        {/* Monto input */}
        <div>
          <label htmlFor="tx-amount" className="block text-label-sm font-label-sm text-slate mb-1">
            MONTO CONTABLE
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-ledger-num text-slate text-body-lg">
              $
            </span>
            <input
              id="tx-amount"
              type="number"
              step="0.01"
              min="0.01"
              max="999999999.99"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 bg-surface-container-low border border-paper-hairline rounded text-headline-sm font-ledger-num text-primary focus:bg-cardstock focus:border-primary focus:ring-0 tabular-nums placeholder:text-slate/40 transition-colors"
            />
          </div>
        </div>

        {/* Categoría Selector */}
        <div>
          <label
            htmlFor="tx-category"
            className="block text-label-sm font-label-sm text-slate mb-1"
          >
            CATEGORÍA KAKEBO ({kind === 'EXPENSE' ? 'GASTOS' : 'INGRESOS'})
          </label>
          <select
            id="tx-category"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full px-3 py-2 bg-surface-container-low border border-paper-hairline rounded text-body-sm font-body-sm text-primary focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
          >
            {filteredCategories.length === 0 ? (
              <option value="">Sin categorías disponibles para este tipo</option>
            ) : (
              filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Fecha contable */}
        <div>
          <label htmlFor="tx-date" className="block text-label-sm font-label-sm text-slate mb-1">
            FECHA CONTABLE (NO FUTURA)
          </label>
          <input
            id="tx-date"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-1.5 bg-surface-container-low border border-paper-hairline rounded font-ledger-num text-body-sm text-primary focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
          />
        </div>

        {/* Concepto input */}
        <div>
          <label
            htmlFor="tx-description"
            className="block text-label-sm font-label-sm text-slate mb-1"
          >
            CONCEPTO O BENEFICIARIO
          </label>
          <input
            id="tx-description"
            type="text"
            required
            maxLength={255}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Compra de insumos frescos..."
            className="w-full px-3 py-1.5 bg-surface-container-low border border-paper-hairline rounded text-body-sm font-body-sm text-primary placeholder:text-slate/50 focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
          />
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-primary text-on-primary rounded text-label-sm font-label-sm font-medium tracking-wide btn-tactile hover:bg-primary-container disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined text-[16px]">
              {submitting ? 'sync' : 'edit_note'}
            </span>
            <span>{submitting ? 'Registrando en BD...' : 'Registrar en Libro'}</span>
          </button>
          <p className="text-[11px] text-center text-slate font-label-sm mt-1.5">
            Impacto atómico en balance y base de datos
          </p>
        </div>
      </form>
    </div>
  )
}

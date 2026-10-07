import type { CategoryReportItem } from '../../types'

interface EnvelopeBreakdownProps {
  breakdown: CategoryReportItem[]
  totalExpense: number
  totalIncome: number
}

export function EnvelopeBreakdown({ breakdown, totalExpense }: EnvelopeBreakdownProps) {
  // Aggregate totals by standard category name (case-insensitive)
  const getCategoryTotal = (targetName: string): number => {
    const item = breakdown.find((b) => {
      const name = b.category_name || b.category__name || ''
      return name.toLowerCase().includes(targetName.toLowerCase())
    })
    return item ? parseFloat(item.total || '0') : 0
  }

  const getCategoryCount = (targetName: string): number => {
    const item = breakdown.find((b) => {
      const name = b.category_name || b.category__name || ''
      return name.toLowerCase().includes(targetName.toLowerCase())
    })
    return item ? item.count : 0
  }

  const alimentosTotal = getCategoryTotal('Alimentos')
  const serviciosTotal = getCategoryTotal('Servicios')
  const ocioTotal = getCategoryTotal('Ocio')
  const salarioTotal = getCategoryTotal('Salario')

  // Calculate percentages based on totalExpense or proportional share
  const alimentosPct =
    totalExpense > 0 ? Math.min(100, Math.round((alimentosTotal / totalExpense) * 100)) : 0
  const serviciosPct =
    totalExpense > 0 ? Math.min(100, Math.round((serviciosTotal / totalExpense) * 100)) : 0
  const ocioPct =
    totalExpense > 0 ? Math.min(100, Math.round((ocioTotal / totalExpense) * 100)) : 0

  return (
    <div className="bg-cardstock border border-paper-hairline rounded p-5 flex flex-col gap-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-paper-hairline pb-2.5">
        <h2 className="text-label-sm font-label-sm uppercase tracking-wider text-slate font-bold">
          DISTRIBUCIÓN POR SOBRES
        </h2>
        <span className="text-label-sm font-label-sm text-secondary font-medium">Regla Kakebo</span>
      </div>

      <div className="space-y-4">
        {/* Envelope 1: Alimentos */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-body-sm font-body-sm">
            <span className="font-medium text-primary">Alimentos (Supervivencia)</span>
            <span className="font-ledger-num text-slate tabular-nums text-label-sm font-label-sm">
              ${alimentosTotal.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-muted-terracotta transition-all duration-500"
              style={{ width: `${alimentosPct}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate font-label-sm">
            <span>{alimentosPct}% del gasto total</span>
            <span>{getCategoryCount('Alimentos')} asientos</span>
          </div>
        </div>

        {/* Envelope 2: Servicios */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-body-sm font-body-sm">
            <span className="font-medium text-primary">Servicios Básicos (Fijos)</span>
            <span className="font-ledger-num text-slate tabular-nums text-label-sm font-label-sm">
              ${serviciosTotal.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-muted-terracotta transition-all duration-500"
              style={{ width: `${serviciosPct}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate font-label-sm">
            <span>{serviciosPct}% del gasto total</span>
            <span>{getCategoryCount('Servicios')} asientos</span>
          </div>
        </div>

        {/* Envelope 3: Ocio */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-body-sm font-body-sm">
            <span className="font-medium text-primary">Ocio Medido (Opcional)</span>
            <span className="font-ledger-num text-slate tabular-nums text-label-sm font-label-sm">
              ${ocioTotal.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-slate transition-all duration-500"
              style={{ width: `${ocioPct}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate font-label-sm">
            <span>{ocioPct}% del gasto total</span>
            <span>{getCategoryCount('Ocio')} asientos</span>
          </div>
        </div>

        {/* Envelope 4: Salario */}
        <div className="space-y-1.5 pt-1 border-t border-paper-hairline">
          <div className="flex justify-between text-body-sm font-body-sm">
            <span className="font-medium text-sage-forest">Salario / Flujo Total</span>
            <span className="font-ledger-num text-sage-forest tabular-nums text-label-sm font-label-sm">
              +${salarioTotal.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-forest transition-all duration-500"
              style={{ width: salarioTotal > 0 ? '100%' : '0%' }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate font-label-sm">
            <span>Ingreso consolidado</span>
            <span className="text-secondary font-medium">100% verificado</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-paper-hairline flex items-center justify-between text-label-sm font-label-sm text-slate">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          4 sobres sincronizados con BD
        </span>
        <span className="font-mono text-[10px] text-slate">SQL GROUP BY</span>
      </div>
    </div>
  )
}

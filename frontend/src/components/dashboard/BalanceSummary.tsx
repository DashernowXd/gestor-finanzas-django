import type { SummaryReport } from '../../types'

interface BalanceSummaryProps {
  summary: SummaryReport
}

export function BalanceSummary({ summary }: BalanceSummaryProps) {
  const incomeNum = parseFloat(summary.income || '0')
  const expenseNum = parseFloat(summary.expense || '0')
  const balanceNum = parseFloat(summary.balance || '0')

  // Solvency ratio
  const solvencyPercent =
    incomeNum > 0 ? Math.max(0, ((balanceNum / incomeNum) * 100)).toFixed(1) : '0.0'

  return (
    <section aria-label="Resumen de balance general" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Ingresos Totales */}
      <div className="bg-cardstock border border-paper-hairline p-4 rounded flex flex-col justify-between hover:border-slate/40 transition-colors shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-label-sm text-slate tracking-wider uppercase">
            INGRESOS TOTALES
          </span>
          <span className="material-symbols-outlined text-sage-forest text-[18px]">trending_up</span>
        </div>
        <div className="my-3">
          <span className="text-headline-lg font-ledger-num text-sage-forest tabular-nums tracking-tight">
            +${incomeNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="pt-2 border-t border-paper-hairline flex items-center justify-between text-label-sm font-label-sm text-slate">
          <span>{summary.count} registros totales</span>
          <span className="text-secondary font-medium">Asentado en BD</span>
        </div>
      </div>

      {/* Card 2: Egresos Totales */}
      <div className="bg-cardstock border border-paper-hairline p-4 rounded flex flex-col justify-between hover:border-slate/40 transition-colors shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-label-sm text-slate tracking-wider uppercase">
            EGRESOS TOTALES
          </span>
          <span className="material-symbols-outlined text-muted-terracotta text-[18px]">trending_down</span>
        </div>
        <div className="my-3">
          <span className="text-headline-lg font-ledger-num text-muted-terracotta tabular-nums tracking-tight">
            -${expenseNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="pt-2 border-t border-paper-hairline flex items-center justify-between text-label-sm font-label-sm text-slate">
          <span>Gastos operativos</span>
          <span className="text-muted-terracotta font-medium">Kakebo 4 Sobres</span>
        </div>
      </div>

      {/* Card 3: Balance Neto Disponible */}
      <div className="bg-cardstock border border-paper-hairline p-4 rounded flex flex-col justify-between hover:border-slate/40 transition-colors shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-label-sm text-slate tracking-wider uppercase">
            BALANCE NETO DISPONIBLE
          </span>
          <span className="material-symbols-outlined text-primary text-[18px]">
            account_balance_wallet
          </span>
        </div>
        <div className="my-3">
          <span
            className={`text-headline-lg font-ledger-num tabular-nums tracking-tight ${
              balanceNum >= 0 ? 'text-primary' : 'text-muted-terracotta'
            }`}
          >
            {balanceNum < 0 ? '-' : ''}$
            {Math.abs(balanceNum).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="pt-2 border-t border-paper-hairline flex items-center justify-between text-label-sm font-label-sm text-slate">
          <span>Calculado en base de datos</span>
          <span className="font-medium text-primary">Solvencia {solvencyPercent}%</span>
        </div>
      </div>
    </section>
  )
}

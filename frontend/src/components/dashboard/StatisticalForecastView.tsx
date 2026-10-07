import { useState, useEffect, useMemo } from 'react'
import { api, formatApiError } from '../../services/api'
import type { ForecastReport } from '../../types'

interface StatisticalForecastViewProps {
  onRefreshTrigger?: () => void
}

export function StatisticalForecastView({ onRefreshTrigger }: StatisticalForecastViewProps) {
  const [monthsAhead, setMonthsAhead] = useState<number>(3)
  const [report, setReport] = useState<ForecastReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{
    period: string
    type: 'historical' | 'prediction'
    income: number
    expense: number
    balance: number
    lower?: number
    upper?: number
    x: number
    y: number
  } | null>(null)

  const fetchForecast = async (months: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.reports.forecast(months)
      setReport(data)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForecast(monthsAhead)
  }, [monthsAhead, onRefreshTrigger])

  // Combine historical and predictions into unified graph sequence
  const chartData = useMemo(() => {
    if (!report) return []

    const historicalPoints = report.historical.map((h) => ({
      period: h.period,
      isPrediction: false,
      income: h.income,
      expense: h.expense,
      balance: h.balance,
      lowerBound: h.expense,
      upperBound: h.expense,
    }))

    const predictionPoints = report.predictions.map((p) => ({
      period: p.period,
      isPrediction: true,
      income: p.expected_income,
      expense: p.expected_expense,
      balance: p.expected_balance,
      lowerBound: p.expense_lower_bound,
      upperBound: p.expense_upper_bound,
    }))

    return [...historicalPoints, ...predictionPoints]
  }, [report])

  // SVG dimensions and scaling calculation
  const svgWidth = 840
  const svgHeight = 320
  const padding = { top: 30, right: 35, bottom: 45, left: 65 }

  const graphWidth = svgWidth - padding.left - padding.right
  const graphHeight = svgHeight - padding.top - padding.bottom

  const maxVal = useMemo(() => {
    if (chartData.length === 0) return 1000
    let highest = 0
    chartData.forEach((d) => {
      if (d.income > highest) highest = d.income
      if (d.expense > highest) highest = d.expense
      if (d.upperBound > highest) highest = d.upperBound
    })
    return Math.max(highest * 1.15, 100)
  }, [chartData])

  const getY = (val: number) => {
    return padding.top + graphHeight - (Math.max(0, val) / maxVal) * graphHeight
  }

  const getX = (index: number) => {
    if (chartData.length <= 1) return padding.left + graphWidth / 2
    return padding.left + (index / (chartData.length - 1)) * graphWidth
  }

  // Calculate SVG paths
  const historicalCount = report?.historical.length || 0

  const expenseHistPath = useMemo(() => {
    const pts = chartData.slice(0, historicalCount)
    if (pts.length === 0) return ''
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.expense)}`).join(' ')
  }, [chartData, historicalCount])

  const expensePredPath = useMemo(() => {
    if (historicalCount === 0 || chartData.length <= historicalCount) return ''
    // Connect from last historical point to predictions
    const pts = chartData.slice(historicalCount - 1)
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(historicalCount - 1 + i)} ${getY(p.expense)}`)
      .join(' ')
  }, [chartData, historicalCount])

  const incomeHistPath = useMemo(() => {
    const pts = chartData.slice(0, historicalCount)
    if (pts.length === 0) return ''
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.income)}`).join(' ')
  }, [chartData, historicalCount])

  const incomePredPath = useMemo(() => {
    if (historicalCount === 0 || chartData.length <= historicalCount) return ''
    const pts = chartData.slice(historicalCount - 1)
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(historicalCount - 1 + i)} ${getY(p.income)}`)
      .join(' ')
  }, [chartData, historicalCount])

  // Confidence Interval polygon for predictions
  const confidencePolygon = useMemo(() => {
    if (historicalCount === 0 || chartData.length <= historicalCount) return ''
    const predPts = chartData.slice(historicalCount - 1)
    const upperPoints: string[] = []
    const lowerPoints: string[] = []

    predPts.forEach((p, idx) => {
      const x = getX(historicalCount - 1 + idx)
      upperPoints.push(`${x},${getY(p.upperBound)}`)
      lowerPoints.unshift(`${x},${getY(p.lowerBound)}`)
    })

    return `${upperPoints.join(' ')} ${lowerPoints.join(' ')}`
  }, [chartData, historicalCount])

  const stats = report?.statistics

  return (
    <div className="flex flex-col gap-6">
      {/* Header with horizon toggle and stats badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-paper-hairline gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">monitoring</span>
            <h2 className="text-headline-md font-headline-md text-primary tracking-tight">
              Modelado Predictivo y Análisis Estadístico
            </h2>
          </div>
          <p className="text-body-sm font-body-sm text-slate mt-0.5">
            Algoritmos de Regresión Lineal por Mínimos Cuadrados (OLS) y dispersión basados en los libros contables.
          </p>
        </div>

        {/* Horizon selector buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto border border-paper-hairline rounded bg-cardstock p-1">
          <span className="text-[11px] font-semibold text-slate uppercase px-2">Proyectar a:</span>
          {[1, 3, 6].map((m) => (
            <button
              key={m}
              onClick={() => setMonthsAhead(m)}
              className={`px-2.5 py-1 rounded text-label-sm font-medium transition-all ${
                monthsAhead === m
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              {m} {m === 1 ? 'Mes' : 'Meses'}
            </button>
          ))}
          <button
            onClick={() => fetchForecast(monthsAhead)}
            disabled={loading}
            title="Recalcular modelo"
            className="p-1 hover:bg-surface-container rounded text-slate hover:text-primary transition-colors ml-1"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 bg-error-container/40 border border-muted-terracotta/40 rounded text-muted-terracotta text-body-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => fetchForecast(monthsAhead)} className="text-xs font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Gasto Promedio y Desviación */}
          <div className="border border-paper-hairline bg-cardstock p-4 rounded-lg flex flex-col gap-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
              Media Mensual de Gasto (μ)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-primary">
                ${stats.avg_monthly_expense.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <span className="text-[11px] text-slate mt-0.5">
              Desviación Estándar (σ): ±${stats.std_dev_expense.toFixed(2)}
            </span>
          </div>

          {/* Card 2: Tendencia de Gasto y Pendiente */}
          <div className="border border-paper-hairline bg-cardstock p-4 rounded-lg flex flex-col gap-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
              Tendencia Lineal (OLS)
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xl font-bold font-mono ${
                  stats.trend_direction === 'increasing'
                    ? 'text-muted-terracotta'
                    : stats.trend_direction === 'decreasing'
                    ? 'text-sage-forest'
                    : 'text-primary'
                }`}
              >
                {stats.expense_growth_rate_pct > 0 ? `+${stats.expense_growth_rate_pct}%` : `${stats.expense_growth_rate_pct}%`}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  stats.trend_direction === 'increasing'
                    ? 'bg-muted-terracotta/15 text-muted-terracotta'
                    : stats.trend_direction === 'decreasing'
                    ? 'bg-sage-forest/15 text-sage-forest'
                    : 'bg-surface-container text-slate'
                }`}
              >
                {stats.trend_direction === 'increasing'
                  ? 'Alcista'
                  : stats.trend_direction === 'decreasing'
                  ? 'A la baja'
                  : 'Estable'}
              </span>
            </div>
            <span className="text-[11px] text-slate mt-0.5">Ritmo mensual estimado</span>
          </div>

          {/* Card 3: Fiabilidad del Modelo (R^2) */}
          <div className="border border-paper-hairline bg-cardstock p-4 rounded-lg flex flex-col gap-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
              Ajuste Estadístico (R²)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-primary">
                {(stats.r_squared * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate font-sans">
                {stats.r_squared >= 0.7 ? 'Alta fiabilidad' : stats.r_squared >= 0.4 ? 'Moderada' : 'Preliminar'}
              </span>
            </div>
            <span className="text-[11px] text-slate mt-0.5">Coeficiente de determinación</span>
          </div>

          {/* Card 4: Tasa de Ahorro */}
          <div className="border border-paper-hairline bg-cardstock p-4 rounded-lg flex flex-col gap-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
              Tasa de Ahorro Estimada
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold font-mono ${
                  stats.savings_rate_pct >= 20
                    ? 'text-sage-forest'
                    : stats.savings_rate_pct > 0
                    ? 'text-secondary'
                    : 'text-muted-terracotta'
                }`}
              >
                {stats.savings_rate_pct}%
              </span>
              <span className="text-[11px] text-slate">
                {stats.savings_rate_pct >= 20 ? 'Meta 50/30/20' : stats.savings_rate_pct > 0 ? 'Margen bajo' : 'Déficit'}
              </span>
            </div>
            <span className="text-[11px] text-slate mt-0.5">Ingreso vs Gasto en libros</span>
          </div>
        </div>
      )}

      {/* Main Interactive Chart Card */}
      <div className="border border-paper-hairline bg-cardstock p-5 rounded-lg flex flex-col gap-4 shadow-sm relative">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-hairline pb-3">
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-semibold text-primary">
              Serie Temporal: Histórico de Libros y Proyecciones Futuras
            </span>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-label-sm font-label-sm text-slate">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sage-forest"></span>
              <span>Ingreso Real</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-sage-forest"></span>
              <span>Ingreso Proyectado</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#B25043]"></span>
              <span>Gasto Real</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-[#B25043]"></span>
              <span>Gasto Proyectado</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#B25043]/15"></span>
              <span>Banda de Confianza 80% (±1.28σ)</span>
            </span>
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="h-72 w-full flex items-center justify-center text-slate text-body-sm">
            <span className="material-symbols-outlined animate-spin mr-2">sync</span>
            <span>Calculando modelo estadístico en Python...</span>
          </div>
        )}

        {/* Empty state if no data */}
        {!loading && chartData.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate">
            <span className="material-symbols-outlined text-4xl mb-2 text-slate/60">query_stats</span>
            <p className="font-semibold text-primary">Aún no hay suficientes transacciones registradas</p>
            <p className="text-body-sm max-w-md mt-1">
              Asienta transacciones en tu libro diario para que el motor de regresión lineal pueda calcular medias,
              desviaciones estándar y proyecciones a futuro.
            </p>
          </div>
        )}

        {/* SVG Visualization */}
        {!loading && chartData.length > 0 && (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[650px] overflow-visible font-mono"
            >
              {/* Y Gridlines and labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const val = maxVal * ratio
                const y = getY(val)
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="currentColor"
                      opacity="0.5"
                    >
                      ${Math.round(val).toLocaleString()}
                    </text>
                  </g>
                )
              })}

              {/* Vertical Divider between Historical and Prediction */}
              {historicalCount > 0 && historicalCount < chartData.length && (
                <g>
                  <line
                    x1={getX(historicalCount - 1)}
                    y1={padding.top}
                    x2={getX(historicalCount - 1)}
                    y2={padding.top + graphHeight}
                    stroke="currentColor"
                    strokeOpacity="0.3"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={getX(historicalCount - 1) + 6}
                    y={padding.top + 14}
                    fontSize="9"
                    fontWeight="bold"
                    fill="currentColor"
                    opacity="0.6"
                    letterSpacing="0.05em"
                  >
                    PROYECCIONES FUTURAS →
                  </text>
                </g>
              )}

              {/* Confidence Interval Polygon */}
              {confidencePolygon && (
                <polygon
                  points={confidencePolygon}
                  fill="#B25043"
                  fillOpacity="0.12"
                />
              )}

              {/* Income Line - Historical */}
              {incomeHistPath && (
                <path
                  d={incomeHistPath}
                  fill="none"
                  stroke="#3E6B56"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Income Line - Prediction */}
              {incomePredPath && (
                <path
                  d={incomePredPath}
                  fill="none"
                  stroke="#3E6B56"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />
              )}

              {/* Expense Line - Historical */}
              {expenseHistPath && (
                <path
                  d={expenseHistPath}
                  fill="none"
                  stroke="#B25043"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Expense Line - Prediction */}
              {expensePredPath && (
                <path
                  d={expensePredPath}
                  fill="none"
                  stroke="#B25043"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />
              )}

              {/* Data Points */}
              {chartData.map((pt, idx) => {
                const x = getX(idx)
                const yExp = getY(pt.expense)
                const yInc = getY(pt.income)

                return (
                  <g key={pt.period}>
                    {/* Expense circle */}
                    <circle
                      cx={x}
                      cy={yExp}
                      r={pt.isPrediction ? 4.5 : 4}
                      fill={pt.isPrediction ? '#FFFFFF' : '#B25043'}
                      stroke="#B25043"
                      strokeWidth="2"
                      className="cursor-pointer transition-transform hover:scale-150"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          period: pt.period,
                          type: pt.isPrediction ? 'prediction' : 'historical',
                          income: pt.income,
                          expense: pt.expense,
                          balance: pt.balance,
                          lower: pt.lowerBound,
                          upper: pt.upperBound,
                          x,
                          y: yExp,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* Income circle */}
                    <circle
                      cx={x}
                      cy={yInc}
                      r={pt.isPrediction ? 4.5 : 4}
                      fill={pt.isPrediction ? '#FFFFFF' : '#3E6B56'}
                      stroke="#3E6B56"
                      strokeWidth="2"
                      className="cursor-pointer transition-transform hover:scale-150"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          period: pt.period,
                          type: pt.isPrediction ? 'prediction' : 'historical',
                          income: pt.income,
                          expense: pt.expense,
                          balance: pt.balance,
                          lower: pt.lowerBound,
                          upper: pt.upperBound,
                          x,
                          y: yInc,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* X axis labels */}
                    <text
                      x={x}
                      y={svgHeight - padding.bottom + 20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="currentColor"
                      opacity={pt.isPrediction ? '0.9' : '0.6'}
                      fontWeight={pt.isPrediction ? 'bold' : 'normal'}
                    >
                      {pt.period}
                    </text>
                    {pt.isPrediction && (
                      <text
                        x={x}
                        y={svgHeight - padding.bottom + 32}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#B25043"
                        fontWeight="bold"
                        letterSpacing="0.04em"
                      >
                        (PRED)
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Interactive Tooltip Float */}
            {hoveredPoint && (
              <div
                className="absolute z-30 pointer-events-none bg-surface-container-highest border border-paper-hairline rounded-md p-3 shadow-lg text-xs font-mono"
                style={{
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: `${Math.max(10, (hoveredPoint.y / svgHeight) * 100 - 35)}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="font-bold text-primary border-b border-paper-hairline pb-1 mb-1.5 flex items-center justify-between gap-3">
                  <span>Período: {hoveredPoint.period}</span>
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded font-sans uppercase ${
                      hoveredPoint.type === 'prediction'
                        ? 'bg-muted-terracotta/15 text-muted-terracotta'
                        : 'bg-secondary-fixed/40 text-secondary'
                    }`}
                  >
                    {hoveredPoint.type === 'prediction' ? 'Proyección' : 'Asentado'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between gap-4 text-sage-forest">
                    <span>Ingresos:</span>
                    <span className="font-bold">${hoveredPoint.income.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-[#B25043]">
                    <span>Gastos:</span>
                    <span className="font-bold">${hoveredPoint.expense.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-primary border-t border-paper-hairline pt-1">
                    <span>Balance Neto:</span>
                    <span className="font-bold">${hoveredPoint.balance.toFixed(2)}</span>
                  </div>
                  {hoveredPoint.lower !== undefined && hoveredPoint.upper !== undefined && hoveredPoint.type === 'prediction' && (
                    <div className="text-[10px] text-slate mt-1 border-t border-paper-hairline pt-1 font-sans">
                      Intervalo Confianza (80%): ${hoveredPoint.lower.toFixed(0)} - ${hoveredPoint.upper.toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Two Column Grid: Category Predictions & Automated Insights */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Category-Level Forecasts */}
          <div className="lg:col-span-7 border border-paper-hairline bg-cardstock p-5 rounded-lg flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-paper-hairline pb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">pie_chart</span>
                <h3 className="text-body-md font-semibold text-primary">
                  Proyección del Próximo Mes por Rubro
                </h3>
              </div>
              <span className="text-[11px] text-slate font-mono">Regresión por Categoría</span>
            </div>

            {report.category_predictions.length === 0 ? (
              <p className="text-body-sm text-slate py-4">No hay datos de categorías registrados.</p>
            ) : (
              <div className="flex flex-col gap-3 mt-1">
                {report.category_predictions.map((cat) => (
                  <div
                    key={cat.category_name}
                    className="p-3 border border-paper-hairline rounded bg-surface/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary text-body-sm">{cat.category_name}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            cat.risk_level === 'alto'
                              ? 'bg-muted-terracotta/15 text-muted-terracotta'
                              : cat.risk_level === 'moderado'
                              ? 'bg-secondary-fixed/40 text-secondary'
                              : 'bg-sage-forest/15 text-sage-forest'
                          }`}
                        >
                          Riesgo {cat.risk_level}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate font-mono">
                        Promedio Histórico: ${cat.historical_avg.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-baseline sm:flex-col sm:items-end gap-2 sm:gap-0">
                      <span className="text-body-md font-bold font-mono text-primary">
                        ${cat.predicted_next_month.toFixed(2)}
                      </span>
                      <span
                        className={`text-[11px] font-mono ${
                          cat.trend_pct > 0 ? 'text-muted-terracotta' : 'text-sage-forest'
                        }`}
                      >
                        {cat.trend_pct > 0 ? `+${cat.trend_pct}%` : `${cat.trend_pct}%`} vs media
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Automated Executive Insights */}
          <div className="lg:col-span-5 border border-paper-hairline bg-cardstock p-5 rounded-lg flex flex-col gap-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-paper-hairline pb-2.5">
              <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
              <h3 className="text-body-md font-semibold text-primary">
                Diagnóstico de Inteligencia Estadística
              </h3>
            </div>

            <div className="flex flex-col gap-2.5 mt-1">
              {report.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded border border-paper-hairline bg-surface/60 flex items-start gap-2.5 text-body-sm"
                >
                  <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5 shrink-0">
                    lightbulb
                  </span>
                  <p className="text-on-surface leading-snug">{insight}</p>
                </div>
              ))}
            </div>

            <div className="mt-2 p-3 border border-paper-hairline/60 rounded bg-surface-container-low text-[11px] text-slate flex flex-col gap-1">
              <span className="font-semibold text-primary uppercase tracking-wider">Fundamento Matemático:</span>
              <p>
                Este módulo no utiliza proyecciones estáticas ficticias. Aplica estimación OLS sobre series de tiempo,
                cálculo de varianza muestral y umbrales de desviación para prever tensiones de liquidez antes de que ocurran.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

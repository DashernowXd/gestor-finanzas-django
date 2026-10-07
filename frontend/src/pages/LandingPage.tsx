interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void
  onGoToDashboard: () => void
  isAuthenticated: boolean
}

export function LandingPage({
  onOpenAuth,
  onGoToDashboard,
  isAuthenticated,
}: LandingPageProps) {
  return (
    <main className="flex-grow">
      {/* Hero Asimétrico (7/5 Desktop Grid) */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-14 pb-20 border-b border-paper-hairline" id="manifiesto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Manifiesto & Acciones (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 pt-4">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sage-forest animate-pulse"></span>
              <span className="text-label-sm font-label-sm text-slate uppercase tracking-wider">
                METODOLOGÍA CONTABLE DELIBERADA
              </span>
            </div>

            <h1 className="text-headline-lg font-headline-lg text-primary max-w-xl text-balance">
              Control financiero deliberado, sin artificios.
            </h1>

            <p className="text-body-lg font-body-lg text-on-surface-variant max-w-xl leading-relaxed">
              Un sistema personal concebido para quienes valoran la precisión sobre la simulación.
              Al distribuir cada flujo de caja exclusivamente en cuatro sobres esenciales —
              <strong className="text-primary font-semibold">Alimentos</strong>,{' '}
              <strong className="text-primary font-semibold">Servicios</strong>,{' '}
              <strong className="text-primary font-semibold">Ocio</strong> y{' '}
              <strong className="text-primary font-semibold">Salario</strong>— obtienes solvencia
              inmediata, disciplina de gasto y absoluta claridad mental.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5">
              {isAuthenticated ? (
                <button
                  onClick={onGoToDashboard}
                  className="bg-primary-container text-on-primary px-6 py-3 rounded-lg text-body-md font-body-md font-medium border border-paper-hairline shadow-sm hover:bg-primary btn-tactile text-center flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  <span>Abrir Mi Libro Mayor</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuth('register')}
                  className="bg-primary-container text-on-primary px-6 py-3 rounded-lg text-body-md font-body-md font-medium border border-paper-hairline shadow-sm hover:bg-primary btn-tactile text-center flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  <span>Comenzar Registro</span>
                </button>
              )}

              <div className="text-label-sm font-label-sm text-slate flex flex-col justify-center">
                <span>Precisión decimal estricta · Base Kakebo</span>
                <span className="text-outline">Demo técnica y de portafolio sin fines comerciales</span>
              </div>
            </div>

            <div className="pt-6 border-t border-paper-hairline max-w-lg">
              <div className="grid grid-cols-3 gap-4 text-left">
                <div>
                  <span className="text-label-sm font-label-sm text-slate block uppercase">
                    ESTRUCTURA
                  </span>
                  <span className="text-body-sm font-body-sm font-medium text-primary">
                    Cuatro Sobres
                  </span>
                </div>
                <div>
                  <span className="text-label-sm font-label-sm text-slate block uppercase">
                    ARQUITECTURA
                  </span>
                  <span className="text-body-sm font-body-sm font-medium text-primary">
                    Cálculo en DB
                  </span>
                </div>
                <div>
                  <span className="text-label-sm font-label-sm text-slate block uppercase">
                    SOBERANÍA
                  </span>
                  <span className="text-body-sm font-body-sm font-medium text-primary">
                    Exportación CSV
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Physical Ledger Preview Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-cardstock rounded-xl border border-paper-hairline p-6 shadow-md relative">
              {/* Ledger Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-paper-hairline">
                <div>
                  <span className="text-label-sm font-label-sm text-slate block">
                    VISTA PREVIA DEL LIBRO
                  </span>
                  <h2 className="text-body-sm font-body-sm font-semibold text-primary">
                    BALANCE GENERAL · PERÍODO ACTUAL
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-label-sm font-label-sm text-slate block">
                    ESTADO CONTABLE
                  </span>
                  <span className="text-label-sm font-label-sm font-semibold text-sage-forest bg-secondary-fixed/40 px-2 py-0.5 rounded">
                    ENLACE ACTIVO
                  </span>
                </div>
              </div>

              {/* Totals Metrics Row (3-split) */}
              <div className="grid grid-cols-3 gap-2 py-5 border-b border-paper-hairline text-left">
                <div>
                  <span className="text-label-sm font-label-sm text-slate block">Ingreso Total</span>
                  <span className="text-ledger-num font-ledger-num text-sage-forest font-semibold block mt-0.5 tabular-nums">
                    +$3,850.00
                  </span>
                </div>
                <div className="border-l border-paper-hairline pl-3">
                  <span className="text-label-sm font-label-sm text-slate block">Egresos</span>
                  <span className="text-ledger-num font-ledger-num text-muted-terracotta font-semibold block mt-0.5 tabular-nums">
                    -$2,140.00
                  </span>
                </div>
                <div className="border-l border-paper-hairline pl-3">
                  <span className="text-label-sm font-label-sm text-slate block">Neto Disponible</span>
                  <span className="text-ledger-num font-ledger-num text-primary font-bold block mt-0.5 tabular-nums">
                    $1,710.00
                  </span>
                </div>
              </div>

              {/* Canon Category Allocations Breakdown */}
              <div className="pt-4 pb-2">
                <span className="text-label-sm font-label-sm text-slate uppercase tracking-wider block mb-3">
                  Distribución por Sobres Canónicos
                </span>
                <div className="space-y-3">
                  {/* Salario */}
                  <div>
                    <div className="flex justify-between text-body-sm font-body-sm mb-1">
                      <span className="font-medium text-primary">Salario Neto</span>
                      <span className="font-ledger-num text-sage-forest tabular-nums">+$3,850.00</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div className="bg-sage-forest h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <div className="flex justify-between text-label-sm font-label-sm text-outline mt-0.5">
                      <span>Flujo principal</span>
                      <span>100% asignado</span>
                    </div>
                  </div>

                  {/* Alimentos */}
                  <div>
                    <div className="flex justify-between text-body-sm font-body-sm mb-1">
                      <span className="font-medium text-primary">Alimentos</span>
                      <span className="font-ledger-num text-muted-terracotta tabular-nums">-$680.00</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-muted-terracotta h-1.5 rounded-full"
                        style={{ width: '85%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-label-sm font-label-sm text-outline mt-0.5">
                      <span>Presupuesto base</span>
                      <span>31.7% del gasto</span>
                    </div>
                  </div>

                  {/* Servicios */}
                  <div>
                    <div className="flex justify-between text-body-sm font-body-sm mb-1">
                      <span className="font-medium text-primary">Servicios Básicos</span>
                      <span className="font-ledger-num text-muted-terracotta tabular-nums">-$940.00</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-muted-terracotta h-1.5 rounded-full"
                        style={{ width: '95%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-label-sm font-label-sm text-outline mt-0.5">
                      <span>Vivienda y red</span>
                      <span>43.9% del gasto</span>
                    </div>
                  </div>

                  {/* Ocio */}
                  <div>
                    <div className="flex justify-between text-body-sm font-body-sm mb-1">
                      <span className="font-medium text-primary">Ocio Medido</span>
                      <span className="font-ledger-num text-slate tabular-nums">-$520.00</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div className="bg-slate h-1.5 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <div className="flex justify-between text-label-sm font-label-sm text-outline mt-0.5">
                      <span>Recreación deliberada</span>
                      <span>24.3% del gasto</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action trigger button */}
              <div className="pt-4 border-t border-paper-hairline">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="w-full py-2 bg-surface-container-low hover:bg-surface-container text-primary rounded text-label-sm font-label-sm font-medium border border-paper-hairline transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Ver Mi Libro Contable</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 border-b border-paper-hairline" id="principios">
        <div className="flex items-center space-x-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          <span className="text-label-sm font-label-sm text-slate uppercase tracking-wider">
            FUNDAMENTOS ARQUITECTÓNICOS
          </span>
        </div>
        <h2 className="text-headline-md font-headline-md text-primary mb-8 max-w-xl">
          Tres principios para una contabilidad honesta y deliberada
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-cardstock border border-paper-hairline rounded-lg p-6 shadow-2xs">
            <span className="material-symbols-outlined text-secondary text-[28px] mb-3">shield</span>
            <h3 className="text-headline-sm font-headline-sm text-primary mb-2">
              1. Aislamiento Estricto
            </h3>
            <p className="text-body-sm font-body-sm text-slate leading-relaxed">
              Cada usuario posee exclusivamente su espacio de trabajo y sus sobres canónicos. Ningún
              dato se filtra ni se comparte entre cuentas. Privacidad y soberanía garantizadas por diseño.
            </p>
          </div>

          <div className="bg-cardstock border border-paper-hairline rounded-lg p-6 shadow-2xs">
            <span className="material-symbols-outlined text-sage-forest text-[28px] mb-3">database</span>
            <h3 className="text-headline-sm font-headline-sm text-primary mb-2">
              2. Precisión Decimal en DB
            </h3>
            <p className="text-body-sm font-body-sm text-slate leading-relaxed">
              Sin errores de redondeo en punto flotante. Los balances, agregaciones y porcentajes se
              procesan con SQL nativo en PostgreSQL y SQLite con el tipo <code>DecimalField</code>.
            </p>
          </div>

          <div className="bg-cardstock border border-paper-hairline rounded-lg p-6 shadow-2xs">
            <span className="material-symbols-outlined text-primary text-[28px] mb-3">folder_open</span>
            <h3 className="text-headline-sm font-headline-sm text-primary mb-2">
              3. Metodología Kakebo
            </h3>
            <p className="text-body-sm font-body-sm text-slate leading-relaxed">
              La dispersión de decenas de categorías genera abandono. Cuatro sobres esenciales
              permiten tomar decisiones inmediatas sin fatiga de registro diario.
            </p>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16" id="metodologia">
        <div className="bg-surface-container-low border border-paper-hairline rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl">
            <span className="text-label-sm font-label-sm text-sage-forest uppercase tracking-wider font-semibold">
              LOS CUATRO SOBRES CANÓNICOS
            </span>
            <h2 className="text-headline-md font-headline-md text-primary mt-2 mb-4">
              Estructura canónica de flujo de caja
            </h2>
            <p className="text-body-md font-body-md text-slate leading-relaxed mb-6">
              El método Kakebo clasifica las finanzas en sobres físicos o conceptuales para
              disciplinar el flujo mensual:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-cardstock border border-paper-hairline rounded-lg">
                <span className="text-label-sm font-label-sm text-sage-forest font-semibold block">01 · SALARIO</span>
                <p className="text-body-sm text-slate mt-1">
                  Nómina mensual, ingresos fijos o ingresos profesionales consolidados. Es la fuente que llena los sobres.
                </p>
              </div>
              <div className="p-4 bg-cardstock border border-paper-hairline rounded-lg">
                <span className="text-label-sm font-label-sm text-muted-terracotta font-semibold block">02 · ALIMENTOS</span>
                <p className="text-body-sm text-slate mt-1">
                  Supervivencia básica: despensa, productos frescos y nutrición diaria sin concesiones superfluas.
                </p>
              </div>
              <div className="p-4 bg-cardstock border border-paper-hairline rounded-lg">
                <span className="text-label-sm font-label-sm text-muted-terracotta font-semibold block">03 · SERVICIOS</span>
                <p className="text-body-sm text-slate mt-1">
                  Gastos fijos inevitables: electricidad, agua, conectividad, vivienda y herramientas operativas.
                </p>
              </div>
              <div className="p-4 bg-cardstock border border-paper-hairline rounded-lg">
                <span className="text-label-sm font-label-sm text-slate font-semibold block">04 · OCIO MEDIDO</span>
                <p className="text-body-sm text-slate mt-1">
                  Cultura, gastronomía recreativa y placeres deliberados con límite estricto para proteger el ahorro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface NavbarProps {
  currentView: 'landing' | 'dashboard'
  onNavigate: (view: 'landing' | 'dashboard') => void
  onOpenAuth: (mode?: 'login' | 'register') => void
  onOpenNewTransaction?: () => void
  onExportCsv?: () => void
  onSync?: () => void
  isSyncing?: boolean
  onOpenAccountSettings?: (tab?: 'profile' | 'security' | 'danger') => void
  activeTab?: 'ledger' | 'forecast'
  onSelectTab?: (tab: 'ledger' | 'forecast') => void
}

export function Navbar({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenNewTransaction,
  onExportCsv,
  onSync,
  isSyncing,
  onOpenAccountSettings,
  activeTab = 'ledger',
  onSelectTab,
}: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AT'

  return (
    <header className="w-full border-b border-paper-hairline bg-surface px-6 md:px-12 py-3 flex justify-between items-center max-w-full sticky top-0 z-40 backdrop-blur-xs">
      {/* Left brand area */}
      <div className="flex items-center space-x-6">
        <div className="flex items-baseline space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
          <span className="text-headline-sm font-headline-sm tracking-tight text-primary uppercase font-bold">
            {currentView === 'dashboard' ? 'ATELIER / LIBRO MAYOR' : 'Atelier Finanzas'}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 border border-paper-hairline rounded text-label-sm font-label-sm text-slate bg-surface-container-low">
            {currentView === 'dashboard' ? 'v1.0 • BD CONECTADA' : 'LIBRO v1.0'}
          </span>
        </div>

        {/* Navigation links */}
        {currentView === 'landing' ? (
          <nav className="hidden md:flex items-center space-x-6 pl-4 border-l border-paper-hairline">
            <a
              href="#principios"
              className="text-primary font-medium border-b border-primary pb-0.5 text-body-sm font-body-sm btn-tactile"
            >
              Principios
            </a>
            <a
              href="#metodologia"
              className="text-on-surface-variant hover:text-primary transition-colors text-body-sm font-body-sm btn-tactile"
            >
              Metodología
            </a>
            <a
              href="#manifiesto"
              className="text-on-surface-variant hover:text-primary transition-colors text-body-sm font-body-sm btn-tactile"
            >
              Manifiesto
            </a>
            {isAuthenticated && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-sage-forest font-semibold hover:underline text-body-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                <span>Ir al Dashboard</span>
              </button>
            )}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center space-x-5 pl-4 border-l border-paper-hairline">
            <button
              onClick={() => {
                if (onSelectTab) onSelectTab('ledger')
                onNavigate('dashboard')
              }}
              className={`font-headline-sm text-body-sm font-medium pb-0.5 transition-colors cursor-pointer ${
                activeTab === 'ledger'
                  ? 'text-primary border-b border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Libro Diario
            </button>
            <button
              onClick={() => {
                if (onSelectTab) onSelectTab('forecast')
                onNavigate('dashboard')
              }}
              className={`font-headline-sm text-body-sm font-medium pb-0.5 transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'forecast'
                  ? 'text-primary border-b border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">query_stats</span>
              <span>Predicciones (Python OLS)</span>
            </button>
            <button
              onClick={() => onNavigate('landing')}
              className="text-on-surface-variant pb-0.5 font-headline-sm text-body-sm hover:text-primary transition-colors cursor-pointer"
            >
              Metodología Kakebo
            </button>
          </nav>
        )}
      </div>

      {/* Right control buttons */}
      <div className="flex items-center space-x-3">
        {currentView === 'dashboard' ? (
          <>
            {/* Period pill */}
            <div className="hidden lg:flex items-center border border-paper-hairline rounded bg-cardstock px-2.5 py-1 space-x-2 text-label-sm font-label-sm">
              <span className="font-semibold text-primary px-1">Período Activo 2026</span>
              <span className="h-3 w-px bg-paper-hairline"></span>
              <span className="inline-flex items-center text-[10px] tracking-wider font-semibold text-secondary px-1.5 py-0.5 rounded bg-secondary-fixed/40">
                ABIERTO
              </span>
            </div>

            {/* Sync trigger */}
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                title="Sincronizar base de datos"
                className={`p-1.5 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant btn-tactile ${
                  isSyncing ? 'animate-spin text-sage-forest' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
              </button>
            )}

            {/* Export CSV button */}
            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="hidden sm:inline-flex items-center space-x-1.5 border border-paper-hairline bg-cardstock hover:bg-surface-container-high px-3 py-1.5 rounded text-label-sm font-label-sm text-primary transition-colors btn-tactile"
              >
                <span className="material-symbols-outlined text-[15px]">file_download</span>
                <span>Exportar CSV</span>
              </button>
            )}

            {/* New transaction button */}
            {onOpenNewTransaction && (
              <button
                onClick={onOpenNewTransaction}
                className="inline-flex items-center space-x-1.5 bg-primary-container hover:bg-primary text-on-primary px-3.5 py-1.5 rounded text-label-sm font-label-sm font-medium shadow-none btn-tactile transition-all"
              >
                <span>+ Asentar Transacción</span>
              </button>
            )}

            {/* User Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded border border-paper-hairline bg-surface-container flex items-center justify-center text-label-sm font-label-sm text-slate uppercase font-semibold hover:border-primary transition-colors"
                title={user?.email || 'Perfil'}
              >
                {userInitials}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-cardstock border border-paper-hairline rounded-lg shadow-xl py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-paper-hairline text-label-sm">
                    <p className="font-semibold text-primary truncate">{user?.username || 'Usuario'}</p>
                    <p className="text-slate text-[11px] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      if (onOpenAccountSettings) onOpenAccountSettings('profile')
                    }}
                    className="w-full text-left px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate">manage_accounts</span>
                    <span>Perfil y Ajustes de Cuenta</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      if (onOpenAccountSettings) onOpenAccountSettings('security')
                    }}
                    className="w-full text-left px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate">lock_reset</span>
                    <span>Cambiar Contraseña</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      onNavigate('landing')
                    }}
                    className="w-full text-left px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-slate">menu_book</span>
                    <span>Ver Manifiesto</span>
                  </button>
                  <div className="my-1 border-t border-paper-hairline"></div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      if (onOpenAccountSettings) onOpenAccountSettings('danger')
                    }}
                    className="w-full text-left px-4 py-2 text-body-sm text-muted-terracotta hover:bg-error-container/30 transition-colors flex items-center gap-2 font-medium"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    <span>Eliminar Cuenta</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      logout()
                      onNavigate('landing')
                    }}
                    className="w-full text-left px-4 py-2 text-body-sm text-slate hover:bg-surface-container transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="bg-primary-container text-on-primary hover:bg-primary px-4 py-2 rounded-lg text-body-sm font-body-sm font-medium border border-paper-hairline shadow-xs btn-tactile flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  <span>Mi Libro Mayor</span>
                </button>
                {onOpenAccountSettings && (
                  <button
                    onClick={() => onOpenAccountSettings('profile')}
                    className="border border-paper-hairline bg-cardstock hover:bg-surface-container px-3 py-1.5 rounded-lg text-body-sm text-slate hover:text-primary transition-colors flex items-center gap-1.5 btn-tactile"
                    title="Ajustes de cuenta"
                  >
                    <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                    <span className="hidden sm:inline">Cuenta</span>
                  </button>
                )}
                <button
                  onClick={logout}
                  className="text-body-sm text-slate hover:text-muted-terracotta transition-colors px-2 py-1"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 btn-tactile"
                >
                  Acceder
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="bg-primary-container text-on-primary hover:bg-primary px-4 py-2 rounded-lg text-body-sm font-body-sm font-medium border border-paper-hairline shadow-xs btn-tactile transition-all"
                >
                  Comenzar Libro
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  )
}

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { AuthModal } from './components/auth/AuthModal'
import { AccountSettingsModal } from './components/account/AccountSettingsModal'

function AppContent() {
  const { isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>(() => {
    return isAuthenticated ? 'dashboard' : 'landing'
  })
  const [dashboardTab, setDashboardTab] = useState<'ledger' | 'forecast'>('ledger')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [accountModalTab, setAccountModalTab] = useState<'profile' | 'security' | 'danger'>('profile')
  const [accountDeletedNotice, setAccountDeletedNotice] = useState<string | null>(null)

  // When user logs in, automatically switch to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('dashboard')
      setAccountDeletedNotice(null)
    } else {
      setCurrentView('landing')
    }
  }, [isAuthenticated])

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const handleOpenNewTx = () => {
    const btn = document.getElementById('btn-open-new-tx')
    if (btn) btn.click()
  }

  const handleExportCsv = () => {
    const btn = document.getElementById('btn-export-csv')
    if (btn) btn.click()
  }

  const handleSync = () => {
    const btn = document.getElementById('btn-sync-all')
    if (btn) btn.click()
  }

  const handleOpenAccountSettings = (tab: 'profile' | 'security' | 'danger' = 'profile') => {
    setAccountModalTab(tab)
    setAccountModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-body-md text-on-surface bg-mineral-grid">
      {/* Account Deletion Confirmation Banner */}
      {accountDeletedNotice && (
        <div className="bg-muted-terracotta/15 border-b border-muted-terracotta/40 px-6 py-3 flex items-center justify-between text-body-sm text-primary">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-muted-terracotta text-[20px]">
              check_circle
            </span>
            <span>{accountDeletedNotice}</span>
          </div>
          <button
            onClick={() => setAccountDeletedNotice(null)}
            className="text-xs uppercase font-bold text-slate hover:text-primary transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        activeTab={dashboardTab}
        onSelectTab={(tab) => setDashboardTab(tab)}
        onNavigate={(view) => {
          if (view === 'dashboard' && !isAuthenticated) {
            handleOpenAuth('login')
          } else {
            setCurrentView(view)
          }
        }}
        onOpenAuth={handleOpenAuth}
        onOpenNewTransaction={handleOpenNewTx}
        onExportCsv={handleExportCsv}
        onSync={handleSync}
        onOpenAccountSettings={handleOpenAccountSettings}
      />

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {currentView === 'landing' ? (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onGoToDashboard={() => setCurrentView('dashboard')}
            isAuthenticated={isAuthenticated}
          />
        ) : (
          <DashboardPage
            onOpenAccountSettings={() => handleOpenAccountSettings('profile')}
            activeViewTab={dashboardTab}
            onTabChange={(tab) => setDashboardTab(tab)}
          />
        )}
      </div>

      {/* Shared Footer */}
      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* Account Settings & Control Modal */}
      <AccountSettingsModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        initialTab={accountModalTab}
        onAccountDeleted={() => {
          setAccountModalOpen(false)
          setAccountDeletedNotice(
            'Tu cuenta y todos tus datos contables han sido eliminados de manera permanente del sistema.'
          )
          setCurrentView('landing')
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}

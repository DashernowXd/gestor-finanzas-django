import React, { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="bg-cardstock border border-paper-hairline rounded-xl p-8 max-w-lg shadow-xl text-center">
            <span className="material-symbols-outlined text-muted-terracotta text-[48px] mb-3">
              warning
            </span>
            <h1 className="text-headline-sm font-headline-sm text-primary mb-2">
              Algo inesperado ocurrió
            </h1>
            <p className="text-body-sm text-slate mb-6">
              {this.state.error?.message || 'Error en la renderización del componente.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary text-on-primary rounded text-label-sm font-semibold tracking-wide btn-tactile hover:bg-primary-container"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { useAuth } from '../../context/AuthContext'
import { formatApiError } from '../../services/api'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register, isLoading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showTermsDetail, setShowTermsDetail] = useState(false)

  const resetForm = () => {
    setError(null)
    setEmail('')
    setUsername('')
    setPassword('')
    setPasswordConfirm('')
    setAcceptedTerms(false)
    setShowTermsDetail(false)
  }

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setError(null)
    setMode(newMode)
    setAcceptedTerms(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico.')
      return
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña.')
      return
    }

    if (mode === 'register') {
      if (!acceptedTerms) {
        setError('Debes aceptar la cláusula de uso demostrativo sin fines de lucro para continuar.')
        return
      }
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.')
        return
      }
      if (password !== passwordConfirm) {
        setError('Las contraseñas no coinciden.')
        return
      }

      try {
        await register({
          email: email.trim().toLowerCase(),
          password,
          password_confirm: passwordConfirm,
          username: username.trim() || undefined,
        })
        resetForm()
        onClose()
      } catch (err) {
        setError(formatApiError(err))
      }
    } else {
      try {
        await login({
          email: email.trim().toLowerCase(),
          password,
        })
        resetForm()
        onClose()
      } catch (err) {
        setError(formatApiError(err))
      }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm()
        onClose()
      }}
      title={mode === 'login' ? 'INICIO DE SESIÓN · ATELIER' : 'REGISTRO DE USUARIO · ATELIER'}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4">
        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1 bg-surface-container-low border border-paper-hairline rounded">
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`py-1.5 text-label-sm font-label-sm font-semibold rounded transition-all btn-tactile ${
              mode === 'login'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-slate hover:text-primary'
            }`}
          >
            INICIAR SESIÓN
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`py-1.5 text-label-sm font-label-sm font-semibold rounded transition-all btn-tactile ${
              mode === 'register'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-slate hover:text-primary'
            }`}
          >
            CREAR CUENTA
          </button>
        </div>

        {/* Error notification banner */}
        {error && (
          <div
            role="alert"
            className="p-3 bg-error-container/40 border border-muted-terracotta/40 rounded text-muted-terracotta text-body-sm font-body-sm flex items-start gap-2"
          >
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-muted-terracotta">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label
              htmlFor="auth-email"
              className="block text-label-sm font-label-sm text-slate mb-1"
            >
              CORREO ELECTRÓNICO
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-3 py-2 bg-surface-container-low border border-paper-hairline rounded text-body-sm font-body-sm text-primary placeholder:text-slate/50 focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
            />
          </div>

          {/* Username (Register only) */}
          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-username"
                className="block text-label-sm font-label-sm text-slate mb-1"
              >
                NOMBRE DE USUARIO <span className="text-slate/60">(OPCIONAL)</span>
              </label>
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. kakebo_user"
                className="w-full px-3 py-2 bg-surface-container-low border border-paper-hairline rounded text-body-sm font-body-sm text-primary placeholder:text-slate/50 focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
              />
            </div>
          )}

          {/* Password field */}
          <div>
            <label
              htmlFor="auth-password"
              className="block text-label-sm font-label-sm text-slate mb-1"
            >
              CONTRASEÑA {mode === 'register' && <span className="text-slate/60">(MÍN. 8 CARACTERES)</span>}
            </label>
            <input
              id="auth-password"
              type="password"
              required
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-surface-container-low border border-paper-hairline rounded text-body-sm font-body-sm text-primary placeholder:text-slate/50 focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
            />
          </div>

          {/* Password Confirm (Register only) */}
          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-password-confirm"
                className="block text-label-sm font-label-sm text-slate mb-1"
              >
                CONFIRMAR CONTRASEÑA
              </label>
              <input
                id="auth-password-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-surface-container-low border border-paper-hairline rounded text-body-sm font-body-sm text-primary placeholder:text-slate/50 focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
              />
            </div>
          )}

          {/* Info note for register */}
          {mode === 'register' && (
            <>
              <div className="p-2.5 bg-secondary-fixed/20 border border-secondary/20 rounded text-body-sm text-sage-forest flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">check_circle</span>
                <p className="text-[12px] leading-tight">
                  Al registrarte se crearán automáticamente tus 4 sobres canónicos: <strong>Alimentos</strong>, <strong>Servicios</strong>, <strong>Ocio</strong> y <strong>Salario</strong>.
                </p>
              </div>

              {/* Cláusula de uso demostrativo sin fines de lucro */}
              <div className="p-3 bg-surface-container-low border border-paper-hairline rounded space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <input
                    id="auth-terms"
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-paper-hairline text-primary focus:ring-0 cursor-pointer accent-primary"
                  />
                  <label
                    htmlFor="auth-terms"
                    className="text-[12px] leading-snug text-on-surface cursor-pointer select-none"
                  >
                    Acepto la <strong>cláusula de uso demostrativo</strong>: reconozco que esta aplicación es una <strong>demo sin fines de lucro</strong> y que los datos registrados no serán utilizados para ningún fin ajeno a demostrar la funcionalidad técnica de la app.
                  </label>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-paper-hairline/60 text-[11px] text-slate">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-sage-forest">verified_user</span>
                    Demo educativa y de portafolio
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTermsDetail(!showTermsDetail)}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    {showTermsDetail ? 'Ocultar términos' : 'Ver cláusula completa'}
                  </button>
                </div>

                {showTermsDetail && (
                  <div className="pt-2 text-[11px] leading-relaxed text-slate border-t border-paper-hairline space-y-1.5 animate-in fade-in">
                    <p>
                      <strong>1. Naturaleza sin fines de lucro:</strong> Atelier Finanzas es un proyecto de demostración técnica de portafolio de software, creado sin fines comerciales ni ánimo de lucro.
                    </p>
                    <p>
                      <strong>2. Destino exclusivo de los datos:</strong> Toda la información ingresada (correos electrónicos, nombres y asientos contables) se almacena y procesa exclusivamente para comprobar y exhibir las capacidades del motor de base de datos y la interfaz web.
                    </p>
                    <p>
                      <strong>3. Prohibición de explotación ajena:</strong> Ningún dato será vendido, cedido, monetizado, perfilado ni empleado para actividades publicitarias o comerciales.
                    </p>
                    <p>
                      <strong>4. Entorno de pruebas:</strong> No se debe registrar información bancaria auténtica sensible ni contraseñas bancarias reales.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || (mode === 'register' && !acceptedTerms)}
              className="w-full py-2.5 px-4 bg-primary text-on-primary rounded text-label-sm font-label-sm font-semibold tracking-wide btn-tactile hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Procesando...</span>
              ) : mode === 'login' ? (
                <>
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  <span>Acceder al Libro Mayor</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>Crear Cuenta y Comenzar</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate font-label-sm mt-2">
              {mode === 'login'
                ? 'Acceso seguro con token de sesión encriptado'
                : 'Aislamiento multi-inquilino estricto en base de datos'}
            </p>
          </div>
        </form>
      </div>
    </Modal>
  )
}

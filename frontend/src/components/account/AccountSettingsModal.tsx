import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { useAuth } from '../../context/AuthContext'
import { api, formatApiError } from '../../services/api'
import type { UserProfile } from '../../types'

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccountDeleted?: () => void
  initialTab?: TabType
}

type TabType = 'profile' | 'security' | 'danger'

export function AccountSettingsModal({
  isOpen,
  onClose,
  onAccountDeleted,
  initialTab = 'profile',
}: AccountSettingsModalProps) {
  const { user, updateUser, deleteAccount } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [updatingUsername, setUpdatingUsername] = useState(false)
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Security (password) state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Danger zone (delete account) state
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeCheckbox, setAgreeCheckbox] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Fetch profile details when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingProfile(true)
      setProfileError(null)
      api.auth
        .getProfile()
        .then((data) => {
          setProfile(data)
          setUsernameInput(data.username)
        })
        .catch((err) => {
          setProfileError(formatApiError(err))
        })
        .finally(() => {
          setLoadingProfile(false)
        })
    } else {
      // Reset notices
      setUsernameSuccess(null)
      setPasswordSuccess(null)
      setPasswordError(null)
      setDeleteError(null)
      setConfirmPassword('')
      setAgreeCheckbox(false)
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  // Handle username update
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setUsernameSuccess(null)

    if (!usernameInput.trim()) {
      setProfileError('El nombre de usuario no puede estar vacío.')
      return
    }

    setUpdatingUsername(true)
    try {
      const updated = await api.auth.updateProfile({ username: usernameInput.trim() })
      setProfile((prev) => (prev ? { ...prev, username: updated.username } : null))
      updateUser({
        id: updated.id,
        email: updated.email,
        username: updated.username,
      })
      setUsernameSuccess('Nombre de usuario actualizado exitosamente.')
      setTimeout(() => setUsernameSuccess(null), 3500)
    } catch (err) {
      setProfileError(formatApiError(err))
    } finally {
      setUpdatingUsername(false)
    }
  }

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword !== newPasswordConfirm) {
      setPasswordError('Las nuevas contraseñas no coinciden.')
      return
    }

    setChangingPassword(true)
    try {
      await api.auth.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      })
      setPasswordSuccess('Contraseña cambiada exitosamente.')
      setOldPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
      setTimeout(() => setPasswordSuccess(null), 3500)
    } catch (err) {
      setPasswordError(formatApiError(err))
    } finally {
      setChangingPassword(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteError(null)

    if (!agreeCheckbox) {
      setDeleteError('Debes marcar la casilla reconociendo la destrucción definitiva de los datos.')
      return
    }

    if (!confirmPassword) {
      setDeleteError('Por favor ingresa tu contraseña para confirmar tu identidad.')
      return
    }

    setDeleting(true)
    try {
      await deleteAccount(confirmPassword)
      onClose()
      if (onAccountDeleted) {
        onAccountDeleted()
      }
    } catch (err) {
      setDeleteError(formatApiError(err))
      setDeleting(false)
    }
  }

  const formattedDate = profile?.date_joined
    ? new Date(profile.date_joined).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No disponible'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CONTROL DE CUENTA · AJUSTES DEL TITULAR"
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 p-1 bg-surface-container-low border border-paper-hairline rounded text-label-sm font-label-sm">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 px-2 font-semibold rounded flex items-center justify-center gap-1.5 transition-all btn-tactile ${
              activeTab === 'profile'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-slate hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_circle</span>
            <span>Perfil & Datos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-1.5 px-2 font-semibold rounded flex items-center justify-center gap-1.5 transition-all btn-tactile ${
              activeTab === 'security'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-slate hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">lock_reset</span>
            <span>Seguridad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`py-1.5 px-2 font-semibold rounded flex items-center justify-center gap-1.5 transition-all btn-tactile ${
              activeTab === 'danger'
                ? 'bg-muted-terracotta text-white shadow-xs'
                : 'text-muted-terracotta hover:bg-error-container/30'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">delete_forever</span>
            <span>Eliminar Cuenta</span>
          </button>
        </div>

        {/* TAB 1: PERFIL & MÉTRICAS */}
        {activeTab === 'profile' && (
          <div className="space-y-4 pt-1">
            {profileError && (
              <div
                role="alert"
                className="p-3 bg-error-container/40 border border-muted-terracotta/40 rounded text-muted-terracotta text-body-sm flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <span>{profileError}</span>
              </div>
            )}

            {usernameSuccess && (
              <div
                role="status"
                className="p-3 bg-secondary-fixed/40 border border-secondary/40 rounded text-sage-forest text-body-sm flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <span>{usernameSuccess}</span>
              </div>
            )}

            {/* Email (Readonly) */}
            <div>
              <label className="block text-label-sm font-label-sm text-slate mb-1">
                CORREO ELECTRÓNICO (IDENTIFICADOR PRINCIPAL)
              </label>
              <div className="flex items-center justify-between px-3 py-2 bg-surface-container border border-paper-hairline rounded text-body-sm text-on-surface">
                <span className="font-mono text-[13px]">{user?.email}</span>
                <span className="text-[11px] text-slate bg-cardstock border border-paper-hairline px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  Inmutable
                </span>
              </div>
            </div>

            {/* Username Form */}
            <form onSubmit={handleUpdateUsername} className="space-y-3">
              <div>
                <label
                  htmlFor="profile-username"
                  className="block text-label-sm font-label-sm text-slate mb-1"
                >
                  NOMBRE DE USUARIO / ALIAS
                </label>
                <div className="flex gap-2">
                  <input
                    id="profile-username"
                    type="text"
                    required
                    maxLength={150}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-surface-container-low border border-paper-hairline rounded text-body-sm text-primary focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={updatingUsername || usernameInput.trim() === user?.username}
                    className="px-4 py-1.5 bg-primary text-on-primary rounded text-label-sm font-semibold tracking-wide btn-tactile disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-container transition-all"
                  >
                    {updatingUsername ? 'Guardando...' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </form>

            {/* Account Metadata / Statistics Strip */}
            <div className="pt-2 border-t border-paper-hairline">
              <span className="text-label-sm font-label-sm text-slate uppercase tracking-wider block mb-2.5">
                ESTADÍSTICAS DEL LIBRO CONTABLE
              </span>
              <div className="grid grid-cols-3 gap-2 text-left">
                <div className="p-2.5 bg-surface-container-low border border-paper-hairline rounded">
                  <span className="text-label-sm font-label-sm text-slate block">ALTA CONTABLE</span>
                  <span className="text-[12px] font-medium text-primary block mt-0.5">
                    {loadingProfile ? '...' : formattedDate}
                  </span>
                </div>
                <div className="p-2.5 bg-surface-container-low border border-paper-hairline rounded">
                  <span className="text-label-sm font-label-sm text-slate block">SOBRES ACTIVOS</span>
                  <span className="text-ledger-num font-ledger-num text-sage-forest font-semibold block mt-0.5">
                    {loadingProfile ? '...' : `${profile?.category_count ?? 4} Categorías`}
                  </span>
                </div>
                <div className="p-2.5 bg-surface-container-low border border-paper-hairline rounded">
                  <span className="text-label-sm font-label-sm text-slate block">TRANSACCIONES</span>
                  <span className="text-ledger-num font-ledger-num text-primary font-semibold block mt-0.5">
                    {loadingProfile ? '...' : `${profile?.transaction_count ?? 0} Asientos`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEGURIDAD & CONTRASEÑA */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
            {passwordError && (
              <div
                role="alert"
                className="p-3 bg-error-container/40 border border-muted-terracotta/40 rounded text-muted-terracotta text-body-sm flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div
                role="status"
                className="p-3 bg-secondary-fixed/40 border border-secondary/40 rounded text-sage-forest text-body-sm flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="sec-old-password"
                className="block text-label-sm font-label-sm text-slate mb-1"
              >
                CONTRASEÑA ACTUAL
              </label>
              <input
                id="sec-old-password"
                type="password"
                required
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-surface-container-low border border-paper-hairline rounded text-body-sm text-primary focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="sec-new-password"
                className="block text-label-sm font-label-sm text-slate mb-1"
              >
                NUEVA CONTRASEÑA <span className="text-slate/60">(MÍNIMO 8 CARACTERES)</span>
              </label>
              <input
                id="sec-new-password"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-surface-container-low border border-paper-hairline rounded text-body-sm text-primary focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="sec-confirm-password"
                className="block text-label-sm font-label-sm text-slate mb-1"
              >
                CONFIRMAR NUEVA CONTRASEÑA
              </label>
              <input
                id="sec-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-surface-container-low border border-paper-hairline rounded text-body-sm text-primary focus:bg-cardstock focus:border-primary focus:ring-0 transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 px-4 bg-primary text-on-primary rounded text-label-sm font-semibold tracking-wide btn-tactile hover:bg-primary-container disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                <span>{changingPassword ? 'Actualizando clave...' : 'Actualizar Contraseña'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ZONA CRÍTICA (ELIMINAR CUENTA) */}
        {activeTab === 'danger' && (
          <form onSubmit={handleDeleteAccount} className="space-y-4 pt-1">
            {/* Warning Box */}
            <div className="p-3.5 bg-error-container/30 border border-muted-terracotta/50 rounded space-y-2">
              <div className="flex items-center gap-2 text-muted-terracotta font-semibold text-body-sm">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                <span>ACCIÓN DESTRUCTIVA PERMANENTE</span>
              </div>
              <p className="text-[12px] leading-relaxed text-on-surface-variant">
                Al confirmar la eliminación, tu usuario será purgado permanentemente de la base de
                datos. <strong>Todos tus sobres canónicos y el historial íntegro de transacciones</strong> serán destruidos mediante una transacción SQL atómica irreversible.
              </p>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="p-3 bg-error-container/50 border border-muted-terracotta/60 rounded text-muted-terracotta text-body-sm flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <span>{deleteError}</span>
              </div>
            )}

            {/* Checkbox agreement */}
            <div className="p-3 bg-surface-container-low border border-paper-hairline rounded">
              <div className="flex items-start gap-2.5">
                <input
                  id="danger-agree"
                  type="checkbox"
                  required
                  checked={agreeCheckbox}
                  onChange={(e) => setAgreeCheckbox(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-paper-hairline text-muted-terracotta focus:ring-0 cursor-pointer accent-muted-terracotta"
                />
                <label
                  htmlFor="danger-agree"
                  className="text-[12px] leading-snug text-on-surface cursor-pointer select-none"
                >
                  Entiendo que esta acción <strong>no se puede deshacer</strong> y que perderé todo mi
                  historial contable Kakebo y configuración de sobres de forma definitiva.
                </label>
              </div>
            </div>

            {/* Password input for identity verification */}
            <div>
              <label
                htmlFor="danger-password"
                className="block text-label-sm font-label-sm text-slate mb-1"
              >
                CONFIRMA TU CONTRASEÑA PARA PROCEDER
              </label>
              <input
                id="danger-password"
                type="password"
                required
                autoComplete="current-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual..."
                className="w-full px-3 py-2 bg-surface-container-low border border-muted-terracotta/40 rounded text-body-sm text-primary focus:bg-cardstock focus:border-muted-terracotta focus:ring-0 transition-colors"
              />
            </div>

            {/* Destruction button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={deleting || !agreeCheckbox || !confirmPassword}
                className="w-full py-2.5 px-4 bg-muted-terracotta text-white rounded text-label-sm font-semibold tracking-wide btn-tactile hover:bg-muted-terracotta/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                <span>
                  {deleting ? 'Destruyendo cuenta y datos...' : 'Eliminar Mi Cuenta Permanentemente'}
                </span>
              </button>
              <p className="text-[11px] text-center text-slate font-label-sm mt-2">
                Limpieza atómica inmediata de registros y revocación de tokens JWT
              </p>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}

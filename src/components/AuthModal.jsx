import { useState } from 'react'
import { loginMember } from '../services/member.js'
import Modal from './ui/Modal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function AuthModal({ onClose, onSwitchToRegister }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const email = form.email.trim()
    const password = form.password
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('member.emailInvalid'))
    if (password.length < 6) return setError(t('auth.passwordTooShort'))
    setBusy(true)
    try {
      await loginMember(email, password)
      onClose()
    } catch {
      setError(t('auth.invalidCredentials'))
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="auth-modal-title">
      <div className="px-5 pt-[18px] pb-[22px]">
        <h3 id="auth-modal-title" className="text-[19px] font-extrabold leading-[1.3]">
          {t('auth.title')}
        </h3>
        <p className="mt-1 mb-3 text-[13px] text-rd-muted">{t('auth.subtitle')}</p>
        <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
          <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
            {t('auth.email')}
            <input
              className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
            {t('auth.password')}
            <input
              className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder={t('auth.passwordPlaceholder')}
              autoComplete="current-password"
            />
          </label>
          {error && <p className="text-[12.5px] font-bold text-rd">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? t('booking.processing') : t('auth.login')}
          </button>
        </form>
        {onSwitchToRegister && (
          <p className="mt-3 text-[12.5px] text-rd-muted">
            {t('auth.noAccount')}{' '}
            <button
              className="font-extrabold text-rd hover:underline"
              type="button"
              onClick={onSwitchToRegister}
            >
              {t('auth.goRegister')}
            </button>
          </p>
        )}
        <p className="mt-2 text-[12px] text-rd-muted">{t('auth.demoNote')}</p>
      </div>
    </Modal>
  )
}

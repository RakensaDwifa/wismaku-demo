import { useState } from 'react'
import {
  loginUser,
  registerUser,
  loginGoogle,
  loginFacebook,
  requestPasswordReset,
  verifyPasswordResetOtp,
} from '../services/member.js'
import Modal from './ui/Modal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Petakan kode error dari service ke pesan i18n. Kode tak dikenal -> pesan generik. */
const errorMessage = (error, t) => {
  const msg = (error?.message ?? '').toLowerCase()
  if (error?.code === 'OAUTH_NOT_CONFIGURED') return t('auth.oauthNotConfigured')
  if (error?.code === 'SUPABASE_NOT_CONFIGURED') return t('auth.cryptoUnavailable')
  if (error?.code === 'INVALID_CREDENTIALS') return t('auth.invalidCredentials')
  if (msg.includes('token') || msg.includes('otp') || msg.includes('expired')) {
    return t('auth.invalidOtp')
  }
  if (msg.includes('already') && msg.includes('registered')) return t('auth.emailTaken')
  if (msg.includes('invalid') && (msg.includes('credential') || msg.includes('login'))) {
    return t('auth.invalidCredentials')
  }
  if (error?.code === 'EMAIL_TAKEN') return t('auth.emailTaken')
  // Supabase mengembalikan pesan generik untuk kredensial salah; jangan bocorkan detail.
  return t('auth.invalidCredentials')
}

export default function AuthModal({ onClose, initialTab = 'login' }) {
  const { t } = useLanguage()
  const [tab, setTab] = useState(initialTab)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotStep, setForgotStep] = useState('email')
  const [otp, setOtp] = useState('')

  const fail = (message, field) => {
    setError(message)
    setErrorField(field)
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
    setErrorField('')
  }

  const switchTab = (next) => {
    setTab(next)
    setError('')
    setErrorField('')
    setResetSent(false)
    setShowPassword(false)
    setForgotStep('email')
    setOtp('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim()
    const password = form.password

    if (tab === 'forgot') {
      if (forgotStep === 'email') {
        if (!EMAIL_RE.test(email)) return fail(t('member.emailInvalid'), 'email')
        setBusy(true)
        try {
          await requestPasswordReset(email)
          setResetSent(true)
          setForgotStep('verify')
        } catch {
          // Jangan bocorkan apakah email terdaftar: tetap lanjutkan ke step verifikasi.
          setResetSent(true)
          setForgotStep('verify')
        } finally {
          setBusy(false)
        }
        return
      }

      // Step verifikasi OTP
      const cleanOtp = otp.trim()
      if (!/^\d{6,8}$/.test(cleanOtp)) return fail(t('auth.invalidOtp'), 'otp')
      if (password.length < 8) return fail(t('auth.passwordTooShort'), 'password')
      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return fail(t('auth.weakPassword'), 'password')
      }

      setBusy(true)
      try {
        await verifyPasswordResetOtp({ email, token: cleanOtp, password })
        onClose()
      } catch (err) {
        setError(errorMessage(err, t))
        setErrorField('otp')
      } finally {
        setBusy(false)
      }
      return
    }

    if (tab === 'register') {
      if (name.length < 3) return fail(t('member.nameTooShort'), 'name')
      if (!EMAIL_RE.test(email)) return fail(t('member.emailInvalid'), 'email')
      if (password.length < 8) return fail(t('auth.passwordTooShort'), 'password')
      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return fail(t('auth.weakPassword'), 'password')
      }
    } else {
      if (!EMAIL_RE.test(email)) return fail(t('member.emailInvalid'), 'email')
      // Login tidak memaksa 8 karakter: akun lama bisa punya password lebih pendek.
      if (!password) return fail(t('auth.passwordRequired'), 'password')
    }

    setBusy(true)
    try {
      if (tab === 'register') await registerUser({ name, email, password })
      else await loginUser(email, password)
      onClose()
    } catch (err) {
      setError(errorMessage(err, t))
      setErrorField(
        err?.code === 'INVALID_CREDENTIALS' ? 'password' : err?.code === 'EMAIL_TAKEN' ? 'email' : '',
      )
      setBusy(false)
    }
  }

  const inputCls =
    'rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none'

  return (
    <Modal onClose={onClose} labelledBy="auth-modal-title">
      <div className="px-5 pt-[18px] pb-[22px]">
        <div className="mb-4 flex rounded-[9px] bg-rd-soft p-1">
          <button
            className={`flex-1 rounded-[7px] py-2 text-[13.5px] font-extrabold transition-colors ${
              tab === 'login' ? 'bg-white text-rd shadow-sm' : 'text-rd-muted hover:text-rd-text'
            }`}
            type="button"
            onClick={() => switchTab('login')}
          >
            {t('auth.tabLogin')}
          </button>
          <button
            className={`flex-1 rounded-[7px] py-2 text-[13.5px] font-extrabold transition-colors ${
              tab === 'register' ? 'bg-white text-rd shadow-sm' : 'text-rd-muted hover:text-rd-text'
            }`}
            type="button"
            onClick={() => switchTab('register')}
          >
            {t('auth.tabRegister')}
          </button>
        </div>
        <h3 id="auth-modal-title" className="text-[19px] font-extrabold leading-[1.3]">
          {tab === 'login'
            ? t('auth.tabLogin')
            : tab === 'forgot'
              ? t('auth.forgotTitle')
              : t('auth.tabRegister')}
        </h3>
        {tab === 'forgot' && (
          <p className="mt-1 text-[13px] text-rd-muted">
            {forgotStep === 'email' ? t('auth.forgotDesc') : t('auth.resetOtpHint', { email: form.email })}
          </p>
        )}
        <form className="mt-3 flex flex-col gap-3" onSubmit={submit} noValidate>
          {tab === 'register' && (
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              {t('auth.name')}
              <input
                className={inputCls}
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder={t('auth.namePlaceholder')}
                autoComplete="name"
                aria-invalid={errorField === 'name'}
                aria-describedby={errorField === 'name' ? 'auth-modal-error' : undefined}
              />
            </label>
          )}

          {tab === 'forgot' && forgotStep === 'verify' ? (
            <>
              <div className="flex items-center justify-between rounded-[9px] bg-rd-soft px-3 py-2 text-[12.5px]">
                <span className="truncate text-rd-text">
                  <strong>{form.email}</strong>
                </span>
                <button
                  type="button"
                  className="ml-2 shrink-0 font-extrabold text-rd hover:underline"
                  onClick={() => {
                    setForgotStep('email')
                    setError('')
                    setErrorField('')
                    setResetSent(false)
                  }}
                >
                  {t('auth.resetChangeEmail')}
                </button>
              </div>

              <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
                {t('auth.resetOtpLabel')}
                <input
                  id="auth-otp"
                  className={inputCls}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))
                    setError('')
                    setErrorField('')
                  }}
                  placeholder={t('auth.resetOtpPlaceholder')}
                  aria-invalid={errorField === 'otp'}
                  aria-describedby={errorField === 'otp' ? 'auth-modal-error' : undefined}
                />
              </label>

              <div className="flex flex-col gap-[5px]">
                <label htmlFor="auth-password" className="text-[12.5px] font-bold text-rd-text">
                  {t('auth.resetNewPassword')}
                </label>
                <div className="relative flex items-center">
                  <input
                    id="auth-password"
                    className={`${inputCls} w-full pr-10`}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder={t('auth.passwordPlaceholder')}
                    autoComplete="new-password"
                    aria-invalid={errorField === 'password'}
                    aria-describedby={
                      errorField === 'password' ? 'auth-modal-error auth-password-hint' : 'auth-password-hint'
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 grid size-7 place-items-center rounded text-rd-muted transition-colors hover:text-rd-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
                {t('auth.email')}
                <input
                  className={inputCls}
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                  aria-invalid={errorField === 'email'}
                  aria-describedby={errorField === 'email' ? 'auth-modal-error' : undefined}
                />
              </label>

              {tab !== 'forgot' && (
                <div className="flex flex-col gap-[5px]">
                  <label htmlFor="auth-password" className="text-[12.5px] font-bold text-rd-text">
                    {t('auth.password')}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="auth-password"
                      className={`${inputCls} w-full pr-10`}
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder={
                        tab === 'register'
                          ? t('auth.passwordPlaceholder')
                          : t('auth.passwordLoginPlaceholder')
                      }
                      autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                      aria-invalid={errorField === 'password'}
                      aria-describedby={
                        errorField === 'password'
                          ? tab === 'register'
                            ? 'auth-modal-error auth-password-hint'
                            : 'auth-modal-error'
                          : tab === 'register'
                            ? 'auth-password-hint'
                            : undefined
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 grid size-7 place-items-center rounded text-rd-muted transition-colors hover:text-rd-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'login' && (
            <button
              className="self-end text-[12.5px] font-extrabold text-rd hover:underline"
              type="button"
              onClick={() => switchTab('forgot')}
            >
              {t('auth.forgotLink')}
            </button>
          )}
          {resetSent && (
            <p className="text-[12.5px] font-bold text-rd-teal" role="status">
              {t('auth.resetSent')}
            </p>
          )}
          {(tab === 'register' || (tab === 'forgot' && forgotStep === 'verify')) && (
            <p id="auth-password-hint" className="text-[11.5px] text-rd-muted">
              {t('auth.passwordHint')}
            </p>
          )}
          {error && (
            <p
              id="auth-modal-error"
              className="text-[12.5px] font-bold text-rd"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy
              ? t('booking.processing')
              : tab === 'login'
                ? t('auth.login')
                : tab === 'forgot'
                  ? forgotStep === 'email'
                    ? t('auth.sendReset')
                    : t('auth.resetVerifyBtn')
                  : t('auth.register')}
          </button>
        </form>
        {tab === 'forgot' && (
          <div className="mt-3 flex items-center justify-between text-[12.5px]">
            <button
              className="font-extrabold text-rd hover:underline"
              type="button"
              onClick={() => switchTab('login')}
            >
              {t('auth.backToLogin')}
            </button>
            {forgotStep === 'verify' && (
              <button
                className="font-bold text-rd-muted hover:text-rd hover:underline"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  setError('')
                  try {
                    await requestPasswordReset(form.email.trim())
                    setResetSent(true)
                  } catch {
                    setResetSent(true)
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                {t('auth.resetResendBtn')}
              </button>
            )}
          </div>
        )}
        {tab === 'login' && (
          <p className="mt-3 text-[12.5px] text-rd-muted">
            {t('auth.noAccount')}{' '}
            <button
              className="font-extrabold text-rd hover:underline"
              type="button"
              onClick={() => switchTab('register')}
            >
              {t('auth.goRegister')}
            </button>
          </p>
        )}
        {tab !== 'forgot' && (
          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-rd-border" />
            <span className="text-[11px] font-bold tracking-wide text-rd-muted uppercase">
              {t('auth.or')}
            </span>
            <span className="h-px flex-1 bg-rd-border" />
          </div>
        )}
        <div className={`flex flex-col gap-2.5${tab === 'forgot' ? ' hidden' : ''}`}>
          <button
            className="inline-flex items-center justify-center gap-2.5 rounded-[9px] border border-rd-border bg-white py-2.5 text-[13.5px] font-bold text-rd-text transition-colors hover:border-rd hover:text-rd"
            type="button"
            onClick={async () => {
              setBusy(true)
              try {
                await loginGoogle()
              } catch (err) {
                setError(errorMessage(err, t))
                setBusy(false)
              }
            }}
            disabled={busy}
          >
            <svg viewBox="0 0 48 48" width="19" height="19" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            {t('auth.withGoogle')}
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-700 uppercase">
              {t('auth.providerDemoBadge')}
            </span>
          </button>
          <button
            className="inline-flex items-center justify-center gap-2.5 rounded-[9px] border border-rd-border bg-white py-2.5 text-[13.5px] font-bold text-rd-text transition-colors hover:border-rd hover:text-rd"
            type="button"
            onClick={async () => {
              setBusy(true)
              try {
                await loginFacebook()
              } catch (err) {
                setError(errorMessage(err, t))
                setBusy(false)
              }
            }}
            disabled={busy}
          >
            <svg viewBox="0 0 48 48" width="19" height="19" aria-hidden="true">
              <path
                fill="#1877F2"
                d="M24 1C11.3 1 1 11.3 1 24c0 11.6 8.4 21.2 19.4 23v-16.3h-5.8V24h5.8v-5c0-5.7 3.4-8.9 8.6-8.9 2.5 0 5.1.4 5.1.4v5.6h-2.9c-2.8 0-3.7 1.8-3.7 3.6V24h6.3l-1 6.7h-5.3V47C38.6 45.2 47 35.6 47 24 47 11.3 36.7 1 24 1z"
              />
            </svg>
            {t('auth.withFacebook')}
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-700 uppercase">
              {t('auth.providerDemoBadge')}
            </span>
          </button>
        </div>
        <p className="mt-3 text-[12px] text-rd-muted">{t('auth.demoNote')}</p>
        <p className="mt-1 text-[11px] text-rd-muted">{t('auth.providerDemoNote')}</p>
      </div>
    </Modal>
  )
}

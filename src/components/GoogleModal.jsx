import { useState } from 'react'
import { loginGoogle, getLastGoogleProfile } from '../services/member.js'
import Modal from './ui/Modal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

const last = getLastGoogleProfile()

export default function GoogleModal({ onClose }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: last?.name ?? '', email: last?.email ?? '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim()
    if (name.length < 3) return setError(t('member.nameTooShort'))
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('member.emailInvalid'))
    setBusy(true)
    try {
      await loginGoogle({ name, email })
      onClose()
    } catch {
      setError(t('google.failed'))
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="google-modal-title">
      <div className="px-5 pt-[18px] pb-[22px]">
        <div className="mb-3 grid size-11 place-items-center rounded-full border border-rd-border bg-white shadow-sm">
          <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
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
        </div>
        <h3 id="google-modal-title" className="text-[19px] font-extrabold leading-[1.3]">
          {t('google.title')}
        </h3>
        <p className="mt-1 mb-3 text-[13px] text-rd-muted">{t('google.subtitle')}</p>
        <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
          <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
            {t('google.name')}
            <input
              className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder={t('google.namePlaceholder')}
              autoComplete="name"
            />
          </label>
          <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
            {t('google.email')}
            <input
              className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder={t('google.emailPlaceholder')}
              autoComplete="email"
            />
          </label>
          {error && <p className="text-[12.5px] font-bold text-rd">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? t('booking.processing') : t('google.continue')}
          </button>
        </form>
        <p className="mt-2 text-[12px] text-rd-muted">{t('google.demoNote')}</p>
      </div>
    </Modal>
  )
}

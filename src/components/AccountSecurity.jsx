import { useState } from 'react'
import { deleteAccount, updatePassword } from '../services/member.js'
import Modal from './ui/Modal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

const inputCls =
  'rounded-[9px] border border-rd-border bg-white px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none'

export default function AccountSecurity({ user, onDeleted }) {
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' })
  const [pwBusy, setPwBusy] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [delError, setDelError] = useState('')
  const [delBusy, setDelBusy] = useState(false)

  const canChangePassword = (user.provider ?? 'email') === 'email'
  const emailMatches = confirmEmail.trim().toLowerCase() === user.email.toLowerCase()

  const submitPassword = async (e) => {
    e.preventDefault()
    setPwBusy(true)
    setPwMsg({ type: '', text: '' })
    try {
      await updatePassword(password)
      setPassword('')
      setPwMsg({ type: 'ok', text: t('account.passwordUpdated') })
    } catch (err) {
      setPwMsg({ type: 'err', text: err.message })
    } finally {
      setPwBusy(false)
    }
  }

  const closeDelete = () => {
    if (delBusy) return
    setDeleteOpen(false)
    setConfirmEmail('')
    setDelError('')
  }

  const confirmDelete = async () => {
    setDelBusy(true)
    setDelError('')
    try {
      await deleteAccount(confirmEmail)
      onDeleted()
    } catch (err) {
      setDelError(err.message || t('account.deleteFailed'))
      setDelBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-rd-border bg-white p-5 shadow-rd lg:col-span-2">
      <h3 className="mb-4 text-[14px] font-extrabold tracking-[0.4px] uppercase text-rd-muted">
        {t('account.securityTitle')}
      </h3>
      {canChangePassword && (
        <form className="mb-5 flex max-w-[420px] flex-col gap-3" onSubmit={submitPassword} noValidate>
          <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
            {t('account.newPassword')}
            <input
              className={inputCls}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPwMsg({ type: '', text: '' })
              }}
              autoComplete="new-password"
              aria-describedby="account-password-hint"
            />
          </label>
          <p id="account-password-hint" className="text-[11.5px] text-rd-muted">
            {t('account.newPasswordHint')}
          </p>
          {pwMsg.text && (
            <p
              className={`text-[12.5px] font-bold ${pwMsg.type === 'ok' ? 'text-rd-teal' : 'text-rd'}`}
              role={pwMsg.type === 'ok' ? 'status' : 'alert'}
            >
              {pwMsg.text}
            </p>
          )}
          <button className="btn btn-outline btn-sm self-start" type="submit" disabled={pwBusy || !password}>
            {pwBusy ? t('booking.processing') : t('account.savePassword')}
          </button>
        </form>
      )}
      <div className="border-t border-[#f4f4f4] pt-4">
        <h4 className="text-[14px] font-extrabold text-rd-text">{t('account.deleteTitle')}</h4>
        <p className="mt-1 mb-3 text-[13px] leading-relaxed text-rd-muted">{t('account.deleteDesc')}</p>
        <button
          className="btn btn-outline btn-sm text-rd hover:border-rd"
          type="button"
          onClick={() => setDeleteOpen(true)}
        >
          {t('account.deleteBtn')}
        </button>
      </div>

      {deleteOpen && (
        <Modal onClose={closeDelete} labelledBy="delete-account-title">
          <div className="px-5 pt-[18px] pb-[22px]">
            <h3 id="delete-account-title" className="text-[19px] font-extrabold leading-[1.3]">
              {t('account.deleteTitle')}
            </h3>
            <p className="mt-2 text-[14px] leading-[1.55] text-rd-muted">{t('account.deleteDesc')}</p>
            <label className="mt-4 flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              {t('account.deleteConfirmLabel', { email: user.email })}
              <input
                className={inputCls}
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
              />
            </label>
            {delError && (
              <p className="mt-2 text-[12.5px] font-bold text-rd" role="alert">
                {delError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="btn btn-outline btn-sm"
                type="button"
                disabled={delBusy}
                onClick={closeDelete}
              >
                {t('account.cancel')}
              </button>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                disabled={delBusy || !emailMatches}
                onClick={confirmDelete}
              >
                {delBusy ? t('booking.processing') : t('account.deleteConfirmBtn')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

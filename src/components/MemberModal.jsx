import { useState } from 'react'
import { registerMember } from '../services/member.js'
import Modal from './ui/Modal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function MemberModal({ onClose }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '' })
  const [error, setError] = useState('')
  const [member, setMember] = useState(null)

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
    try {
      setMember(await registerMember({ name, email }))
    } catch (err) {
      setError(err.message || t('member.saveFailed'))
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="member-modal-title">
      {!member ? (
        <div className="px-5 pt-[18px] pb-[22px]">
          <h3 id="member-modal-title" className="text-[19px] font-extrabold leading-[1.3]">
            {t('member.title')}
          </h3>
          <p className="mt-1 mb-2 text-[13px] text-rd-muted">{t('member.subtitle')}</p>
          <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              {t('member.name')}
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder={t('member.namePlaceholder')}
              />
            </label>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              {t('member.email')}
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder={t('member.emailPlaceholder')}
              />
            </label>
            {error && <p className="text-[12.5px] font-bold text-rd">{error}</p>}
            <button className="btn btn-primary" type="submit">
              {t('member.join')}
            </button>
          </form>
        </div>
      ) : (
        <div className="px-[26px] py-[34px] text-center">
          <div
            className="mx-auto mb-[14px] grid size-[54px] place-items-center rounded-full bg-[linear-gradient(95deg,#10b981,#0d9488)] text-[26px] font-extrabold text-white"
            aria-hidden="true"
          >
            &#10003;
          </div>
          <h3 className="text-[19px] font-extrabold">{t('member.successTitle')}</h3>
          <p className="my-1.5 mb-1 text-[13px] text-rd-muted">
            {t('member.memberId')} <b className="text-rd-teal">{member.id}</b>
          </p>
          <div className="my-3 mb-4 flex flex-col gap-[3px] rounded-[10px] border border-rd-border bg-rd-soft px-[14px] py-3 text-[13px] text-rd-text">
            {t('member.perks').map((perk) => (
              <p key={perk}>{perk}</p>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-rd-muted">{t('member.demoNote')}</p>
          <button className="btn btn-primary mt-[18px]" type="button" onClick={onClose}>
            {t('member.done')}
          </button>
        </div>
      )}
    </Modal>
  )
}

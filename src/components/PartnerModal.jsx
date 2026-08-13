import { useState } from 'react'
import { registerPartner } from '../services/member.js'
import Modal from './ui/Modal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function PartnerModal({ onClose }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({ ownerName: '', propertyName: '', city: '', email: '' })
  const [error, setError] = useState('')
  const [partner, setPartner] = useState(null)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const ownerName = form.ownerName.trim()
    const propertyName = form.propertyName.trim()
    const city = form.city.trim()
    const email = form.email.trim()
    if (ownerName.length < 3) return setError(t('partner.ownerTooShort'))
    if (propertyName.length < 3) return setError(t('partner.propertyTooShort'))
    if (city.length < 2) return setError(t('partner.cityRequired'))
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('partner.emailInvalid'))
    try {
      setPartner(await registerPartner({ ownerName, propertyName, city, email }))
    } catch (err) {
      setError(err.message || t('partner.saveFailed'))
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="partner-modal-title">
      {!partner ? (
        <div className="px-5 pt-[18px] pb-[22px]">
          <h3 id="partner-modal-title" className="text-[19px] font-extrabold leading-[1.3]">
            {t('partner.title')}
          </h3>
          <p className="mt-1 mb-2 text-[13px] text-rd-muted">{t('partner.subtitle')}</p>
          <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              {t('partner.owner')}
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="text"
                value={form.ownerName}
                onChange={set('ownerName')}
                placeholder={t('partner.ownerPlaceholder')}
              />
            </label>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              {t('partner.property')}
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="text"
                value={form.propertyName}
                onChange={set('propertyName')}
                placeholder={t('partner.propertyPlaceholder')}
              />
            </label>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              {t('partner.city')}
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="text"
                value={form.city}
                onChange={set('city')}
                placeholder={t('partner.cityPlaceholder')}
              />
            </label>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              {t('partner.email')}
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder={t('partner.emailPlaceholder')}
              />
            </label>
            {error && <p className="text-[12.5px] font-bold text-rd">{error}</p>}
            <button className="btn btn-primary" type="submit">
              {t('partner.submit')}
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
          <h3 className="text-[19px] font-extrabold">{t('partner.successTitle')}</h3>
          <p className="my-1.5 mb-1 text-[13px] text-rd-muted">
            {t('partner.partnerCode')} <b className="text-rd-teal">{partner.id}</b>
          </p>
          <div className="my-3 mb-4 flex flex-col gap-[3px] rounded-[10px] border border-rd-border bg-rd-soft px-[14px] py-3 text-[13px] text-rd-text">
            <p>
              {partner.propertyName}, {partner.city}
            </p>
            <p>{t('partner.onBehalfOf', { name: partner.ownerName })}</p>
          </div>
          <p className="mt-2 text-[12px] text-rd-muted">{t('partner.demoNote')}</p>
          <button className="btn btn-primary mt-[18px]" type="button" onClick={onClose}>
            {t('partner.done')}
          </button>
        </div>
      )}
    </Modal>
  )
}

import { useState } from 'react'
import { registerPartner } from '../services/member.js'
import Modal from './ui/Modal.jsx'

export default function PartnerModal({ onClose }) {
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
    if (ownerName.length < 3) return setError('Nama pemilik minimal 3 karakter.')
    if (propertyName.length < 3) return setError('Nama properti minimal 3 karakter.')
    if (city.length < 2) return setError('Kota wajib diisi.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Format email tidak valid.')
    try {
      setPartner(await registerPartner({ ownerName, propertyName, city, email }))
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengajuan partner.')
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="partner-modal-title">
      {!partner ? (
        <div className="px-5 pt-[18px] pb-[22px]">
          <h3 id="partner-modal-title" className="text-[19px] font-extrabold leading-[1.3]">
            Punya Penginapan? Jadi Partner Kami
          </h3>
          <p className="mt-1 mb-2 text-[13px] text-rd-muted">
            Gabung jaringan 3500+ properti dan naikkan okupansi hingga 2x lipat.
          </p>
          <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              Nama Pemilik
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="text"
                value={form.ownerName}
                onChange={set('ownerName')}
                placeholder="cth: Budi Santoso"
              />
            </label>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              Nama Properti
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="text"
                value={form.propertyName}
                onChange={set('propertyName')}
                placeholder="cth: Hotel Subur Makmur"
              />
            </label>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              Kota
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="text"
                value={form.city}
                onChange={set('city')}
                placeholder="cth: Bandung"
              />
            </label>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              Email
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="cth: pemilik@email.com"
              />
            </label>
            {error && <p className="text-[12.5px] font-bold text-rd">{error}</p>}
            <button className="btn btn-primary" type="submit">
              Ajukan Properti
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
          <h3 className="text-[19px] font-extrabold">Pengajuan Diterima!</h3>
          <p className="my-1.5 mb-1 text-[13px] text-rd-muted">
            Kode Partner: <b className="text-rd-teal">{partner.id}</b>
          </p>
          <div className="my-3 mb-4 flex flex-col gap-[3px] rounded-[10px] border border-rd-border bg-rd-soft px-[14px] py-3 text-[13px] text-rd-text">
            <p>
              {partner.propertyName}, {partner.city}
            </p>
            <p>Atas nama {partner.ownerName}</p>
          </div>
          <p className="mt-2 text-[12px] text-rd-muted">
            Simulasi demo — pengajuan tersimpan di perangkat ini (localStorage).
          </p>
          <button className="btn btn-primary mt-[18px]" type="button" onClick={onClose}>
            Selesai
          </button>
        </div>
      )}
    </Modal>
  )
}

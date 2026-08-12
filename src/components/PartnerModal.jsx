import { useEffect, useRef, useState } from 'react'
import { registerPartner } from '../services/member.js'

export default function PartnerModal({ onClose }) {
  const [form, setForm] = useState({ ownerName: '', propertyName: '', city: '', email: '' })
  const [error, setError] = useState('')
  const [partner, setPartner] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const submit = (e) => {
    e.preventDefault()
    const ownerName = form.ownerName.trim()
    const propertyName = form.propertyName.trim()
    const city = form.city.trim()
    const email = form.email.trim()
    if (ownerName.length < 3) return setError('Nama pemilik minimal 3 karakter.')
    if (propertyName.length < 3) return setError('Nama properti minimal 3 karakter.')
    if (city.length < 2) return setError('Kota wajib diisi.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Format email tidak valid.')
    setPartner(registerPartner({ ownerName, propertyName, city, email }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="hotel-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Daftarkan Properti"
        tabIndex={-1}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup">&times;</button>

        {!partner ? (
          <div className="modal-body">
            <div className="modal-head">
              <h3>Punya Penginapan? Jadi Partner Kami</h3>
              <p className="modal-loc">Gabung jaringan 3500+ properti dan naikkan okupansi hingga 2x lipat.</p>
            </div>
            <form className="booking-form" onSubmit={submit} noValidate>
              <label>
                Nama Pemilik
                <input type="text" value={form.ownerName} onChange={set('ownerName')} placeholder="cth: Budi Santoso" />
              </label>
              <label>
                Nama Properti
                <input type="text" value={form.propertyName} onChange={set('propertyName')} placeholder="cth: Hotel Subur Makmur" />
              </label>
              <label>
                Kota
                <input type="text" value={form.city} onChange={set('city')} placeholder="cth: Bandung" />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={set('email')} placeholder="cth: pemilik@email.com" />
              </label>
              {error && <p className="booking-error">{error}</p>}
              <button className="btn btn-primary" type="submit">Ajukan Properti</button>
            </form>
          </div>
        ) : (
          <div className="modal-body modal-success">
            <div className="modal-success__icon" aria-hidden="true">&#10003;</div>
            <h3>Pengajuan Diterima!</h3>
            <p className="modal-success__code">Kode Partner: <b>{partner.id}</b></p>
            <div className="modal-summary">
              <p>{partner.propertyName}, {partner.city}</p>
              <p>Atas nama {partner.ownerName}</p>
            </div>
            <p className="modal-hint">Simulasi demo — pengajuan tersimpan di perangkat ini (localStorage).</p>
            <button className="btn btn-primary" type="button" onClick={onClose}>Selesai</button>
          </div>
        )}
      </div>
    </div>
  )
}
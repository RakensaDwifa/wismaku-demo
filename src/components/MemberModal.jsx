import { useEffect, useRef, useState } from 'react'
import { registerMember } from '../services/member.js'

export default function MemberModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '' })
  const [error, setError] = useState('')
  const [member, setMember] = useState(null)
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
    const name = form.name.trim()
    const email = form.email.trim()
    if (name.length < 3) return setError('Nama lengkap minimal 3 karakter.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Format email tidak valid.')
    setMember(registerMember({ name, email }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="hotel-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Daftar WismaClub"
        tabIndex={-1}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup">&times;</button>

        {!member ? (
          <div className="modal-body">
            <div className="modal-head">
              <h3>Gabung WismaClub, Gratis!</h3>
              <p className="modal-loc">Diskon member hingga 20%, check-in lebih awal, dan fleksibilitas check-out.</p>
            </div>
            <form className="booking-form" onSubmit={submit} noValidate>
              <label>
                Nama Lengkap
                <input type="text" value={form.name} onChange={set('name')} placeholder="cth: Budi Santoso" />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={set('email')} placeholder="cth: budi@email.com" />
              </label>
              {error && <p className="booking-error">{error}</p>}
              <button className="btn btn-primary" type="submit">Daftar Sekarang</button>
            </form>
          </div>
        ) : (
          <div className="modal-body modal-success">
            <div className="modal-success__icon" aria-hidden="true">&#10003;</div>
            <h3>Selamat, Kamu Anggota WismaClub!</h3>
            <p className="modal-success__code">ID Member: <b>{member.id}</b></p>
            <div className="modal-summary">
              <p>Diskon member hingga 20% di ribuan properti</p>
              <p>Check-in lebih awal (early check-in)</p>
              <p>Fleksibilitas check-out</p>
            </div>
            <p className="modal-hint">Simulasi demo — data member tersimpan di perangkat ini (localStorage).</p>
            <button className="btn btn-primary" type="button" onClick={onClose}>Selesai</button>
          </div>
        )}
      </div>
    </div>
  )
}
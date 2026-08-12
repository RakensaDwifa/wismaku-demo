import { useEffect, useRef, useState } from 'react'
import { createBooking } from '../services/booking.js'

const fmtRupiah = (n) => 'Rp ' + n.toLocaleString('id-ID')

const fmtDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T00:00:00'))
    : '-'

export default function HotelDetailModal({ hotel, search, onClose }) {
  const [imgIdx, setImgIdx] = useState(0)
  const [step, setStep] = useState('detail')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null)
  const panelRef = useRef(null)

  const nights = search?.nights ?? 0
  const guests = search?.guests ?? 0
  const rooms = search?.rooms ?? 1
  const hasDates = Boolean(search?.checkIn && search?.checkOut)
  const total = nights > 0 ? hotel.price * nights : hotel.price

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

  const goForm = () => {
    setError('')
    setStep('form')
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const submit = (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()
    if (name.length < 3) return setError('Nama lengkap minimal 3 karakter.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Format email tidak valid.')
    if (!/^[0-9+\-\s]{8,15}$/.test(phone)) return setError('Nomor HP minimal 8 digit angka.')
    const result = createBooking({
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelImg: hotel.img,
      checkIn: search?.checkIn ?? null,
      checkOut: search?.checkOut ?? null,
      nights: nights || 1,
      rooms,
      guests,
      totalPrice: nights > 0 ? total : hotel.price,
      guestName: name,
      email,
      phone,
    })
    setBooking(result)
    setStep('done')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="hotel-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Detail ${hotel.name}`}
        tabIndex={-1}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup">&times;</button>

        {step === 'detail' && (
          <>
            <div className="modal-gallery">
              <img className="modal-gallery__main" src={hotel.gallery[imgIdx]} alt={`${hotel.name} foto ${imgIdx + 1}`} />
              <div className="modal-gallery__thumbs">
                {hotel.gallery.map((g, i) => (
                  <button
                    key={g}
                    type="button"
                    className={`modal-thumb${i === imgIdx ? ' is-active' : ''}`}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Foto ${i + 1}`}
                  >
                    <img src={g} alt="" />
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-body">
              <div className="modal-head">
                <h3>{hotel.name}</h3>
                <p className="modal-loc">{hotel.area}, {hotel.city}</p>
                <span className="modal-rating">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                  </svg>
                  {hotel.rating} ({hotel.reviews} ulasan)
                </span>
              </div>

              <div className="modal-amenities">
                {hotel.amenities.map((a) => (
                  <span className="modal-amenity" key={a}>{a}</span>
                ))}
              </div>

              <p className="modal-desc">{hotel.desc}</p>

              <div className="modal-price">
                <div className="modal-price__left">
                  <span className="modal-price__per">{fmtRupiah(hotel.price)} <small>/ malam</small></span>
                  {nights > 0 && (
                    <span className="modal-price__total">{fmtRupiah(total)} total &middot; {nights} malam</span>
                  )}
                </div>
                {!hasDates && nights === 0 && (
                  <p className="modal-hint">Pilih tanggal lewat pencarian untuk menghitung total</p>
                )}
                <button className="btn btn-primary" type="button" onClick={goForm}>Pesan Sekarang</button>
              </div>
            </div>
          </>
        )}

        {step === 'form' && (
          <div className="modal-body">
            <div className="modal-head">
              <h3>Pesan {hotel.name}</h3>
              <p className="modal-loc">{hotel.area}, {hotel.city}</p>
            </div>
            <div className="modal-summary">
              {hasDates && <p>{fmtDate(search.checkIn)} &rarr; {fmtDate(search.checkOut)} ({nights} malam)</p>}
              <p>{rooms} kamar &middot; {guests || 1} tamu &middot; {fmtRupiah(nights > 0 ? total : hotel.price)}</p>
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
              <label>
                No. HP
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="cth: 081234567890" />
              </label>
              {error && <p className="booking-error">{error}</p>}
              <div className="modal-price">
                <span className="modal-price__per">{fmtRupiah(nights > 0 ? total : hotel.price)}</span>
                <button className="btn btn-primary" type="submit">Konfirmasi Pesanan</button>
              </div>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="modal-body modal-success">
            <div className="modal-success__icon" aria-hidden="true">&#10003;</div>
            <h3>Pesanan Berhasil Dibuat</h3>
            <p className="modal-success__code">Kode Booking: <b>{booking.id}</b></p>
            <div className="modal-summary">
              <p>{booking.hotelName}</p>
              <p>{fmtDate(booking.checkIn)} &rarr; {fmtDate(booking.checkOut)}</p>
              <p>{booking.nights} malam &middot; {booking.rooms} kamar &middot; {booking.guests} tamu</p>
              <p className="modal-success__total">{fmtRupiah(booking.totalPrice)}</p>
            </div>
            <p className="modal-hint">Simulasi demo — pesanan tersimpan di perangkat ini (localStorage).</p>
            <button className="btn btn-primary" type="button" onClick={onClose}>Selesai</button>
          </div>
        )}
      </div>
    </div>
  )
}
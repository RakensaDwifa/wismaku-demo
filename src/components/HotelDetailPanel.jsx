import { useEffect, useRef, useState } from 'react'
import { createBooking } from '../services/booking.js'
import { applyCoupon } from '../services/coupon.js'
import { getMember } from '../services/member.js'
import { useFocusTrap } from '../hooks/useFocusTrap.js'
import { fmtRupiah, fmtDate } from '../utils/format.js'
import { srcSet } from '../utils/image.js'
import FavButton from './FavButton.jsx'
import Modal from './ui/Modal.jsx'

const MEMBER_DISCOUNT_PCT = 0.1

export default function HotelDetailPanel({ hotel, search, onClose, isPage = false }) {
  const [imgIdx, setImgIdx] = useState(0)
  const [step, setStep] = useState('detail')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null)
  const [roomTypeId, setRoomTypeId] = useState(hotel.roomTypes?.[0]?.id ?? 'standard')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [isMember, setIsMember] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const panelRef = useRef(null)

  useFocusTrap(panelRef)

  const nights = search?.nights ?? 0
  const guests = search?.guests ?? 0
  const rooms = search?.rooms ?? 1
  const hasDates = Boolean(search?.checkIn && search?.checkOut)
  const roomType =
    hotel.roomTypes?.find((t) => t.id === roomTypeId) ??
    hotel.roomTypes?.[0] ?? { id: 'standard', name: 'Standar', price: hotel.price }

  const subtotal = roomType.price * (nights || 1) * rooms
  const couponAmount = coupon
    ? Math.min(Math.round((subtotal * coupon.pct) / 100), coupon.maxDiscount)
    : 0
  const afterCoupon = subtotal - couponAmount
  const memberDiscount = isMember ? Math.round(afterCoupon * MEMBER_DISCOUNT_PCT) : 0
  const total = afterCoupon - memberDiscount

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !lightboxOpen) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, lightboxOpen])

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const m = await getMember()
        if (live) setIsMember(Boolean(m))
      } catch {
        if (live) setIsMember(false)
      }
    }
    sync()
    window.addEventListener('wismaku:members-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:members-changed', sync)
    }
  }, [])

  const goForm = () => {
    setError('')
    setStep('form')
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError('')
  }

  const handleCoupon = async () => {
    setCouponError('')
    try {
      setCoupon(await applyCoupon(couponInput, subtotal))
      setCouponInput('')
    } catch (err) {
      setCoupon(null)
      setCouponError(err.message || 'Kupon tidak valid.')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()
    if (name.length < 3) return setError('Nama lengkap minimal 3 karakter.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Format email tidak valid.')
    if (!/^[0-9+\-\s]{8,15}$/.test(phone)) return setError('Nomor HP minimal 8 digit angka.')
    try {
      const result = await createBooking({
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelImg: hotel.img,
        checkIn: search?.checkIn ?? null,
        checkOut: search?.checkOut ?? null,
        nights: nights || 1,
        rooms,
        guests,
        roomTypeId: roomType.id,
        roomTypeName: roomType.name,
        roomPrice: roomType.price,
        couponCode: coupon?.code ?? null,
        couponDiscount: couponAmount,
        memberDiscount,
        totalPrice: total,
        guestName: name,
        email,
        phone,
      })
      setBooking(result)
      setStep('done')
    } catch (err) {
      setError(err.message || 'Gagal membuat pesanan.')
    }
  }

  return (
    <div
      className="hotel-modal"
      role="dialog"
      aria-modal={String(!isPage)}
      aria-label={`Detail ${hotel.name}`}
      tabIndex={-1}
      ref={panelRef}
    >
      {onClose && (
        <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup">
          &times;
        </button>
      )}
      <FavButton hotelId={hotel.id} className="hotel-modal__fav" />

      {step === 'detail' && (
        <>
          <div className="modal-gallery">
            <img
              className="modal-gallery__main"
              src={hotel.gallery[imgIdx]}
              srcSet={srcSet(hotel.gallery[imgIdx], [400, 800, 1200])}
              sizes="(max-width: 768px) 92vw, 560px"
              alt={`${hotel.name} foto ${imgIdx + 1}`}
              onClick={() => setLightboxOpen(true)}
              title="Klik untuk memperbesar foto"
            />
            <div className="modal-gallery__thumbs">
              {hotel.gallery.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  className={`modal-thumb${i === imgIdx ? ' is-active' : ''}`}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Foto ${i + 1}`}
                  aria-pressed={i === imgIdx}
                >
                  <img src={g} alt="" />
                </button>
              ))}
            </div>
          </div>
          <div className="modal-body">
            <div className="modal-head">
              <h3>{hotel.name}</h3>
              <p className="modal-loc">
                {hotel.area}, {hotel.city}
              </p>
              <span className="modal-rating">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                </svg>
                {hotel.rating} ({hotel.reviews} ulasan)
              </span>
            </div>

            <div className="modal-amenities">
              {hotel.amenities.map((a) => (
                <span className="modal-amenity" key={a}>
                  {a}
                </span>
              ))}
            </div>

            <p className="modal-desc">{hotel.desc}</p>

            {hotel.reviewList?.length > 0 && (
              <section className="modal-section">
                <h4 className="modal-section__title">Ulasan Tamu</h4>
                <div className="review-summary">
                  <span className="review-summary__score">{hotel.rating}</span>
                  <span className="review-summary__meta">
                    Dari {hotel.reviews} ulasan &middot; {hotel.reviewList.length} ulasan terbaru
                  </span>
                </div>
                <ul className="review-list">
                  {hotel.reviewList.map((r, i) => (
                    <li className="review-item" key={i}>
                      <div className="review-item__head">
                        <b>{r.name}</b>
                        <span className="review-item__stars">{'★'.repeat(r.rating)}</span>
                      </div>
                      <span className="review-item__date">{fmtDate(r.date)}</span>
                      <p>{r.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hotel.policy && (
              <section className="modal-section">
                <h4 className="modal-section__title">Kebijakan Hotel</h4>
                <ul className="policy-list">
                  <li>
                    <b>Check-in:</b> mulai {hotel.policy.checkIn}
                  </li>
                  <li>
                    <b>Check-out:</b> hingga {hotel.policy.checkOut}
                  </li>
                  <li>{hotel.policy.cancelRule}</li>
                </ul>
              </section>
            )}

            {hotel.roomTypes?.length > 0 && (
              <div className="modal-rooms">
                <p className="modal-rooms__label">Pilih Tipe Kamar</p>
                <div className="modal-rooms__grid">
                  {hotel.roomTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`room-type${t.id === roomTypeId ? ' is-active' : ''}`}
                      onClick={() => setRoomTypeId(t.id)}
                      aria-pressed={t.id === roomTypeId}
                    >
                      <b>{t.name}</b>
                      <span>hingga {t.capacity} tamu</span>
                      <span className="room-type__price">
                        {fmtRupiah(t.price)} <small>/ malam</small>
                      </span>
                      <span className="room-type__strike">{fmtRupiah(t.originalPrice)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-price">
              <div className="modal-price__left">
                <span className="modal-price__per">
                  {fmtRupiah(roomType.price)} <small>/ malam</small>
                </span>
                {nights > 0 && (
                  <span className="modal-price__total">
                    {fmtRupiah(subtotal)} total &middot; {nights} malam &middot; {rooms} kamar
                  </span>
                )}
                {isMember && nights > 0 && (
                  <span className="modal-price__total">Diskon member 10% otomatis diterapkan</span>
                )}
              </div>
              {!hasDates && nights === 0 && (
                <p className="modal-hint">Pilih tanggal lewat pencarian untuk menghitung total</p>
              )}
              <button className="btn btn-primary" type="button" onClick={goForm}>
                Pesan Sekarang
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'form' && (
        <div className="modal-body">
          <div className="modal-head">
            <h3>Pesan {hotel.name}</h3>
            <p className="modal-loc">
              {hotel.area}, {hotel.city} &middot; {roomType.name}
            </p>
          </div>
          <div className="modal-summary">
            {hasDates && (
              <p>
                {fmtDate(search.checkIn)} &rarr; {fmtDate(search.checkOut)} ({nights} malam)
              </p>
            )}
            <p>
              {rooms} kamar &middot; {guests || 1} tamu &middot; Tipe {roomType.name}
            </p>
          </div>

          <div className="coupon-row">
            <input
              className="coupon-input"
              type="text"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value)
                setCouponError('')
              }}
              placeholder="Kode kupon (cth: WISMA20)"
              aria-label="Kode kupon"
            />
            <button className="btn btn-outline btn-sm" type="button" onClick={handleCoupon}>
              Pakai
            </button>
          </div>
          {couponError && <p className="booking-error">{couponError}</p>}
          {coupon && <p className="coupon-ok">Kupon {coupon.code} berlaku &mdash; hemat {fmtRupiah(couponAmount)}</p>}
          {isMember && <p className="coupon-ok">Diskon member WismaClub 10% diterapkan</p>}

          <div className="price-breakdown">
            <div className="price-breakdown__row">
              <span>
                {fmtRupiah(roomType.price)} &times; {nights} malam &times; {rooms} kamar
              </span>
              <b>{fmtRupiah(subtotal)}</b>
            </div>
            {coupon && (
              <div className="price-breakdown__row price-breakdown__save">
                <span>Kupon {coupon.code}</span>
                <b>-{fmtRupiah(couponAmount)}</b>
              </div>
            )}
            {isMember && (
              <div className="price-breakdown__row price-breakdown__save">
                <span>Diskon Member 10%</span>
                <b>-{fmtRupiah(memberDiscount)}</b>
              </div>
            )}
            <div className="price-breakdown__row price-breakdown__total">
              <span>Total</span>
              <b>{fmtRupiah(total)}</b>
            </div>
          </div>

          <form className="booking-form" onSubmit={submit} noValidate>
            <label>
              Nama Lengkap
              <input type="text" value={form.name} onChange={set('name')} placeholder="cth: Budi Santoso" />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="cth: budi@email.com"
              />
            </label>
            <label>
              No. HP
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="cth: 081234567890" />
            </label>
            {error && <p className="booking-error">{error}</p>}
            <div className="modal-price">
              <span className="modal-price__per">{fmtRupiah(total)}</span>
              <button className="btn btn-primary" type="submit">
                Konfirmasi Pesanan
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'done' && (
        <div className="modal-body modal-success">
          <div className="modal-success__icon" aria-hidden="true">
            &#10003;
          </div>
          <h3>Pesanan Berhasil Dibuat</h3>
          <p className="modal-success__code">
            Kode Booking: <b>{booking.id}</b>
          </p>
          <div className="modal-summary">
            <p>{booking.hotelName}</p>
            <p>
              {fmtDate(booking.checkIn)} &rarr; {fmtDate(booking.checkOut)}
            </p>
            <p>
              {booking.nights} malam &middot; {booking.rooms} kamar &middot; {booking.guests} tamu
              &middot; {booking.roomTypeName}
            </p>
            {(booking.couponDiscount > 0 || booking.memberDiscount > 0) && (
              <p>
                Hemat {booking.couponDiscount > 0 ? `${fmtRupiah(booking.couponDiscount)} (kupon)` : ''}
                {booking.couponDiscount > 0 && booking.memberDiscount > 0 ? ' + ' : ''}
                {booking.memberDiscount > 0 ? `${fmtRupiah(booking.memberDiscount)} (member)` : ''}
              </p>
            )}
            <p className="modal-success__total">{fmtRupiah(booking.totalPrice)}</p>
          </div>
          <p className="modal-hint">Simulasi demo — pesanan tersimpan di perangkat ini (localStorage).</p>
          <button className="btn btn-primary" type="button" onClick={onClose}>
            Selesai
          </button>
        </div>
      )}

      {lightboxOpen && (
        <Modal onClose={() => setLightboxOpen(false)} labelledBy="lightbox-title">
          <div className="modal-body">
            <h3 id="lightbox-title" style={{ marginBottom: 12 }}>
              {hotel.name} &mdash; Foto {imgIdx + 1} dari {hotel.gallery.length}
            </h3>
            <img
              className="lightbox__img"
              src={hotel.gallery[imgIdx]}
              alt={`${hotel.name} foto ${imgIdx + 1}`}
            />
            <div className="lightbox__nav">
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() =>
                  setImgIdx((i) => (i - 1 + hotel.gallery.length) % hotel.gallery.length)
                }
              >
                &larr; Sebelumnya
              </button>
              <span>
                {imgIdx + 1} / {hotel.gallery.length}
              </span>
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() => setImgIdx((i) => (i + 1) % hotel.gallery.length)}
              >
                Berikutnya &rarr;
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
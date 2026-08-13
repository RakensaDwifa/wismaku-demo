import { useEffect, useRef, useState } from 'react'
import { createBooking } from '../services/booking.js'
import { applyCoupon } from '../services/coupon.js'
import { getMember } from '../services/member.js'
import { getReviews, addReview } from '../services/review.js'
import useFocusTrap from '../hooks/useFocusTrap.js'
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
  const [userReviews, setUserReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ name: '', city: '', text: '' })
  const [reviewRating, setReviewRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewError, setReviewError] = useState('')
  const panelRef = useRef(null)

  useFocusTrap(panelRef)

  const nights = search?.nights ?? 0
  const guests = search?.guests ?? 0
  const rooms = search?.rooms ?? 1
  const hasDates = Boolean(search?.checkIn && search?.checkOut)
  const roomType = hotel.roomTypes?.find((t) => t.id === roomTypeId) ??
    hotel.roomTypes?.[0] ?? { id: 'standard', name: 'Standar', price: hotel.price }

  const subtotal = roomType.price * (nights || 1) * rooms
  const couponAmount = coupon ? Math.min(Math.round((subtotal * coupon.pct) / 100), coupon.maxDiscount) : 0
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

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const list = await getReviews(hotel.id)
        if (live) setUserReviews(list)
      } catch {
        if (live) setUserReviews([])
      }
    }
    sync()
    window.addEventListener('wismaku:reviews-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:reviews-changed', sync)
    }
  }, [hotel.id])

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

  const submitReview = async (e) => {
    e.preventDefault()
    const name = reviewForm.name.trim()
    const city = reviewForm.city.trim()
    const text = reviewForm.text.trim()
    if (name.length < 3) return setReviewError('Nama minimal 3 karakter.')
    if (city && city.length < 2) return setReviewError('Kota minimal 2 karakter.')
    if (!reviewRating) return setReviewError('Pilih rating bintang dulu.')
    if (text.length < 5) return setReviewError('Ulasan minimal 5 karakter.')
    try {
      const rev = await addReview({
        hotelId: hotel.id,
        name,
        city: city || undefined,
        rating: reviewRating,
        text,
      })
      setUserReviews((list) => [rev, ...list])
      setReviewForm({ name: '', city: '', text: '' })
      setReviewRating(0)
      setReviewError('')
    } catch (err) {
      setReviewError(err.message || 'Gagal mengirim ulasan.')
    }
  }

  const setReviewField = (key) => (e) => {
    setReviewForm((f) => ({ ...f, [key]: e.target.value }))
    setReviewError('')
  }

  return (
    <div
      className="relative w-[min(560px,100%)] max-h-[calc(100vh-40px)] overflow-y-auto rounded-2xl bg-white shadow-rd-lg outline-none animate-modal-in"
      role="dialog"
      aria-modal={String(!isPage)}
      aria-label={`Detail ${hotel.name}`}
      tabIndex={-1}
      ref={panelRef}
    >
      {onClose && (
        <button
          className="absolute top-2.5 right-2.5 z-10 grid size-[34px] place-items-center rounded-full bg-white/92 text-[22px] leading-none text-rd-text shadow-[0_2px_8px_rgba(0,0,0,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd hover:text-rd"
          type="button"
          onClick={onClose}
          aria-label="Tutup"
        >
          &times;
        </button>
      )}
      <FavButton
        hotelId={hotel.id}
        className={`absolute right-2.5 z-10 ${onClose ? 'top-[54px]' : 'top-2.5'}`}
      />

      {step === 'detail' && (
        <>
          <div className="bg-[#f7f7f7]">
            <img
              className="h-[260px] w-full object-cover"
              src={hotel.gallery[imgIdx]}
              srcSet={srcSet(hotel.gallery[imgIdx], [400, 800, 1200])}
              sizes="(max-width: 768px) 92vw, 560px"
              alt={`${hotel.name} foto ${imgIdx + 1}`}
              onClick={() => setLightboxOpen(true)}
              title="Klik untuk memperbesar foto"
            />
            <div className="flex gap-2 px-[14px] pt-2.5 pb-3">
              {hotel.gallery.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  className={`h-[58px] w-[86px] overflow-hidden rounded-lg border-2 border-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd aria-pressed:border-rd max-[768px]:h-16 max-[768px]:w-24`}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Foto ${i + 1}`}
                  aria-pressed={i === imgIdx}
                >
                  <img className="h-full w-full object-cover" src={g} alt="" />
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 pt-[18px] pb-[22px]">
            <h3 className="text-[19px] font-extrabold leading-[1.3]">{hotel.name}</h3>
            <p className="mt-1 mb-2 text-[13px] text-rd-muted">
              {hotel.area}, {hotel.city}
            </p>
            <span className="inline-flex items-center gap-[5px] rounded-full bg-rd-soft px-2.5 py-1 text-[12.5px] font-extrabold text-rd-teal">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
              </svg>
              {hotel.rating} ({hotel.reviews} ulasan)
            </span>

            <div className="mt-[14px] flex flex-wrap gap-2">
              {hotel.amenities.map((a) => (
                <span
                  className="rounded-full border border-rd-border bg-rd-soft px-[11px] py-[5px] text-[12px] font-semibold text-rd-teal"
                  key={a}
                >
                  {a}
                </span>
              ))}
            </div>

            <p className="my-[14px] mb-[18px] text-[13.5px] leading-[1.65] text-rd-muted">{hotel.desc}</p>

            {(userReviews.length > 0 || hotel.reviewList?.length > 0) && (
              <section className="mt-[22px]">
                <h4 className="mb-2.5 text-[15px] font-extrabold">Ulasan Tamu</h4>
                <div className="mb-[14px] flex items-center gap-3">
                  <span className="text-[22px] font-extrabold text-rd">{hotel.rating}</span>
                  <span className="text-[13px] text-rd-muted">
                    Dari {hotel.reviews} ulasan &middot; {hotel.reviewList.length + userReviews.length} ulasan
                    terbaru
                  </span>
                </div>
                <ul className="mb-5 flex list-none flex-col gap-[14px] p-0">
                  {[...userReviews, ...(hotel.reviewList ?? [])].map((r, i) => (
                    <li className="rounded-[10px] bg-rd-soft px-[14px] py-3 text-[13.5px]" key={r.id || i}>
                      <div className="mb-0.5 flex items-center justify-between gap-2.5">
                        <b className="inline-flex items-center gap-2 text-[13.5px]">
                          {r.name}
                          {userReviews.includes(r) && (
                            <span className="rounded-full bg-[rgba(20,184,166,0.15)] px-2 py-[2px] text-[10.5px] font-extrabold tracking-[0.4px] uppercase text-rd-teal">
                              Ulasan Anda
                            </span>
                          )}
                        </b>
                        <span className="text-[12px] text-[#f5a623] tracking-[1px]">
                          {'★'.repeat(r.rating)}
                        </span>
                      </div>
                      <span className="text-[11.5px] text-rd-muted">{fmtDate(r.date)}</span>
                      <p className="mt-1.5 leading-[1.55]">{r.text}</p>
                    </li>
                  ))}
                </ul>

                {userReviews.length === 0 ? (
                  <form
                    className="flex flex-col gap-3 rounded-xl border border-dashed border-rd-border p-4"
                    onSubmit={submitReview}
                    noValidate
                  >
                    <h5 className="text-[14px] font-extrabold">Tulis Ulasan</h5>
                    <div
                      className="inline-flex gap-0.5"
                      role="radiogroup"
                      aria-label="Rating bintang"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`text-[26px] leading-none text-rd-border transition-[color,transform] duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd hover:scale-[1.15]${n <= (hoverRating || reviewRating) ? ' text-[#f5a623]' : ''}`}
                          onClick={() => {
                            setReviewRating(n)
                            setReviewError('')
                          }}
                          onMouseEnter={() => setHoverRating(n)}
                          role="radio"
                          aria-checked={reviewRating === n}
                          aria-label={`${n} bintang`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
                      Nama
                      <input
                        className="rounded-[9px] border border-rd-border bg-white px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                        type="text"
                        value={reviewForm.name}
                        onChange={setReviewField('name')}
                        placeholder="cth: Andi Pratama"
                        maxLength={50}
                      />
                    </label>
                    <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
                      Kota <span className="font-medium text-rd-muted">(opsional)</span>
                      <input
                        className="rounded-[9px] border border-rd-border bg-white px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                        type="text"
                        value={reviewForm.city}
                        onChange={setReviewField('city')}
                        placeholder="cth: Bandung"
                        maxLength={40}
                      />
                    </label>
                    <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
                      Ulasan
                      <textarea
                        className="resize-y rounded-[9px] border border-rd-border bg-white px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                        value={reviewForm.text}
                        onChange={setReviewField('text')}
                        placeholder="Ceritakan pengalaman menginapmu..."
                        rows={3}
                        maxLength={500}
                      />
                    </label>
                    {reviewError && <p className="text-[12.5px] font-bold text-rd">{reviewError}</p>}
                    <button className="btn btn-primary btn-sm" type="submit">
                      Kirim Ulasan
                    </button>
                  </form>
                ) : (
                  <p className="rounded-[10px] bg-[rgba(20,184,166,0.1)] px-[14px] py-3 text-[13.5px] font-bold text-rd-teal">
                    Terima kasih, ulasan Anda telah tersimpan.
                  </p>
                )}
              </section>
            )}

            {hotel.policy && (
              <section className="mt-[22px]">
                <h4 className="mb-2.5 text-[15px] font-extrabold">Kebijakan Hotel</h4>
                <ul className="list-none p-0">
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
              <div className="mt-1 mb-4">
                <p className="mb-2 text-[12.5px] font-extrabold text-rd-text">Pilih Tipe Kamar</p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
                  {hotel.roomTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`flex cursor-pointer flex-col gap-0.5 rounded-[10px] border-[1.5px] border-rd-border bg-white p-2.5 text-left transition-[border-color,background] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd hover:border-rd-teal aria-pressed:border-rd-teal aria-pressed:bg-[rgba(20,184,166,0.07)]`}
                      onClick={() => setRoomTypeId(t.id)}
                      aria-pressed={t.id === roomTypeId}
                    >
                      <b className="text-[13.5px] text-rd-text">{t.name}</b>
                      <span className="text-[12px] text-rd-muted">hingga {t.capacity} tamu</span>
                      <span className="mt-1 font-extrabold text-rd">
                        {fmtRupiah(t.price)} <small className="font-semibold text-rd-muted">/ malam</small>
                      </span>
                      <span className="text-[12px] text-rd-muted line-through">
                        {fmtRupiah(t.originalPrice)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-[14px] border-t border-[#eee] pt-4">
              <div className="flex flex-col">
                <span className="text-[19px] font-extrabold text-rd">
                  {fmtRupiah(roomType.price)}{' '}
                  <small className="text-[12.5px] font-semibold text-rd-muted">/ malam</small>
                </span>
                {nights > 0 && (
                  <span className="mt-0.5 text-[12.5px] font-extrabold text-rd-teal">
                    {fmtRupiah(subtotal)} total &middot; {nights} malam &middot; {rooms} kamar
                  </span>
                )}
                {isMember && nights > 0 && (
                  <span className="mt-0.5 text-[12.5px] font-extrabold text-rd-teal">
                    Diskon member 10% otomatis diterapkan
                  </span>
                )}
              </div>
              {!hasDates && nights === 0 && (
                <p className="mt-2 text-[12px] text-rd-muted">
                  Pilih tanggal lewat pencarian untuk menghitung total
                </p>
              )}
              <button className="btn btn-primary" type="button" onClick={goForm}>
                Pesan Sekarang
              </button>
            </div>
          </div>
        </>
      )}

      {step === 'form' && (
        <div className="px-5 pt-[18px] pb-[22px]">
          <h3 className="text-[19px] font-extrabold leading-[1.3]">Pesan {hotel.name}</h3>
          <p className="mt-1 mb-2 text-[13px] text-rd-muted">
            {hotel.area}, {hotel.city} &middot; {roomType.name}
          </p>
          <div className="my-3 mb-4 flex flex-col gap-[3px] rounded-[10px] border border-rd-border bg-rd-soft px-[14px] py-3 text-[13px] text-rd-text">
            {hasDates && (
              <p>
                {fmtDate(search.checkIn)} &rarr; {fmtDate(search.checkOut)} ({nights} malam)
              </p>
            )}
            <p>
              {rooms} kamar &middot; {guests || 1} tamu &middot; Tipe {roomType.name}
            </p>
          </div>

          <div className="mb-1 flex gap-2">
            <input
              className="flex-1 rounded-[9px] border border-rd-border px-3 py-[9px] text-[13.5px] focus:border-rd focus:outline-none"
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
          {couponError && <p className="text-[12.5px] font-bold text-rd">{couponError}</p>}
          {coupon && (
            <p className="my-1.5 mb-2.5 text-[12.5px] font-bold text-rd-teal">
              Kupon {coupon.code} berlaku &mdash; hemat {fmtRupiah(couponAmount)}
            </p>
          )}
          {isMember && (
            <p className="my-1.5 mb-2.5 text-[12.5px] font-bold text-rd-teal">
              Diskon member WismaClub 10% diterapkan
            </p>
          )}

          <div className="my-2.5 mb-[14px] flex flex-col gap-1.5 rounded-[10px] border border-rd-border px-[14px] py-2.5">
            <div className="flex justify-between gap-2.5 text-[13px] text-rd-text">
              <span>
                {fmtRupiah(roomType.price)} &times; {nights} malam &times; {rooms} kamar
              </span>
              <b>{fmtRupiah(subtotal)}</b>
            </div>
            {coupon && (
              <div className="flex justify-between gap-2.5 text-[13px] text-rd-teal">
                <span>Kupon {coupon.code}</span>
                <b>-{fmtRupiah(couponAmount)}</b>
              </div>
            )}
            {isMember && (
              <div className="flex justify-between gap-2.5 text-[13px] text-rd-teal">
                <span>Diskon Member 10%</span>
                <b>-{fmtRupiah(memberDiscount)}</b>
              </div>
            )}
            <div className="mt-0.5 flex justify-between gap-2.5 border-t border-dashed border-[#ddd] pt-2 text-[14.5px] font-extrabold text-rd">
              <span>Total</span>
              <b>{fmtRupiah(total)}</b>
            </div>
          </div>

          <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              Nama Lengkap
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="cth: Budi Santoso"
              />
            </label>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              Email
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="cth: budi@email.com"
              />
            </label>
            <label className="flex flex-col gap-[5px] text-[12.5px] font-bold text-rd-text">
              No. HP
              <input
                className="rounded-[9px] border border-rd-border px-3 py-2.5 text-[14px] transition-[border-color] duration-150 focus:border-rd focus:outline-none"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="cth: 081234567890"
              />
            </label>
            {error && <p className="text-[12.5px] font-bold text-rd">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-[14px] border-t border-[#eee] pt-4">
              <span className="text-[19px] font-extrabold text-rd">{fmtRupiah(total)}</span>
              <button className="btn btn-primary" type="submit">
                Konfirmasi Pesanan
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'done' && (
        <div className="px-[26px] py-[34px] text-center">
          <div
            className="mx-auto mb-[14px] grid size-[54px] place-items-center rounded-full bg-[linear-gradient(95deg,#10b981,#0d9488)] text-[26px] font-extrabold text-white"
            aria-hidden="true"
          >
            &#10003;
          </div>
          <h3 className="text-[19px] font-extrabold">Pesanan Berhasil Dibuat</h3>
          <p className="my-1.5 mb-1 text-[13px] text-rd-muted">
            Kode Booking: <b className="text-rd-teal">{booking.id}</b>
          </p>
          <div className="my-3 mb-4 flex flex-col gap-[3px] rounded-[10px] border border-rd-border bg-rd-soft px-[14px] py-3 text-[13px] text-rd-text">
            <p>{booking.hotelName}</p>
            <p>
              {fmtDate(booking.checkIn)} &rarr; {fmtDate(booking.checkOut)}
            </p>
            <p>
              {booking.nights} malam &middot; {booking.rooms} kamar &middot; {booking.guests} tamu &middot;{' '}
              {booking.roomTypeName}
            </p>
            {(booking.couponDiscount > 0 || booking.memberDiscount > 0) && (
              <p>
                Hemat {booking.couponDiscount > 0 ? `${fmtRupiah(booking.couponDiscount)} (kupon)` : ''}
                {booking.couponDiscount > 0 && booking.memberDiscount > 0 ? ' + ' : ''}
                {booking.memberDiscount > 0 ? `${fmtRupiah(booking.memberDiscount)} (member)` : ''}
              </p>
            )}
            <p className="text-[15px] font-extrabold text-rd">{fmtRupiah(booking.totalPrice)}</p>
          </div>
          <p className="mt-2 text-[12px] text-rd-muted">
            Simulasi demo — pesanan tersimpan di perangkat ini (localStorage).
          </p>
          <button className="btn btn-primary mt-[18px]" type="button" onClick={onClose}>
            Selesai
          </button>
        </div>
      )}

      {lightboxOpen && (
        <Modal onClose={() => setLightboxOpen(false)} labelledBy="lightbox-title">
          <div className="px-5 pt-[18px] pb-[22px]">
            <h3 id="lightbox-title" className="mb-3 text-[19px] font-extrabold leading-[1.3]">
              {hotel.name} &mdash; Foto {imgIdx + 1} dari {hotel.gallery.length}
            </h3>
            <img
              className="w-full rounded-lg"
              src={hotel.gallery[imgIdx]}
              alt={`${hotel.name} foto ${imgIdx + 1}`}
            />
            <div className="mt-3 flex items-center justify-between">
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() => setImgIdx((i) => (i - 1 + hotel.gallery.length) % hotel.gallery.length)}
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

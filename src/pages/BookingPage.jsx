import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useHotels } from '../hooks/useCatalog.js'
import { parseSearchParams } from '../utils/searchParams.js'
import { fmtRupiah, fmtDate } from '../utils/format.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { Skeleton } from '../components/Skeletons.jsx'
import { createBooking } from '../services/booking.js'
import { applyCoupon } from '../services/coupon.js'
import { getMember } from '../services/member.js'

const MEMBER_DISCOUNT_PCT = 0.1

export default function BookingPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { hotels, loading } = useHotels()
  const hotel = hotels.find((h) => String(h.id) === String(id))

  const search = parseSearchParams(searchParams)
  const roomTypeId = searchParams.get('roomTypeId') || hotel?.roomTypes?.[0]?.id || 'standard'
  const rooms = Number(searchParams.get('rooms')) || 1
  const adults = Number(searchParams.get('adults')) || 2
  const children = Number(searchParams.get('children')) || 0
  const nights = search.nights || 1
  const hasDates = search.nights > 0
  const guests = adults + children

  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [isMember, setIsMember] = useState(false)

  const roomType = hotel?.roomTypes?.find((t) => t.id === roomTypeId) ??
    hotel?.roomTypes?.[0] ?? { id: 'standard', name: 'Standar', price: hotel?.price ?? 0 }

  const subtotal = roomType.price * nights * rooms
  const couponAmount = coupon ? Math.min(Math.round((subtotal * coupon.pct) / 100), coupon.maxDiscount) : 0
  const afterCoupon = subtotal - couponAmount
  const memberDiscount = isMember ? Math.round(afterCoupon * MEMBER_DISCOUNT_PCT) : 0
  const total = afterCoupon - memberDiscount

  usePageMeta(
    hotel ? `Pesan ${hotel.name}` : 'Pemesanan Penginapan',
    hotel
      ? `Selesaikan pemesanan ${hotel.name} di ${hotel.area}, ${hotel.city} melalui WismaKu.`
      : 'Selesaikan pemesanan penginapan di WismaKu.',
  )

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
    setBusy(true)
    try {
      const booking = await createBooking({
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelImg: hotel.img,
        checkIn: hasDates ? search.checkIn : null,
        checkOut: hasDates ? search.checkOut : null,
        nights,
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
      navigate(`/pesanan/sukses/${booking.id}`)
    } catch (err) {
      setError(err.message || 'Gagal membuat pesanan.')
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopBar />
        <Header />
        <main id="main" className="min-h-[60vh] bg-[#f7f7f7] py-6 pb-16">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <Skeleton className="mb-6 h-8 w-1/3 rounded-lg" />
            <div className="grid items-start gap-6 min-[993px]:grid-cols-[1fr_360px]">
              <div className="grid gap-6">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-56 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-[360px] w-full rounded-2xl max-[992px]:h-64" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!hotel) {
    return (
      <>
        <TopBar />
        <Header />
        <main id="main" className="min-h-[60vh] py-8">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <div className="rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <p className="mb-[18px] text-rd-muted">Penginapan tidak ditemukan.</p>
              <Link className="btn btn-primary" to="/hasil">
                Lihat Semua Hotel
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] bg-[#f7f7f7] py-6 pb-16">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <nav
            className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-rd-muted"
            aria-label="Breadcrumb"
          >
            <Link className="font-semibold text-rd-muted transition-colors hover:text-rd" to="/">
              Beranda
            </Link>
            <span aria-hidden="true">&rsaquo;</span>
            <Link className="font-semibold text-rd-muted transition-colors hover:text-rd" to="/hasil">
              Penginapan
            </Link>
            <span aria-hidden="true">&rsaquo;</span>
            <Link
              className="font-semibold text-rd-muted transition-colors hover:text-rd"
              to={`/hotel/${hotel.id}`}
            >
              {hotel.name}
            </Link>
            <span aria-hidden="true">&rsaquo;</span>
            <span className="font-bold text-rd-text" aria-current="page">
              Pemesanan
            </span>
          </nav>
          <h1 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">Pemesanan Penginapan</h1>

          <div className="mt-6 grid items-start gap-6 min-[993px]:grid-cols-[1fr_360px]">
            <div className="flex min-w-0 flex-col gap-6">
              <section className="rounded-2xl border border-rd-border bg-white p-5">
                <h2 className="text-[18px] font-extrabold">Detail Pemesanan</h2>
                <div className="mt-4 flex gap-4">
                  <img
                    className="h-[84px] w-[120px] shrink-0 rounded-[10px] object-cover"
                    src={hotel.img}
                    alt={hotel.name}
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] font-extrabold leading-[1.35]">{hotel.name}</p>
                    <p className="mt-0.5 text-[12.5px] text-rd-muted">
                      {hotel.area}, {hotel.city}
                    </p>
                    <p className="mt-1 text-[12.5px] font-bold text-rd-teal">
                      {hotel.rating} &#9733; ({hotel.reviews} ulasan)
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-1.5 rounded-[10px] border border-rd-border bg-rd-soft px-[14px] py-3 text-[13px] text-rd-text">
                  {hasDates ? (
                    <p>
                      {fmtDate(search.checkIn)} &rarr; {fmtDate(search.checkOut)} ({nights} malam)
                    </p>
                  ) : (
                    <p className="text-rd-muted">Tanpa tanggal terpilih &mdash; estimasi {nights} malam.</p>
                  )}
                  <p>
                    {rooms} kamar &middot; {guests} tamu &middot; Tipe {roomType.name}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="mb-1.5 text-[12.5px] font-extrabold text-rd-text">Kode Kupon</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-[9px] border border-rd-border px-3 py-[9px] text-[13.5px] focus:border-rd focus:outline-none"
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value)
                        setCouponError('')
                      }}
                      placeholder="cth: WISMA20"
                      aria-label="Kode kupon"
                    />
                    <button className="btn btn-outline btn-sm" type="button" onClick={handleCoupon}>
                      Pakai
                    </button>
                  </div>
                  {couponError && <p className="mt-1 text-[12.5px] font-bold text-rd">{couponError}</p>}
                  {coupon && (
                    <p className="mt-1 text-[12.5px] font-bold text-rd-teal">
                      Kupon {coupon.code} berlaku &mdash; hemat {fmtRupiah(couponAmount)}
                    </p>
                  )}
                  {isMember && (
                    <p className="mt-1 text-[12.5px] font-bold text-rd-teal">
                      &#9733; Diskon member WismaClub 10% diterapkan
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-rd-border bg-white p-5">
                <h2 className="text-[18px] font-extrabold">Data Pemesan</h2>
                <form className="mt-4 flex flex-col gap-3" onSubmit={submit} noValidate id="booking-form">
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
                  <button className="btn btn-primary min-[993px]:hidden" type="submit" disabled={busy}>
                    {busy ? 'Memproses...' : `Konfirmasi Pesanan - ${fmtRupiah(total)}`}
                  </button>
                </form>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-rd-border bg-white p-4 shadow-rd min-[993px]:sticky min-[993px]:top-[90px]">
              <p className="text-[15px] font-extrabold">Ringkasan Harga</p>
              <div className="mt-3 flex flex-col gap-1.5">
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
                <div className="mt-0.5 flex justify-between gap-2.5 border-t border-dashed border-[#ddd] pt-2 text-[16px] font-extrabold text-rd">
                  <span>Total</span>
                  <b>{fmtRupiah(total)}</b>
                </div>
              </div>
              <button
                className="btn btn-primary mt-4 w-full"
                type="submit"
                form="booking-form"
                disabled={busy}
              >
                {busy ? 'Memproses...' : 'Konfirmasi Pesanan'}
              </button>
              <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-rd-muted">
                Simulasi demo &mdash; pesanan tersimpan di perangkat ini (localStorage).
              </p>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

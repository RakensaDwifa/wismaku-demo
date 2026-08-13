import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { getBookings } from '../services/booking.js'
import { fmtRupiah, fmtDate } from '../utils/format.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

export default function BookingSuccessPage() {
  usePageMeta('Pesanan Berhasil', 'Detail pemesanan Anda di WismaKu.')
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let live = true
    getBookings()
      .then((list) => {
        if (live) setBooking(list.find((b) => b.id === id) ?? null)
      })
      .catch(() => {
        if (live) setBooking(null)
      })
      .finally(() => {
        if (live) setLoaded(true)
      })
    return () => {
      live = false
    }
  }, [id])

  const subtotal = booking ? booking.roomPrice * booking.nights * booking.rooms : 0

  return (
    <>
      <TopBar />
      <Header />
      <main className="min-h-[60vh] py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">Detail Pesanan</h2>
            <Link className="btn btn-outline btn-sm max-[640px]:hidden" to="/bookings">
              Lihat Pemesanan Saya
            </Link>
          </div>

          {!loaded ? (
            <p className="mt-6 text-sm text-rd-muted">Memuat detail pesanan&hellip;</p>
          ) : booking ? (
            <div className="mt-6 max-w-[720px]">
              <div className="mb-4 flex items-center gap-[14px] rounded-[14px] border border-rd-border bg-white p-[14px]">
                <div
                  className="grid size-[54px] shrink-0 place-items-center rounded-full bg-[linear-gradient(95deg,#10b981,#0d9488)] text-[26px] font-extrabold text-white"
                  aria-hidden="true"
                >
                  &#10003;
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold">Pesanan Berhasil Dibuat</h3>
                  <p className="text-[13px] text-rd-muted">
                    Kode Booking: <b className="text-rd-teal">{booking.id}</b> &middot;{' '}
                    <span
                      className={`rounded-full px-[9px] py-[3px] text-[11px] font-extrabold ${
                        booking.status === 'cancelled'
                          ? 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
                          : 'bg-[rgba(20,184,166,0.12)] text-rd-teal'
                      }`}
                    >
                      {booking.status === 'cancelled' ? 'Dibatalkan' : 'Dikonfirmasi'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[14px] border border-rd-border bg-white">
                <div className="flex flex-col gap-[14px] p-[14px] sm:flex-row">
                  <img
                    className="h-[130px] w-full shrink-0 rounded-[10px] object-cover sm:w-[200px]"
                    src={booking.hotelImg}
                    alt={booking.hotelName}
                  />
                  <div className="flex flex-1 flex-col gap-1 text-[13.5px]">
                    <Link
                      className="text-[15px] font-extrabold text-rd-text hover:text-rd"
                      to={`/hotel/${booking.hotelId}`}
                    >
                      {booking.hotelName}
                    </Link>
                    <span className="text-rd-muted">
                      {fmtDate(booking.checkIn)} &rarr; {fmtDate(booking.checkOut)}
                    </span>
                    <span className="text-rd-muted">
                      {booking.nights} malam &middot; {booking.rooms} kamar &middot; {booking.guests} tamu
                      &middot; {booking.roomTypeName}
                    </span>
                    <span className="text-rd-muted">
                      Harga kamar {fmtRupiah(booking.roomPrice)} / malam
                    </span>
                  </div>
                </div>

                <div className="grid gap-px border-t border-rd-border bg-rd-border sm:grid-cols-2">
                  <div className="bg-white p-[18px]">
                    <h4 className="mb-2.5 text-[14px] font-extrabold">Rincian Pembayaran</h4>
                    <div className="flex flex-col gap-1.5 text-[13.5px] text-rd-muted">
                      <span className="flex justify-between gap-3">
                        <span>Subtotal</span>
                        <b className="text-rd-text">{fmtRupiah(subtotal)}</b>
                      </span>
                      {booking.couponDiscount > 0 && (
                        <span className="flex justify-between gap-3">
                          <span>Kupon {booking.couponCode}</span>
                          <b className="text-rd-green">-{fmtRupiah(booking.couponDiscount)}</b>
                        </span>
                      )}
                      {booking.memberDiscount > 0 && (
                        <span className="flex justify-between gap-3">
                          <span>Diskon member WismaClub</span>
                          <b className="text-rd-green">-{fmtRupiah(booking.memberDiscount)}</b>
                        </span>
                      )}
                      <span className="mt-1 flex justify-between gap-3 border-t border-dashed border-[#ddd] pt-2 text-[15px] font-extrabold">
                        <span className="text-rd-text">Total</span>
                        <span className="text-rd">{fmtRupiah(booking.totalPrice)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-[18px]">
                    <h4 className="mb-2.5 text-[14px] font-extrabold">Data Tamu</h4>
                    <div className="flex flex-col gap-1.5 text-[13.5px] text-rd-muted">
                      <span>
                        Nama: <b className="text-rd-text">{booking.guestName}</b>
                      </span>
                      <span>Email: {booking.email}</span>
                      <span>No. HP: {booking.phone}</span>
                      <span>Dibuat: {fmtDate(booking.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link className="btn btn-primary" to="/">
                  Kembali ke Beranda
                </Link>
                <Link className="btn btn-outline" to="/bookings">
                  Lihat Pemesanan Saya
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <p className="mb-[18px] text-rd-muted">Pesanan tidak ditemukan.</p>
              <Link className="btn btn-primary" to="/">
                Cari Penginapan
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import BookingCard from '../components/BookingCard.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { Skeleton } from '../components/Skeletons.jsx'
import { getBookings, cancelBooking } from '../services/booking.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import '../styles/app.css'

export default function BookingsPage() {
  usePageMeta('Pemesanan Saya', 'Kelola pemesanan penginapan Anda di WismaKu.')
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setOrders(await getBookings())
      setError(null)
    } catch (err) {
      setError(err)
    }
  }

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const list = await getBookings()
        if (live) setOrders(list)
      } catch (err) {
        if (live) setError(err)
      }
    }
    sync()
    window.addEventListener('wismaku:bookings-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:bookings-changed', sync)
    }
  }, [])

  const remove = async (id) => {
    try {
      await cancelBooking(id)
    } catch {
      /* abaikan */
    }
    load()
  }

  return (
    <>
      <TopBar />
      <Header />
      <main className="min-h-[60vh] py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">Pemesanan Saya</h2>
            <Link className="btn btn-outline btn-sm max-[640px]:hidden" to="/">
              &larr; Kembali ke Beranda
            </Link>
          </div>
          {error ? (
            <ErrorBanner message="Gagal memuat pesanan." onRetry={load} />
          ) : !orders ? (
            <div
              className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5"
              aria-hidden="true"
            >
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="rounded-[14px]" style={{ height: 140, borderRadius: 14 }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <p className="mb-[18px] text-rd-muted">Belum ada pemesanan.</p>
              <Link className="btn btn-primary" to="/">
                Cari Penginapan
              </Link>
            </div>
          ) : (
            <ul className="grid list-none gap-[14px] p-0">
              {orders.map((o) => (
                <BookingCard key={o.id} booking={o} onCancel={remove} />
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import BookingCard from '../components/BookingCard.jsx'
import { getBookings, cancelBooking } from '../services/booking.js'
import '../styles/app.css'

export default function BookingsPage() {
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
      <main className="section page-main">
        <div className="container">
          <div className="promo-header">
            <h2 className="section-title">Pemesanan Saya</h2>
            <Link className="btn btn-outline btn-sm" to="/">
              &larr; Kembali ke Beranda
            </Link>
          </div>
          {error ? (
            <div className="error-banner" role="alert">
              <span>Gagal memuat pesanan.</span>
              <button className="btn btn-outline btn-sm" type="button" onClick={load}>
                Coba Lagi
              </button>
            </div>
          ) : !orders ? (
            <div className="hotels-grid" aria-hidden="true">
              {Array.from({ length: 2 }).map((_, i) => (
                <div className="skeleton" key={i} style={{ height: 140, borderRadius: 14 }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="hotels-empty">
              <p>Belum ada pemesanan.</p>
              <Link className="btn btn-primary" to="/">
                Cari Penginapan
              </Link>
            </div>
          ) : (
            <ul className="orders-list bookings-list">
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

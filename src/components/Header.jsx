import { useEffect, useRef, useState } from 'react'
import { getBookings, cancelBooking } from '../services/booking.js'
import { getMember } from '../services/member.js'

const fmtRupiah = (n) => 'Rp ' + n.toLocaleString('id-ID')

const fmtDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T00:00:00'))
    : '-'

const navLinks = [
  { label: 'Hotel di Indonesia', href: '#hotels' },
  { label: 'Promo', href: '#promo' },
  { label: 'WismaClub', href: '#redclub' },
  { label: 'Daftarkan Properti', href: '#partner' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [member, setMember] = useState(null)
  const ordersRef = useRef(null)

  const refreshOrders = () => setOrders(getBookings())

  const toggleOrders = () => {
    if (!ordersOpen) refreshOrders()
    setOrdersOpen((v) => !v)
  }

  const removeOrder = (id) => {
    cancelBooking(id)
    refreshOrders()
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const close = (e) => {
      if (ordersRef.current && !ordersRef.current.contains(e.target)) setOrdersOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    const sync = () => setOrders(getBookings())
    sync()
    window.addEventListener('wismaku:bookings-changed', sync)
    return () => window.removeEventListener('wismaku:bookings-changed', sync)
  }, [])

  useEffect(() => {
    const sync = () => setMember(getMember())
    sync()
    window.addEventListener('wismaku:members-changed', sync)
    return () => window.removeEventListener('wismaku:members-changed', sync)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="header">
      <div className="header-inner container">
        <a className="logo" href="#top" aria-label="WismaKu Beranda">
          <svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true">
            <rect x="6" y="4" width="36" height="40" rx="6" fill="#14B8A6" />
            <rect x="10" y="8" width="28" height="32" rx="3" fill="#FFF" />
            <rect x="12" y="10" width="24" height="28" rx="2" fill="#14B8A6" />
            <rect x="27" y="20" width="10" height="7" rx="2" fill="#FFF" />
            <rect x="27" y="20" width="5" height="7" rx="1.5" fill="#14B8A6" />
            <circle cx="33" cy="23.5" r="1.6" fill="#FFF" />
          </svg>
          <span className="logo-text">
            Wisma<strong>Ku</strong>
          </span>
        </a>
        <nav className="nav" aria-label="Navigasi utama">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
          ))}
        </nav>
        <div className="header-actions">
          {member && (
            <span className="member-chip" title={`Member WismaClub: ${member.name}`}>&#9733; Member</span>
          )}
          <div className="orders-wrap" ref={ordersRef}>
            {orders.length > 0 && (
              <span className="orders-count" aria-hidden="true">{orders.length}</span>
            )}
            <button className="btn btn-outline btn-sm orders-btn" type="button" onClick={toggleOrders}>
              Pesanan Saya{orders.length > 0 ? ` (${orders.length})` : ''}
            </button>
            {ordersOpen && (
              <div className="orders-panel" role="dialog" aria-label="Pesanan Saya">
                <div className="orders-panel__head">
                  <b>Pesanan Saya</b>
                  <button type="button" className="drawer-close" onClick={() => setOrdersOpen(false)} aria-label="Tutup">&times;</button>
                </div>
                {orders.length === 0 ? (
                  <p className="orders-empty">Belum ada pesanan.</p>
                ) : (
                  <ul className="orders-list">
                    {orders.map((o) => (
                      <li className="orders-item" key={o.id}>
                        <img src={o.hotelImg} alt="" />
                        <div className="orders-item__info">
                          <b>{o.hotelName}</b>
                          <span>{fmtDate(o.checkIn)} &rarr; {fmtDate(o.checkOut)}</span>
                          <span>{o.nights} malam &middot; {fmtRupiah(o.totalPrice)}</span>
                          <small>Kode: {o.id}</small>
                        </div>
                        <button className="orders-cancel" type="button" onClick={() => removeOrder(o.id)}>Batal</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <button className="btn btn-outline is-disabled" type="button" disabled>Masuk</button>
          <button className="btn btn-primary is-disabled" type="button" disabled>Daftar</button>
          <button
            className={`burger${menuOpen ? ' is-open' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Tutup menu' : 'Menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /> <span /> <span />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="drawer">
          <div className="drawer-backdrop" onClick={closeMenu} aria-hidden="true" />
          <div className="drawer-panel" role="dialog" aria-label="Menu navigasi">
            <div className="drawer-head">
              <span className="logo-text">Wisma<strong>Ku</strong></span>
              <button className="drawer-close" type="button" aria-label="Tutup menu" onClick={closeMenu}>&times;</button>
            </div>
            <nav className="drawer-nav">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="drawer-link" onClick={closeMenu}>{l.label}</a>
              ))}
            </nav>
            <div className="drawer-foot">
              <p>Login &amp; pendaftaran segera hadir</p>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
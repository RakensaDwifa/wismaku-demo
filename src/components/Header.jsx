import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBookings } from '../services/booking.js'
import { getMember } from '../services/member.js'
import { getFavorites } from '../services/favorite.js'
import useFocusTrap from '../hooks/useFocusTrap.js'

const navLinks = [
  { label: 'Hotel di Indonesia', href: '#hotels' },
  { label: 'Promo', href: '#promo' },
  { label: 'WismaClub', href: '#redclub' },
  { label: 'Daftarkan Properti', href: '#partner' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [favCount, setFavCount] = useState(0)
  const [member, setMember] = useState(null)
  const drawerRef = useRef(null)

  useFocusTrap(drawerRef, { active: menuOpen })

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const list = await getBookings()
        if (live) setOrders(list)
      } catch {
        if (live) setOrders([])
      }
    }
    sync()
    window.addEventListener('wismaku:bookings-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:bookings-changed', sync)
    }
  }, [])

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const list = await getFavorites()
        if (live) setFavCount(list.length)
      } catch {
        if (live) setFavCount(0)
      }
    }
    sync()
    window.addEventListener('wismaku:favorites-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:favorites-changed', sync)
    }
  }, [])

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const m = await getMember()
        if (live) setMember(m)
      } catch {
        if (live) setMember(null)
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
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (menuOpen) drawerRef.current?.focus()
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="header">
      <div className="header-inner container">
        <Link className="logo" to="/" aria-label="WismaKu Beranda">
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
        </Link>
        <nav className="nav" aria-label="Navigasi utama">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          {member && (
            <span className="member-chip" title={`Member WismaClub: ${member.name}`}>
              &#9733; Member
            </span>
          )}
          <Link
            className="fav-link"
            to="/favorites"
            aria-label={`Hotel favorit${favCount > 0 ? ` (${favCount})` : ''}`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
            {favCount > 0 && (
              <span className="orders-count" aria-hidden="true">
                {favCount}
              </span>
            )}
          </Link>
          <Link className="btn btn-outline btn-sm orders-btn" to="/bookings">
            Pesanan Saya{orders.length > 0 ? ` (${orders.length})` : ''}
          </Link>
          <button className="btn btn-outline is-disabled" type="button" disabled>
            Masuk
          </button>
          <button className="btn btn-primary is-disabled" type="button" disabled>
            Daftar
          </button>
          <button
            className={`burger${menuOpen ? ' is-open' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            aria-controls="drawer-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /> <span /> <span />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="drawer">
          <div className="drawer-backdrop" onClick={closeMenu} aria-hidden="true" />
          <div
            className="drawer-panel"
            role="dialog"
            aria-label="Menu navigasi"
            id="drawer-nav"
            ref={drawerRef}
            tabIndex={-1}
          >
            <div className="drawer-head">
              <span className="logo-text">
                Wisma<strong>Ku</strong>
              </span>
              <button className="drawer-close" type="button" aria-label="Tutup menu" onClick={closeMenu}>
                &times;
              </button>
            </div>
            <nav className="drawer-nav">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="drawer-link" onClick={closeMenu}>
                  {l.label}
                </a>
              ))}
              <Link className="drawer-link" to="/bookings" onClick={closeMenu}>
                Pesanan Saya{orders.length > 0 ? ` (${orders.length})` : ''}
              </Link>
              <Link className="drawer-link" to="/favorites" onClick={closeMenu}>
                Hotel Favorit{favCount > 0 ? ` (${favCount})` : ''}
              </Link>
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

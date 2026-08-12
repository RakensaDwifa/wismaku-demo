import { useEffect, useState } from 'react'

const navLinks = [
  { label: 'Hotel di Indonesia', href: '#hotels' },
  { label: 'Promo', href: '#promo' },
  { label: 'RedClub', href: '#redclub' },
  { label: 'Daftarkan Properti', href: '#partner' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="header">
      <div className="header-inner container">
        <a className="logo" href="#top" aria-label="RedDoo Beranda">
          <svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true">
            <rect x="6" y="4" width="36" height="40" rx="6" fill="#EC2224" />
            <rect x="10" y="8" width="28" height="32" rx="3" fill="#FFF" />
            <rect x="12" y="10" width="24" height="28" rx="2" fill="#EC2224" />
            <rect x="27" y="20" width="10" height="7" rx="2" fill="#FFF" />
            <rect x="27" y="20" width="5" height="7" rx="1.5" fill="#EC2224" />
            <circle cx="33" cy="23.5" r="1.6" fill="#FFF" />
          </svg>
          <span className="logo-text">
            Red<strong>Doo</strong>
          </span>
        </a>
        <nav className="nav" aria-label="Navigasi utama">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
          ))}
        </nav>
        <div className="header-actions">
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
              <span className="logo-text">Red<strong>Doo</strong></span>
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
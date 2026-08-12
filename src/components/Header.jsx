export default function Header() {
  return (
    <header className="header">
      <div className="header-inner container">
        <a className="logo" href="#" aria-label="RedDoo Beranda">
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
          <a href="#hotels" className="nav-link">Hotel di Indonesia</a>
          <a href="#promo" className="nav-link">Promo</a>
          <a href="#brands" className="nav-link">RedClub</a>
          <a href="#partner" className="nav-link">Daftarkan Properti</a>
        </nav>
        <div className="header-actions">
          <button className="btn btn-outline" type="button">Masuk</button>
          <button className="btn btn-primary" type="button">Daftar</button>
          <button className="burger" type="button" aria-label="Menu">
            <span /> <span /> <span />
          </button>
        </div>
      </div>
    </header>
  )
}
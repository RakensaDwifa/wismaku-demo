export default function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-inner container">
        <div className="topbar-left">
          <span className="topbar-item">
            <svg className="topbar-icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M6.6 10.8c1.5 2.9 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
            </svg>
            Layanan Pelanggan: 021-8063-5835
          </span>
        </div>
        <div className="topbar-right">
          <button className="topbar-link is-disabled" type="button" disabled>
            Bantuan
          </button>
          <span className="topbar-sep" />
          <button className="topbar-link is-disabled" type="button" disabled>
            IDR &bull; ID
          </button>
          <span className="topbar-sep" />
          <button className="topbar-link is-disabled" type="button" disabled>
            Masuk
          </button>
          <button className="topbar-link topbar-strong is-disabled" type="button" disabled>
            Daftar
          </button>
        </div>
      </div>
    </div>
  )
}

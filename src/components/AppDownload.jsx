export default function AppDownload() {
  return (
    <section className="app-download">
      <div className="container app-download-inner">
        <div className="app-download-info">
          <h2>Booking Lebih Cepat Lewat Aplikasi RedDoo</h2>
          <p>Diskon khusus aplikasi, notifikasi harga promo, dan riwayat booking dalam satu tempat.</p>
          <div className="app-badges">
            <button type="button" className="app-badge is-disabled" disabled>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M17.5 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1-.1 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.2-2.4 1.2-2.5-.1 0-2.3-.9-2.5-3.5zM15 6.6c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" />
              </svg>
              <span>
                <small>Download di</small>
                <b>App Store</b>
              </span>
            </button>
            <button type="button" className="app-badge is-disabled" disabled>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M3.5 2.4L14 12 3.5 21.6c-.3-.2-.5-.6-.6-1L2.7 4c0-.4.2-.8.5-1l.3-.6zM15.8 10.4l2.8 1.6c.8.5.8 1.4 0 1.8l-2.8 1.7L10.6 12l5.2-1.6zM5.2 1.2c.5-.2 1.2 0 1.7.3l8.9 5.2-3.4 3.3-7.2-8.8zM5.2 22.8L12.4 14l3.4 3.3-8.9 5.2c-.5.3-1.2.5-1.7.3z" />
              </svg>
              <span>
                <small>Dapatkan di</small>
                <b>Google Play</b>
              </span>
            </button>
          </div>
        </div>
        <div className="app-download-art" aria-hidden="true">
          <svg viewBox="0 0 200 260" width="120" height="156">
            <rect x="30" y="0" width="140" height="260" rx="18" fill="#fff" />
            <rect x="42" y="16" width="116" height="228" rx="12" fill="#F3FBFD" />
            <rect x="52" y="30" width="96" height="8" rx="4" fill="#EC2224" />
            <rect x="52" y="52" width="96" height="40" rx="6" fill="#D3EEEE" />
            <rect x="52" y="104" width="46" height="8" rx="4" fill="#303030" opacity=".25" />
            <rect x="52" y="120" width="70" height="8" rx="4" fill="#303030" opacity=".15" />
            <rect x="52" y="140" width="96" height="44" rx="6" fill="#D3EEEE" />
            <rect x="52" y="196" width="96" height="30" rx="8" fill="#FB4042" />
            <rect x="52" y="203" width="60" height="6" rx="3" fill="#fff" opacity=".9" />
            <circle cx="100" cy="262" r="6" fill="#EC2224" />
          </svg>
        </div>
      </div>
    </section>
  )
}
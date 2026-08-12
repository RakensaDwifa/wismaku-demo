import { useState } from 'react'

const columns = [
  {
    title: 'Perusahaan',
    links: ['Tentang Kami', 'Karier', 'Blog Travel', 'Daftarkan Properti', 'WismaClub'],
  },
  {
    title: 'Bantuan',
    links: ['Pusat Bantuan / FAQ', 'Hubungi Kami', 'Cara Booking', 'Kebijakan Privasi', 'Syarat & Ketentuan'],
  },
  {
    title: 'Populer',
    links: ['Hotel Jakarta', 'Hotel Bandung', 'Hotel Yogyakarta', 'Hotel Bali', 'Hotel Surabaya'],
  },
]

export default function Footer({ onOpenPartner }) {
  const [expanded, setExpanded] = useState(false)
  const seo =
    'WismaKu adalah platform pemesanan penginapan dan hotel berbasis teknologi yang menyediakan akomodasi bersih, nyaman, dan terjangkau di lebih dari 100 kota strategis di Indonesia. Dari hotel budget, apartemen harian, hingga vila, semua bisa dipesan secara online dengan mudah melalui website maupun aplikasi. Temukan penginapan terdekat dengan harga mulai Rp 99rb per malam lengkap dengan promo dan diskon menarik setiap harinya.'

  return (
    <footer className="footer">
      <div className="footer-seo">
        <div className="container">
          <p className={expanded ? 'footer-seo-text expanded' : 'footer-seo-text'}>
            {expanded ? seo : seo.slice(0, 220) + '...'}
          </p>
          <button className="footer-seo-toggle" type="button" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Sembunyikan' : 'Baca selengkapnya'}
          </button>
        </div>
      </div>

      <div className="footer-main">
        <div className="container footer-grid">
          <div className="footer-brand">
            <a className="logo logo--footer" href="#top">
              <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
                <rect x="6" y="4" width="36" height="40" rx="6" fill="#14B8A6" />
                <rect x="10" y="8" width="28" height="32" rx="3" fill="#FFF" />
                <rect x="12" y="10" width="24" height="28" rx="2" fill="#14B8A6" />
                <rect x="27" y="20" width="10" height="7" rx="2" fill="#FFF" />
                <rect x="27" y="20" width="5" height="7" rx="1.5" fill="#14B8A6" />
                <circle cx="33" cy="23.5" r="1.6" fill="#FFF" />
              </svg>
              <span className="logo-text">Wisma<strong>Ku</strong></span>
            </a>
            <p className="footer-desc">
              Platform pemesanan penginapan terjangkau untuk perjalanan bisnis maupun liburan. Kamar
              bersih, free WiFi, dan harga transparan.
            </p>
            <p className="footer-contact">
              Layanan Pelanggan: 021-8063-5835
              <br />
              cs-indonesia@wismaku.id
            </p>
          </div>
          {columns.map((col) => (
            <div className="footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#partner"
                      className="footer-link"
                      aria-disabled={l !== 'Daftarkan Properti'}
                      onClick={(e) => {
                        if (l === 'Daftarkan Properti') {
                          e.preventDefault()
                          onOpenPartner?.()
                        } else {
                          e.preventDefault()
                        }
                      }}
                    >{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="footer-col">
            <h4>Ikuti Kami</h4>
            <div className="footer-social">
              {['Facebook', 'Instagram', 'X', 'YouTube'].map((s) => (
                <a key={s} href="#" className="footer-social-btn is-disabled" aria-label={s} title={s} onClick={(e) => e.preventDefault()}>
                  {s.charAt(0)}
                </a>
              ))}
            </div>
            <h4 className="footer-pay-title">Metode Pembayaran</h4>
            <div className="footer-pay">
              {['Bank Transfer', 'Kartu Kredit', 'Alfamart', 'e-Wallet', 'Pay at Hotel'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>&copy; {new Date().getFullYear()} WismaKu. Semua hak dilindungi. Demo tiruan untuk pembelajaran.</p>
        </div>
      </div>
    </footer>
  )
}
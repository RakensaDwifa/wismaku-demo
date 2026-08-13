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
    <footer>
      <div className="bg-rd-soft py-7">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <p className="text-[12.5px] leading-[1.75] text-[#4c515a]">
            {expanded ? seo : seo.slice(0, 220) + '...'}
          </p>
          <button
            className="mt-2.5 text-[12.5px] font-extrabold text-rd-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
            type="button"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Sembunyikan' : 'Baca selengkapnya'}
          </button>
        </div>
      </div>

      <div className="bg-rd-footer py-12 text-[#d6d6d6]">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] gap-9 px-5 max-[992px]:grid-cols-2 max-sm:grid-cols-1">
          <div className="max-[992px]:col-span-2">
            <a className="inline-flex items-center gap-2" href="#top">
              <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
                <rect x="6" y="4" width="36" height="40" rx="6" fill="#14B8A6" />
                <rect x="10" y="8" width="28" height="32" rx="3" fill="#FFF" />
                <rect x="12" y="10" width="24" height="28" rx="2" fill="#14B8A6" />
                <rect x="27" y="20" width="10" height="7" rx="2" fill="#FFF" />
                <rect x="27" y="20" width="5" height="7" rx="1.5" fill="#14B8A6" />
                <circle cx="33" cy="23.5" r="1.6" fill="#FFF" />
              </svg>
              <span className="text-2xl font-medium tracking-tight text-white">
                Wisma<strong className="font-extrabold text-[#5eead4]">Ku</strong>
              </span>
            </a>
            <p className="my-3.5 text-[13px] leading-[1.65] text-[#b9b9b9]">
              Platform pemesanan penginapan terjangkau untuk perjalanan bisnis maupun liburan. Kamar bersih,
              free WiFi, dan harga transparan.
            </p>
            <p className="text-[13px] leading-[1.75] text-[#c9c9c9]">
              Layanan Pelanggan: 021-8063-5835
              <br />
              cs-indonesia@wismaku.id
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[15px] font-extrabold text-white">{col.title}</h4>
              <ul className="list-none">
                {col.links.map((l) => (
                  <li className="mb-2.5" key={l}>
                    <a
                      href="#partner"
                      className="cursor-not-allowed text-[13px] text-[#b9b9b9] opacity-65"
                      aria-disabled={l !== 'Daftarkan Properti'}
                      onClick={(e) => {
                        if (l === 'Daftarkan Properti') {
                          e.preventDefault()
                          onOpenPartner?.()
                        } else {
                          e.preventDefault()
                        }
                      }}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="mb-4 text-[15px] font-extrabold text-white">Ikuti Kami</h4>
            <div className="flex gap-2.5">
              {['Facebook', 'Instagram', 'X', 'YouTube'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="grid size-9 cursor-not-allowed place-items-center rounded-full bg-[#555] text-sm font-extrabold text-white transition-colors hover:bg-[#555]"
                  aria-label={s}
                  title={s}
                  onClick={(e) => e.preventDefault()}
                >
                  {s.charAt(0)}
                </a>
              ))}
            </div>
            <h4 className="mt-[22px] mb-4 text-[15px] font-extrabold text-white">Metode Pembayaran</h4>
            <div className="flex flex-wrap gap-2">
              {['Bank Transfer', 'Kartu Kredit', 'Alfamart', 'e-Wallet', 'Pay at Hotel'].map((m) => (
                <span className="rounded-md border border-[#666] px-2 py-1 text-[11.5px] text-[#ccc]" key={m}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#2e2e2e] py-[18px]">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-5 text-[12.5px] text-[#999] max-sm:flex-col max-sm:text-center">
          <p>
            &copy; {new Date().getFullYear()} WismaKu. Semua hak dilindungi. Demo tiruan untuk pembelajaran.
          </p>
        </div>
      </div>
    </footer>
  )
}

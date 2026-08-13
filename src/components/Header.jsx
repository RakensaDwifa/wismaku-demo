import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getBookings } from '../services/booking.js'
import { getMember } from '../services/member.js'
import { getFavorites } from '../services/favorite.js'
import useFocusTrap from '../hooks/useFocusTrap.js'
import { scrollToCenter } from '../utils/scroll.js'

const navLinks = [
  { label: 'Hotel di Indonesia', to: '/hasil' },
  { label: 'Promo', href: '#promo' },
  { label: 'WismaClub', href: '#redclub' },
  { label: 'Daftarkan Properti', href: '#partner' },
]

const navLinkCls =
  'relative py-1.5 text-sm font-semibold text-rd-text transition-colors hover:text-rd focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd'

const btnBase =
  'inline-flex items-center justify-center rounded-lg px-[22px] py-2.5 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [favCount, setFavCount] = useState(0)
  const [member, setMember] = useState(null)
  const drawerRef = useRef(null)
  const navigate = useNavigate()

  const goSection = (e, id) => {
    e.preventDefault()
    if (document.getElementById(id)) {
      scrollToCenter(id)
      return
    }
    navigate('/', { state: { scrollTo: id } })
  }

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
    <header className="sticky top-0 z-100 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.07)]">
      <div className="mx-auto flex min-h-[68px] w-full max-w-[1200px] items-center justify-between gap-6 px-5">
        <Link className="inline-flex shrink-0 items-center gap-2" to="/" aria-label="WismaKu Beranda">
          <svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true">
            <rect x="6" y="4" width="36" height="40" rx="6" fill="#14B8A6" />
            <rect x="10" y="8" width="28" height="32" rx="3" fill="#FFF" />
            <rect x="12" y="10" width="24" height="28" rx="2" fill="#14B8A6" />
            <rect x="27" y="20" width="10" height="7" rx="2" fill="#FFF" />
            <rect x="27" y="20" width="5" height="7" rx="1.5" fill="#14B8A6" />
            <circle cx="33" cy="23.5" r="1.6" fill="#FFF" />
          </svg>
          <span className="text-2xl font-medium tracking-tight text-rd-text">
            Wisma<strong className="font-extrabold text-rd">Ku</strong>
          </span>
        </Link>
        <nav className="hidden gap-7 min-[993px]:flex" aria-label="Navigasi utama">
          {navLinks.map((l) =>
            l.to ? (
              <Link key={l.to} to={l.to} className={navLinkCls}>
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className={navLinkCls}
                onClick={(e) => goSection(e, l.href.slice(1))}
              >
                {l.label}
              </a>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2.5">
          {member && (
            <span
              className="whitespace-nowrap rounded-full bg-gradient-to-br from-rd-grad-1 to-rd-grad-2 px-3 py-1.5 text-xs font-extrabold text-white"
              title={`Member WismaClub: ${member.name}`}
            >
              &#9733; Member
            </span>
          )}
          <Link
            className="relative inline-flex size-10 items-center justify-center rounded-full bg-[#f2f2f2] text-rd-text transition-colors hover:bg-[#fdecec] hover:text-rd focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
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
              <span
                className="absolute -right-1.5 -top-1.5 z-[61] grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rd px-[5px] text-[11px] font-extrabold text-white"
                aria-hidden="true"
              >
                {favCount}
              </span>
            )}
          </Link>
          <Link
            className={`${btnBase} hidden border border-rd bg-white text-rd hover:bg-[#f0fdfa] min-[993px]:inline-flex`}
            to="/bookings"
          >
            Pesanan Saya{orders.length > 0 ? ` (${orders.length})` : ''}
          </Link>
          <button
            className={`${btnBase} hidden cursor-not-allowed border border-rd bg-white text-rd opacity-55 disabled:hover:bg-white min-[993px]:inline-flex`}
            type="button"
            disabled
          >
            Masuk
          </button>
          <button
            className={`${btnBase} hidden cursor-not-allowed bg-rd text-white opacity-55 min-[993px]:inline-flex`}
            type="button"
            disabled
          >
            Daftar
          </button>
          <button
            className={`flex flex-col gap-1 p-1.5 max-[992px]:flex hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd ${menuOpen ? 'is-open' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            aria-controls="drawer-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span
              className={`block h-[2.5px] w-[22px] rounded-[2px] bg-rd-text transition-transform duration-200 ${menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}`}
            />
            <span
              className={`block h-[2.5px] w-[22px] rounded-[2px] bg-rd-text transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`block h-[2.5px] w-[22px] rounded-[2px] bg-rd-text transition-transform duration-200 ${menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`}
            />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-[300]">
          <div className="absolute inset-0 bg-black/45" onClick={closeMenu} aria-hidden="true" />
          <div
            className="absolute right-0 top-0 flex h-full w-[min(320px,82vw)] flex-col bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.18)]"
            role="dialog"
            aria-label="Menu navigasi"
            id="drawer-nav"
            ref={drawerRef}
            tabIndex={-1}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-[18px]">
              <span className="text-2xl font-medium tracking-tight text-rd-text">
                Wisma<strong className="font-extrabold text-rd">Ku</strong>
              </span>
              <button
                className="p-0.5 text-[26px] leading-none text-rd-muted transition-colors hover:text-rd"
                type="button"
                aria-label="Tutup menu"
                onClick={closeMenu}
              >
                &times;
              </button>
            </div>
            <nav className="flex flex-col py-2">
              {navLinks.map((l) =>
                l.to ? (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="border-b border-[#f4f4f4] px-5 py-3.5 text-[15px] font-semibold text-rd-text transition-colors hover:bg-[#f0fdfa] hover:text-rd"
                    onClick={closeMenu}
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    className="border-b border-[#f4f4f4] px-5 py-3.5 text-[15px] font-semibold text-rd-text transition-colors hover:bg-[#f0fdfa] hover:text-rd"
                    onClick={(e) => {
                      closeMenu()
                      goSection(e, l.href.slice(1))
                    }}
                  >
                    {l.label}
                  </a>
                ),
              )}
              <Link
                className="border-b border-[#f4f4f4] px-5 py-3.5 text-[15px] font-semibold text-rd-text transition-colors hover:bg-[#f0fdfa] hover:text-rd"
                to="/bookings"
                onClick={closeMenu}
              >
                Pesanan Saya{orders.length > 0 ? ` (${orders.length})` : ''}
              </Link>
              <Link
                className="border-b border-[#f4f4f4] px-5 py-3.5 text-[15px] font-semibold text-rd-text transition-colors hover:bg-[#f0fdfa] hover:text-rd"
                to="/favorites"
                onClick={closeMenu}
              >
                Hotel Favorit{favCount > 0 ? ` (${favCount})` : ''}
              </Link>
            </nav>
            <div className="mt-auto border-t border-gray-100 px-5 py-[18px] text-xs text-rd-muted">
              <p>Login &amp; pendaftaran segera hadir</p>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

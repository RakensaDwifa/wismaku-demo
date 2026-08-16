import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import HotelCard from '../components/HotelCard.jsx'
import { HotelCardSkeleton } from '../components/Skeletons.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import AuthModal from '../components/AuthModal.jsx'
import { useHotels } from '../hooks/useCatalog.js'
import { getFavorites } from '../services/favorite.js'
import { getActiveUser } from '../services/member.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function FavoritesPage() {
  const { t } = useLanguage()
  usePageMeta(t('favoritesPage.title'), t('favoritesPage.desc'))
  const navigate = useNavigate()
  const { hotels, loading: hotelsLoading } = useHotels()
  const [favIds, setFavIds] = useState([])
  const [user, setUser] = useState(null)
  const [favError, setFavError] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const u = await getActiveUser()
        if (live) setUser(u)
        if (!u) {
          if (live) {
            setFavIds([])
            setFavError(null)
          }
          return
        }
        const list = await getFavorites(u)
        if (live) {
          setFavIds(list)
          setFavError(null)
        }
      } catch (err) {
        if (live) setFavError(err)
      }
    }
    sync()
    window.addEventListener('wismaku:favorites-changed', sync)
    window.addEventListener('wismaku:session-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:favorites-changed', sync)
      window.removeEventListener('wismaku:session-changed', sync)
    }
  }, [])

  const favorites = hotels.filter((h) => favIds.includes(String(h.id)))

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">
              {t('favoritesPage.title')}
            </h2>
            <Link className="btn btn-outline btn-sm max-[640px]:hidden" to="/">
              {t('common.backHome')}
            </Link>
          </div>
          {favError ? (
            <ErrorBanner message={t('errors.loadFavorites')} />
          ) : !user ? (
            <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <p className="mb-1 text-[17px] font-extrabold text-rd-text">{t('account.guestTitle')}</p>
              <p className="mb-5 text-[13.5px] text-rd-muted">{t('account.guestDesc')}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    setAuthTab('login')
                    setAuthOpen(true)
                  }}
                >
                  {t('account.login')}
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => {
                    setAuthTab('register')
                    setAuthOpen(true)
                  }}
                >
                  {t('account.register')}
                </button>
              </div>
            </div>
          ) : hotelsLoading ? (
            <div
              className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5"
              aria-hidden="true"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <HotelCardSkeleton key={i} />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <svg
                className="mx-auto mb-4 text-rd-border"
                viewBox="0 0 24 24"
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z" />
              </svg>
              <p className="mb-[18px] text-rd-muted">{t('favoritesPage.empty')}</p>
              <Link className="btn btn-primary" to="/">
                {t('pages.searchStays')}
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5">
              {favorites.map((h) => (
                <HotelCard key={h.id} hotel={h} onOpen={(hotel) => navigate(`/hotel/${hotel.id}`)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      {authOpen && <AuthModal initialTab={authTab} onClose={() => setAuthOpen(false)} />}
    </>
  )
}

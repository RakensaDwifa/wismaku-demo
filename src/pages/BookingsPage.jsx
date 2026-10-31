import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import BookingCard from '../components/BookingCard.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import AuthModal from '../components/AuthModal.jsx'
import { Skeleton } from '../components/Skeletons.jsx'
import { getBookings, cancelBooking, deleteBooking } from '../services/booking.js'
import { getActiveUser } from '../services/member.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function BookingsPage() {
  const { t } = useLanguage()
  usePageMeta(t('pages.bookingsTitle'), t('pages.bookingsDesc'))
  const [orders, setOrders] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState('')
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
            setOrders([])
            setError(null)
          }
          return
        }
        const list = await getBookings({ email: u.email })
        if (live) {
          setOrders(list)
          setError(null)
        }
      } catch (err) {
        if (live) setError(err)
      }
    }
    sync()
    window.addEventListener('wismaku:session-changed', sync)
    window.addEventListener('wismaku:bookings-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:session-changed', sync)
      window.removeEventListener('wismaku:bookings-changed', sync)
    }
  }, [])

  const handleCancel = async (id) => {
    setActionError('')
    try {
      await cancelBooking(id)
    } catch (err) {
      setActionError(err.message || t('bookings.cancelFailed'))
    }
    load()
  }

  const handleDelete = async (id) => {
    setActionError('')
    try {
      await deleteBooking(id)
      setOrders((prev) => (prev ? prev.filter((o) => o.id !== id) : prev))
    } catch (err) {
      setActionError(err.message || t('bookings.deleteFailed'))
      load()
    }
  }

  const load = async () => {
    try {
      const u = await getActiveUser()
      setUser(u)
      if (!u) {
        setOrders([])
        setError(null)
        return
      }
      setOrders(await getBookings({ email: u.email }))
      setError(null)
    } catch (err) {
      setError(err)
    }
  }

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">
              {t('pages.bookingsTitle')}
            </h2>
            <Link className="btn btn-outline btn-sm max-[640px]:hidden" to="/">
              {t('common.backHome')}
            </Link>
          </div>
          {error ? (
            <ErrorBanner message={t('errors.loadBookings')} onRetry={load} />
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
          ) : !orders ? (
            <div
              className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5"
              aria-hidden="true"
            >
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="rounded-[14px]" style={{ height: 140, borderRadius: 14 }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
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
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
              </svg>
              <p className="mb-[18px] text-rd-muted">{t('pages.bookingsEmpty')}</p>
              <Link className="btn btn-primary" to="/">
                {t('pages.searchStays')}
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              {actionError && (
                <p
                  role="alert"
                  className="mb-3 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[13px] font-bold text-[#dc2626]"
                >
                  {actionError}
                </p>
              )}
              <ul className="grid list-none gap-[14px] p-0">
                {orders.map((o) => (
                  <BookingCard key={o.id} booking={o} onCancel={handleCancel} onDelete={handleDelete} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {authOpen && <AuthModal initialTab={authTab} onClose={() => setAuthOpen(false)} />}
    </>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import AuthModal from '../components/AuthModal.jsx'
import MemberModal from '../components/MemberModal.jsx'
import AccountSecurity from '../components/AccountSecurity.jsx'
import { getActiveUser, getMember, logout } from '../services/member.js'
import { getBookings } from '../services/booking.js'
import { getFavorites } from '../services/favorite.js'
import { fmtDate } from '../utils/format.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function AccountPage() {
  const { t, lang } = useLanguage()
  usePageMeta(t('account.metaTitle'), t('account.metaDesc'))
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [member, setMember] = useState(null)
  const [counts, setCounts] = useState({ bookings: 0, favorites: 0 })
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [memberOpen, setMemberOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const [u, m] = await Promise.all([getActiveUser(), getMember()])
        if (!live) return
        setUser(u)
        setMember(m)
        setAvatarFailed(false)
        if (u) {
          const [bs, fs] = await Promise.all([getBookings({ email: u.email }), getFavorites(u)])
          if (live) setCounts({ bookings: bs.length, favorites: fs.length })
        } else {
          setCounts({ bookings: 0, favorites: 0 })
        }
      } catch {
        if (live) {
          setUser(null)
          setMember(null)
          setCounts({ bookings: 0, favorites: 0 })
        }
      }
    }
    sync()
    window.addEventListener('wismaku:session-changed', sync)
    window.addEventListener('wismaku:bookings-changed', sync)
    window.addEventListener('wismaku:favorites-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:session-changed', sync)
      window.removeEventListener('wismaku:bookings-changed', sync)
      window.removeEventListener('wismaku:favorites-changed', sync)
    }
  }, [])

  const doLogout = async () => {
    try {
      await logout()
    } catch {
      /* abaikan */
    }
    navigate('/')
  }

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <h2 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">{t('account.title')}</h2>

          {!user ? (
            <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <div
                className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-rd-soft text-[22px] text-rd"
                aria-hidden="true"
              >
                &#128100;
              </div>
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
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-rd-border bg-white p-5 shadow-rd">
                <h3 className="mb-4 text-[14px] font-extrabold tracking-[0.4px] uppercase text-rd-muted">
                  {t('account.profile')}
                </h3>
                <div className="flex items-center gap-4">
                  {user.avatarUrl && !avatarFailed ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="size-14 shrink-0 rounded-full border border-rd-border object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <div
                      className="grid size-14 shrink-0 place-items-center rounded-full bg-[linear-gradient(95deg,#14b8a6,#0d9488)] text-[22px] font-extrabold text-white"
                      aria-hidden="true"
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-extrabold text-rd-text">{user.name}</p>
                    <p className="truncate text-[13px] text-rd-muted">{user.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-rd-soft px-2.5 py-0.5 text-[11.5px] font-bold text-rd">
                      {t('account.provider', { provider: user.provider })}
                    </span>
                  </div>
                </div>
                {user.loggedInAt && (
                  <p className="mt-4 border-t border-[#f4f4f4] pt-3 text-[12.5px] text-rd-muted">
                    {t('account.lastLogin', { date: fmtDate(user.loggedInAt, lang) })}
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-rd-border bg-white p-5 shadow-rd">
                <h3 className="mb-4 text-[14px] font-extrabold tracking-[0.4px] uppercase text-rd-muted">
                  {t('account.memberTitle')}
                </h3>
                {member ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div
                        className="grid size-14 shrink-0 place-items-center rounded-full bg-[linear-gradient(95deg,#10b981,#0d9488)] text-[24px] text-white"
                        aria-hidden="true"
                      >
                        &#9733;
                      </div>
                      <div className="min-w-0">
                        <p className="text-[17px] font-extrabold text-rd-text">{member.name}</p>
                        <p className="truncate text-[13px] text-rd-muted">
                          {t('account.memberId', { id: member.member_no ?? member.id })}
                        </p>
                        {member.joinedAt && (
                          <p className="text-[12.5px] font-bold text-rd">
                            {t('account.memberActive', { date: fmtDate(member.joinedAt, lang) })}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="mt-4 border-t border-[#f4f4f4] pt-3 text-[12.5px] text-rd-text">
                      {t('account.memberPerk')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-[13.5px] leading-relaxed text-rd-muted">
                      {t('account.joinClubDesc')}
                    </p>
                    <button className="btn btn-primary" type="button" onClick={() => setMemberOpen(true)}>
                      {t('account.joinClub')}
                    </button>
                  </>
                )}
              </section>

              <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
                <Link
                  className="flex items-center justify-between gap-3 rounded-2xl border border-rd-border bg-white p-5 shadow-rd transition-colors hover:border-rd-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
                  to="/bookings"
                >
                  <span>
                    <span className="block text-[15px] font-extrabold text-rd-text">
                      {t('account.statsBookings')}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-rd-muted">
                      {t('account.statsBookingsDesc')}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <b className="block text-[22px] leading-none text-rd">{counts.bookings}</b>
                    <span className="text-[12px] font-bold text-rd-muted">{t('account.viewAll')}</span>
                  </span>
                </Link>
                <Link
                  className="flex items-center justify-between gap-3 rounded-2xl border border-rd-border bg-white p-5 shadow-rd transition-colors hover:border-rd-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
                  to="/favorites"
                >
                  <span>
                    <span className="block text-[15px] font-extrabold text-rd-text">
                      {t('account.statsFavorites')}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-rd-muted">
                      {t('account.statsFavoritesDesc')}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <b className="block text-[22px] leading-none text-rd">{counts.favorites}</b>
                    <span className="text-[12px] font-bold text-rd-muted">{t('account.viewAll')}</span>
                  </span>
                </Link>
                <button
                  className="btn btn-outline lg:col-span-2"
                  type="button"
                  aria-label={t('account.logoutAria')}
                  onClick={doLogout}
                >
                  {t('account.logout')}
                </button>
              </div>
              <AccountSecurity user={user} onDeleted={() => navigate('/')} />
            </div>
          )}
        </div>
      </main>
      <Footer />
      {authOpen && <AuthModal initialTab={authTab} onClose={() => setAuthOpen(false)} />}
      {memberOpen && <MemberModal onClose={() => setMemberOpen(false)} />}
    </>
  )
}

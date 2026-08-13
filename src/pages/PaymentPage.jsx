import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { Skeleton } from '../components/Skeletons.jsx'
import { getBookings, payBooking } from '../services/booking.js'
import { fmtRupiah, fmtDate } from '../utils/format.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

const METHODS = ['va', 'qris', 'ewallet']

export default function PaymentPage() {
  const { t, lang } = useLanguage()
  usePageMeta(t('payment.metaTitle'), t('payment.metaDesc'))
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [method, setMethod] = useState('va')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    getBookings()
      .then((list) => {
        if (live) setBooking(list.find((b) => b.id === id) ?? null)
      })
      .catch(() => {
        if (live) setBooking(null)
      })
      .finally(() => {
        if (live) setLoaded(true)
      })
    return () => {
      live = false
    }
  }, [id])

  const pay = async () => {
    setBusy(true)
    setError('')
    try {
      await payBooking(id, method)
      navigate(`/pesanan/sukses/${id}`)
    } catch (err) {
      setError(err.message || t('payment.payFailed'))
      setBusy(false)
    }
  }

  if (loaded && booking?.status === 'confirmed') {
    return <Navigate to={`/pesanan/sukses/${id}`} replace />
  }

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] bg-[#f7f7f7] py-6 pb-16">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          {!loaded ? (
            <div className="grid gap-6 min-[993px]:grid-cols-[1fr_360px]">
              <div className="grid gap-6">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-56 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-[360px] w-full rounded-2xl max-[992px]:h-64" />
            </div>
          ) : !booking ? (
            <div className="rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <p className="mb-[18px] text-rd-muted">{t('pages.notFound')}</p>
              <Link className="btn btn-primary" to="/bookings">
                {t('pages.viewBookings')}
              </Link>
            </div>
          ) : (
            <>
              <nav
                className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-rd-muted"
                aria-label={t('booking.breadcrumbAria')}
              >
                <Link className="font-semibold text-rd-muted transition-colors hover:text-rd" to="/">
                  {t('booking.crumbHome')}
                </Link>
                <span aria-hidden="true">&rsaquo;</span>
                <Link className="font-semibold text-rd-muted transition-colors hover:text-rd" to="/hasil">
                  {t('booking.crumbStays')}
                </Link>
                <span aria-hidden="true">&rsaquo;</span>
                <Link
                  className="font-semibold text-rd-muted transition-colors hover:text-rd"
                  to={`/hotel/${booking.hotelId}`}
                >
                  {booking.hotelName}
                </Link>
                <span aria-hidden="true">&rsaquo;</span>
                <span className="font-bold text-rd-text" aria-current="page">
                  {t('payment.crumb')}
                </span>
              </nav>
              <h1 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">
                {t('payment.title')}
              </h1>
              <p className="mt-1 text-[13.5px] text-rd-muted">
                {t('payment.awaiting', { id: booking.id, total: fmtRupiah(booking.totalPrice) })}.
              </p>

              <div className="mt-6 grid items-start gap-6 min-[993px]:grid-cols-[1fr_360px]">
                <div className="flex min-w-0 flex-col gap-6">
                  <section className="rounded-2xl border border-rd-border bg-white p-5">
                    <h2 className="text-[18px] font-extrabold">{t('payment.summaryTitle')}</h2>
                    <div className="mt-4 flex gap-4">
                      <img
                        className="h-[84px] w-[120px] shrink-0 rounded-[10px] object-cover"
                        src={booking.hotelImg}
                        alt={booking.hotelName}
                      />
                      <div className="min-w-0">
                        <p className="text-[15px] font-extrabold leading-[1.35]">{booking.hotelName}</p>
                        <p className="mt-0.5 text-[12.5px] text-rd-muted">
                          {t('pages.successStayInfo', {
                            nights: booking.nights,
                            rooms: booking.rooms,
                            guests: booking.guests,
                            type: booking.roomTypeName,
                          })}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-rd-muted">
                          {booking.checkIn ? (
                            <>
                              {fmtDate(booking.checkIn, lang)} &rarr; {fmtDate(booking.checkOut, lang)}
                            </>
                          ) : (
                            t('bookingBox.noDates')
                          )}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-rd-muted">
                          {t('payment.underName', { name: booking.guestName })}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-rd-border bg-white p-5">
                    <h2 className="text-[18px] font-extrabold">{t('payment.methodTitle')}</h2>
                    <div
                      className="mt-4 flex flex-col gap-3"
                      role="radiogroup"
                      aria-label={t('payment.methodAria')}
                    >
                      {METHODS.map((m) => {
                        const meta = t('payment.methods')[m]
                        const icon = (
                          <svg
                            viewBox="0 0 24 24"
                            width="26"
                            height="26"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            aria-hidden="true"
                          >
                            {m === 'va' && (
                              <path
                                d="M3 10.5 12 4l9 6.5M5.5 9.5V19m4.5-9.5V19m4.5-9.5V19m4.5-9.5V19M3 19.5h18"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            {m === 'qris' && (
                              <>
                                <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
                                <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
                                <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
                                <path
                                  d="M13.5 13.5h3.5v3.5h-3.5zM17 20.5h3.5M17 17v3.5M20.5 13.5V17"
                                  strokeLinejoin="round"
                                />
                              </>
                            )}
                            {m === 'ewallet' && (
                              <path
                                d="M20 8H8a3.5 3.5 0 0 0 0 7h10M17 11.5h.01"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                          </svg>
                        )
                        return (
                          <label
                            key={m}
                            className={`flex cursor-pointer items-center gap-4 rounded-[12px] border px-4 py-3.5 transition-all duration-150 focus-within:border-rd ${
                              method === m
                                ? 'border-rd bg-rd-soft'
                                : 'border-rd-border bg-white hover:border-[#c9ccd4]'
                            }`}
                          >
                            <input
                              className="sr-only"
                              type="radio"
                              name="payment-method"
                              value={m}
                              checked={method === m}
                              onChange={() => setMethod(m)}
                            />
                            <span
                              className={`grid size-11 shrink-0 place-items-center rounded-[10px] ${
                                method === m ? 'bg-rd text-white' : 'bg-[#f1f3f5] text-rd-muted'
                              }`}
                            >
                              {icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[14px] font-extrabold text-rd-text">
                                {meta.label}
                              </span>
                              <span className="block text-[12.5px] text-rd-muted">{meta.desc}</span>
                            </span>
                            <span
                              className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                                method === m ? 'border-rd' : 'border-[#c9ccd4]'
                              }`}
                              aria-hidden="true"
                            >
                              {method === m && <span className="size-2.5 rounded-full bg-rd" />}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </section>
                </div>

                <aside className="h-fit rounded-2xl border border-rd-border bg-white p-4 shadow-rd min-[993px]:sticky min-[993px]:top-[90px]">
                  <p className="text-[15px] font-extrabold">{t('pages.paymentBreakdown')}</p>
                  <div className="mt-3 flex flex-col gap-1.5">
                    <div className="flex justify-between gap-2.5 text-[13px] text-rd-text">
                      <span>
                        {t('booking.calc', {
                          price: fmtRupiah(booking.roomPrice),
                          nights: booking.nights,
                          rooms: booking.rooms,
                        })}
                      </span>
                      <b>{fmtRupiah(booking.roomPrice * booking.nights * booking.rooms)}</b>
                    </div>
                    {booking.couponDiscount > 0 && (
                      <div className="flex justify-between gap-2.5 text-[13px] text-rd-teal">
                        <span>{t('booking.couponLine', { code: booking.couponCode })}</span>
                        <b>-{fmtRupiah(booking.couponDiscount)}</b>
                      </div>
                    )}
                    {booking.memberDiscount > 0 && (
                      <div className="flex justify-between gap-2.5 text-[13px] text-rd-teal">
                        <span>{t('booking.memberLine')}</span>
                        <b>-{fmtRupiah(booking.memberDiscount)}</b>
                      </div>
                    )}
                    <div className="mt-0.5 flex justify-between gap-2.5 border-t border-dashed border-[#ddd] pt-2 text-[16px] font-extrabold text-rd">
                      <span>{t('booking.total')}</span>
                      <b>{fmtRupiah(booking.totalPrice)}</b>
                    </div>
                  </div>
                  {error && <p className="mt-2 text-[12.5px] font-bold text-rd">{error}</p>}
                  <button className="btn btn-primary mt-4 w-full" type="button" onClick={pay} disabled={busy}>
                    {busy
                      ? t('payment.processing')
                      : t('payment.payNow', { total: fmtRupiah(booking.totalPrice) })}
                  </button>
                  <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-rd-muted">
                    {t('payment.demoNote')}
                  </p>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

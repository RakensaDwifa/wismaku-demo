import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { Skeleton } from '../components/Skeletons.jsx'
import { createSnapTransaction, getBookingById, verifyBookingPayment } from '../services/booking.js'
import { loadMidtransSnap } from '../lib/midtrans.js'
import { fmtRupiah, fmtDate, resolveStayDates } from '../utils/format.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

const CHANNELS = ['va', 'qris', 'card']

export default function PaymentPage() {
  const { t, lang } = useLanguage()
  usePageMeta(t('payment.metaTitle'), t('payment.metaDesc'))
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    let live = true
    getBookingById(id)
      .then((item) => {
        if (live) setBooking(item)
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

  const syncAfterPopup = async (showPendingHint = false) => {
    try {
      const res = await verifyBookingPayment(id)
      if (res?.status === 'confirmed') {
        navigate(`/pesanan/sukses/${id}`)
        return
      }
      const fresh = await getBookingById(id)
      if (fresh) setBooking(fresh)
      if (showPendingHint && res?.status !== 'cancelled') {
        setInfo(t('payment.pendingInfo'))
      }
    } catch {
      const fresh = await getBookingById(id).catch(() => null)
      if (fresh) setBooking(fresh)
    } finally {
      setBusy(false)
    }
  }

  const openSnap = async (reset = false) => {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const tx = await createSnapTransaction(id, { reset })
      if (tx?.status === 'confirmed') {
        navigate(`/pesanan/sukses/${id}`)
        return
      }
      setBooking((prev) =>
        prev ? { ...prev, snapToken: tx.token, midtransOrderId: tx.orderId ?? prev.midtransOrderId } : prev,
      )
      const snap = await loadMidtransSnap(tx.clientKey)
      snap.pay(tx.token, {
        onSuccess: () => {
          syncAfterPopup(false)
        },
        onPending: () => {
          syncAfterPopup(true)
        },
        onError: () => {
          setError(t('payment.payFailed'))
          setBusy(false)
        },
        onClose: () => {
          syncAfterPopup(false)
        },
      })
    } catch (err) {
      setError(err.message || t('payment.payFailed'))
      setBusy(false)
    }
  }

  const checkStatus = async () => {
    setChecking(true)
    setError('')
    setInfo('')
    try {
      const res = await verifyBookingPayment(id)
      if (res?.status === 'confirmed') {
        navigate(`/pesanan/sukses/${id}`)
        return
      }
      const fresh = await getBookingById(id)
      if (fresh) setBooking(fresh)
      if (res?.status !== 'cancelled') {
        setInfo(t('payment.stillPending'))
      }
    } catch (err) {
      setError(err.message || t('payment.payFailed'))
    } finally {
      setChecking(false)
    }
  }

  if (loaded && booking?.status === 'confirmed') {
    return <Navigate to={`/pesanan/sukses/${id}`} replace />
  }

  const isCancelled = booking?.status === 'cancelled'
  const hasSnapSession = Boolean(booking?.snapToken)

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
                {isCancelled
                  ? t('payment.cancelledTitle')
                  : t('payment.awaiting', { id: booking.id, total: fmtRupiah(booking.totalPrice) })}
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
                            type: t(`data.roomTypes.${booking.roomTypeId}`) ?? booking.roomTypeName,
                          })}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-rd-muted">
                          {fmtDate(resolveStayDates(booking).checkIn, lang)} &rarr;{' '}
                          {fmtDate(resolveStayDates(booking).checkOut, lang)}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-rd-muted">
                          {t('payment.underName', { name: booking.guestName })}
                        </p>
                      </div>
                    </div>
                  </section>

                  {isCancelled ? (
                    <section className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-5">
                      <span className="inline-block rounded-full bg-[rgba(239,68,68,0.14)] px-3 py-1 text-[11.5px] font-extrabold text-[#dc2626]">
                        {t('bookings.cancelled')}
                      </span>
                      <h2 className="mt-2.5 text-[18px] font-extrabold text-[#991b1b]">
                        {t('payment.cancelledTitle')}
                      </h2>
                      <p className="mt-1 text-[13.5px] leading-[1.55] text-[#7f1d1d]">
                        {t('payment.cancelledNote')}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        <Link className="btn btn-primary btn-sm" to="/bookings">
                          {t('pages.viewBookings')}
                        </Link>
                        <Link className="btn btn-outline btn-sm" to="/hasil">
                          {t('pages.searchStays')}
                        </Link>
                      </div>
                    </section>
                  ) : (
                    <section className="rounded-2xl border border-rd-border bg-white p-5">
                      <h2 className="text-[18px] font-extrabold">{t('payment.methodTitle')}</h2>
                      <p className="mt-1 text-[13px] text-rd-muted">{t('payment.methodSubtitle')}</p>
                      <ul className="mt-4 flex flex-col gap-3">
                        {CHANNELS.map((c) => {
                          const meta = t('payment.methods')[c]
                          return (
                            <li
                              key={c}
                              className="flex items-center gap-4 rounded-[12px] border border-rd-border bg-[#fafafa] px-4 py-3.5"
                            >
                              <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-rd-soft text-rd">
                                <svg
                                  viewBox="0 0 24 24"
                                  width="24"
                                  height="24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  aria-hidden="true"
                                >
                                  {c === 'va' && (
                                    <path
                                      d="M3 10.5 12 4l9 6.5M5.5 9.5V19m4.5-9.5V19m4.5-9.5V19m4.5-9.5V19M3 19.5h18"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  )}
                                  {c === 'qris' && (
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
                                  {c === 'card' && (
                                    <path
                                      d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Zm0 3h18M7 15h4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  )}
                                </svg>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[14px] font-extrabold text-rd-text">
                                  {meta.label}
                                </span>
                                <span className="block text-[12.5px] text-rd-muted">{meta.desc}</span>
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                      <p className="mt-4 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5 text-[12px] leading-[1.55] text-rd-muted">
                        {t('payment.sandboxHint')}{' '}
                        <a
                          href="https://simulator.sandbox.midtrans.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-rd underline hover:opacity-80"
                        >
                          {t('payment.sandboxSimulator')}
                        </a>{' '}
                        {t('payment.sandboxHintSuffix')}
                      </p>
                    </section>
                  )}
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

                  {error && <p className="mt-3 text-[12.5px] font-bold text-rd">{error}</p>}
                  {info && (
                    <p className="mt-3 rounded-[9px] bg-[rgba(20,184,166,0.1)] px-3 py-2 text-[12px] font-semibold leading-[1.45] text-rd-teal">
                      {info}
                    </p>
                  )}

                  {!isCancelled && (
                    <>
                      <button
                        className="btn btn-primary mt-4 w-full"
                        type="button"
                        onClick={() => openSnap(false)}
                        disabled={busy || checking}
                      >
                        {busy
                          ? t('payment.processing')
                          : hasSnapSession
                            ? t('payment.continueSnap', { total: fmtRupiah(booking.totalPrice) })
                            : t('payment.payNow', { total: fmtRupiah(booking.totalPrice) })}
                      </button>

                      {hasSnapSession && (
                        <div className="mt-2.5 flex flex-col gap-2">
                          <button
                            className="btn btn-outline btn-sm w-full"
                            type="button"
                            onClick={checkStatus}
                            disabled={busy || checking}
                          >
                            {checking ? t('payment.verifying') : t('payment.checkStatus')}
                          </button>
                          <button
                            className="text-center text-[12px] font-bold text-rd-muted underline transition-colors hover:text-rd disabled:opacity-50"
                            type="button"
                            onClick={() => openSnap(true)}
                            disabled={busy || checking}
                          >
                            {t('payment.changeMethod')}
                          </button>
                        </div>
                      )}

                      <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-rd-muted">
                        {t('payment.demoNote')}
                      </p>
                    </>
                  )}
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

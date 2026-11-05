import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { getBookingById } from '../services/booking.js'
import { Skeleton } from '../components/Skeletons.jsx'
import { fmtRupiah, fmtDate, resolveStayDates } from '../utils/format.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

const statusBadge = (status, expired) => {
  if (status === 'cancelled' || expired) return 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
  if (status === 'pending') return 'bg-[rgba(245,158,11,0.12)] text-[#b45309]'
  return 'bg-[rgba(20,184,166,0.12)] text-rd-teal'
}

export default function BookingSuccessPage() {
  const { t, lang } = useLanguage()
  usePageMeta(t('pages.successTitle'), t('pages.successDesc'))
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [now, setNow] = useState(() => Date.now())

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

  const subtotal = booking ? booking.roomPrice * booking.nights * booking.rooms : 0
  const stay = booking ? resolveStayDates(booking) : null

  const isCancelled = booking?.status === 'cancelled'
  const isConfirmed = booking?.status === 'confirmed'
  const isPending = booking?.status === 'pending'
  const expiresAtMs = booking?.expiresAt ? new Date(booking.expiresAt).getTime() : null
  const isExpired = Boolean(
    isPending && expiresAtMs !== null && Number.isFinite(expiresAtMs) && expiresAtMs <= now,
  )

  useEffect(() => {
    if (!isPending || expiresAtMs === null || !Number.isFinite(expiresAtMs) || expiresAtMs <= now) {
      return undefined
    }
    const timer = setTimeout(() => setNow(Date.now()), Math.min(2_147_483_647, expiresAtMs - now + 50))
    return () => clearTimeout(timer)
  }, [isPending, expiresAtMs, now])

  const bannerIcon = isConfirmed
    ? { bg: 'bg-[linear-gradient(95deg,#10b981,#0d9488)] text-white', symbol: '\u2713' }
    : isCancelled || isExpired
      ? { bg: 'bg-[rgba(239,68,68,0.15)] text-[#dc2626]', symbol: '\u2715' }
      : { bg: 'bg-[linear-gradient(95deg,#f59e0b,#d97706)] text-white', symbol: '\u23F1' }

  const bannerTitle = isConfirmed
    ? t('pages.successConfirmed')
    : isCancelled
      ? t('pages.successCancelled')
      : isExpired
        ? t('pages.successExpired')
        : t('pages.successPending')

  const badgeLabel = isCancelled
    ? t('bookings.cancelled')
    : isExpired
      ? t('bookings.expired')
      : isPending
        ? t('bookings.pending')
        : t('bookings.confirmed')

  return (
    <>
      <div className="print:hidden">
        <TopBar />
        <Header />
      </div>
      <main id="main" className="min-h-[60vh] py-12 max-[768px]:py-8 print:min-h-0 print:py-4">
        <div className="mx-auto w-full max-w-[1200px] px-5 print:p-0">
          <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
            <h2 className="text-[26px] font-extrabold text-black max-[768px]:text-xl">
              {t('pages.successH2')}
            </h2>
            <Link className="btn btn-outline btn-sm max-[640px]:hidden" to="/bookings">
              {t('pages.viewBookings')}
            </Link>
          </div>

          {!loaded ? (
            <div className="mt-6 max-w-[720px]" aria-hidden="true">
              <Skeleton className="mb-4 h-[86px] w-full rounded-[14px]" />
              <Skeleton className="mb-4 h-56 w-full rounded-[14px]" />
            </div>
          ) : booking ? (
            <div className="mt-6 max-w-[720px] print:mt-0 print:max-w-none">
              <div className="hidden border-b-2 border-rd pb-4 print:mb-6 print:block">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-[22px] font-black tracking-tight text-rd">WISMAKU</h1>
                    <p className="text-[14px] font-extrabold text-rd-text">{t('pages.voucherTitle')}</p>
                  </div>
                  <div className="text-right text-[12px] text-rd-muted">
                    <p className="font-bold text-rd-text">
                      {t('pages.successCode')} <span className="font-mono text-rd">{booking.id}</span>
                    </p>
                    <p>{fmtDate(booking.createdAt, lang)}</p>
                  </div>
                </div>
                <p className="mt-2 text-[12px] text-rd-muted italic">{t('pages.voucherSubtitle')}</p>
              </div>

              <div className="mb-4 flex items-center gap-[14px] rounded-[14px] border border-rd-border bg-white p-[14px] print:border-none print:p-0">
                <div
                  className={`grid size-[54px] shrink-0 place-items-center rounded-full text-[24px] font-extrabold print:hidden ${bannerIcon.bg}`}
                  aria-hidden="true"
                >
                  {bannerIcon.symbol}
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold">{bannerTitle}</h3>
                  <p className="text-[13px] text-rd-muted">
                    {t('pages.successCode')} <b className="text-rd-teal">{booking.id}</b> &middot;{' '}
                    <span
                      className={`rounded-full px-[9px] py-[3px] text-[11px] font-extrabold ${statusBadge(booking.status, isExpired)}`}
                    >
                      {badgeLabel}
                    </span>
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[14px] border border-rd-border bg-white">
                <div className="flex flex-col gap-[14px] p-[14px] sm:flex-row">
                  <img
                    className="h-[130px] w-full shrink-0 rounded-[10px] object-cover sm:w-[200px]"
                    src={booking.hotelImg}
                    alt={booking.hotelName}
                  />
                  <div className="flex flex-1 flex-col gap-1 text-[13.5px]">
                    <Link
                      className="text-[15px] font-extrabold text-rd-text hover:text-rd"
                      to={`/hotel/${booking.hotelId}`}
                    >
                      {booking.hotelName}
                    </Link>
                    <span className="text-rd-muted">
                      {fmtDate(stay.checkIn, lang)} &rarr; {fmtDate(stay.checkOut, lang)}
                    </span>
                    <span className="text-rd-muted">
                      {t('pages.successStayInfo', {
                        nights: booking.nights,
                        rooms: booking.rooms,
                        guests: booking.guests,
                        type: t(`data.roomTypes.${booking.roomTypeId}`) ?? booking.roomTypeName,
                      })}
                    </span>
                    <span className="text-rd-muted">
                      {t('pages.successRoomPrice', { price: fmtRupiah(booking.roomPrice) })}{' '}
                      {t('hotelCard.perNight')}
                    </span>
                  </div>
                </div>

                <div className="grid gap-px border-t border-rd-border bg-rd-border sm:grid-cols-2">
                  <div className="bg-white p-[18px]">
                    <h4 className="mb-2.5 text-[14px] font-extrabold">{t('pages.paymentBreakdown')}</h4>
                    <div className="flex flex-col gap-1.5 text-[13.5px] text-rd-muted">
                      <span className="flex justify-between gap-3">
                        <span>{t('pages.subtotal')}</span>
                        <b className="text-rd-text">{fmtRupiah(subtotal)}</b>
                      </span>
                      {booking.couponDiscount > 0 && (
                        <span className="flex justify-between gap-3">
                          <span>{t('pages.coupon', { code: booking.couponCode })}</span>
                          <b className="text-rd-green">-{fmtRupiah(booking.couponDiscount)}</b>
                        </span>
                      )}
                      {booking.memberDiscount > 0 && (
                        <span className="flex justify-between gap-3">
                          <span>{t('pages.memberDiscount')}</span>
                          <b className="text-rd-green">-{fmtRupiah(booking.memberDiscount)}</b>
                        </span>
                      )}
                      <span className="mt-1 flex justify-between gap-3 border-t border-dashed border-[#ddd] pt-2 text-[15px] font-extrabold">
                        <span className="text-rd-text">{t('pages.total')}</span>
                        <span className="text-rd">{fmtRupiah(booking.totalPrice)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-[18px]">
                    <h4 className="mb-2.5 text-[14px] font-extrabold">{t('pages.guestData')}</h4>
                    <div className="flex flex-col gap-1.5 text-[13.5px] text-rd-muted">
                      <span>{t('pages.guestName', { name: booking.guestName })}</span>
                      <span>{t('pages.guestEmail', { email: booking.email })}</span>
                      <span>{t('pages.guestPhone', { phone: booking.phone })}</span>
                      {booking.paymentMethod && (
                        <span>
                          {t('pages.paymentMethod', {
                            method: t('paymentLabels')[booking.paymentMethod] ?? booking.paymentMethod,
                          })}
                        </span>
                      )}
                      <span>{t('pages.createdAt', { date: fmtDate(booking.createdAt, lang) })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5 print:hidden">
                {isConfirmed && (
                  <button
                    className="btn btn-outline inline-flex items-center gap-2"
                    type="button"
                    onClick={() => window.print()}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    {t('pages.printTicket')}
                  </button>
                )}
                {isPending && !isExpired && (
                  <Link className="btn btn-primary" to={`/bayar/${booking.id}`}>
                    {t('pages.continuePayment')}
                  </Link>
                )}
                <Link className="btn btn-primary" to="/">
                  {t('pages.backHomePlain')}
                </Link>
                <Link className="btn btn-outline" to="/bookings">
                  {t('pages.viewBookings')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
              <p className="mb-[18px] text-rd-muted">{t('pages.notFound')}</p>
              <Link className="btn btn-primary" to="/">
                {t('pages.searchStays')}
              </Link>
            </div>
          )}
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  )
}

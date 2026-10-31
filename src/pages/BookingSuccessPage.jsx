import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { getBookingById } from '../services/booking.js'
import { Skeleton } from '../components/Skeletons.jsx'
import { fmtRupiah, fmtDate } from '../utils/format.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

const statusBadge = (status) => {
  if (status === 'cancelled') return 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
  if (status === 'pending') return 'bg-[rgba(245,158,11,0.12)] text-[#b45309]'
  return 'bg-[rgba(20,184,166,0.12)] text-rd-teal'
}

export default function BookingSuccessPage() {
  const { t, lang } = useLanguage()
  usePageMeta(t('pages.successTitle'), t('pages.successDesc'))
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loaded, setLoaded] = useState(false)

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

  return (
    <>
      <TopBar />
      <Header />
      <main id="main" className="min-h-[60vh] py-12 max-[768px]:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
            <div className="mt-6 max-w-[720px]">
              <div className="mb-4 flex items-center gap-[14px] rounded-[14px] border border-rd-border bg-white p-[14px]">
                <div
                  className="grid size-[54px] shrink-0 place-items-center rounded-full bg-[linear-gradient(95deg,#10b981,#0d9488)] text-[26px] font-extrabold text-white"
                  aria-hidden="true"
                >
                  &#10003;
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold">{t('pages.successCreated')}</h3>
                  <p className="text-[13px] text-rd-muted">
                    {t('pages.successCode')} <b className="text-rd-teal">{booking.id}</b> &middot;{' '}
                    <span
                      className={`rounded-full px-[9px] py-[3px] text-[11px] font-extrabold ${statusBadge(booking.status)}`}
                    >
                      {booking.status === 'cancelled'
                        ? t('bookings.cancelled')
                        : booking.status === 'pending'
                          ? t('bookings.pending')
                          : t('bookings.confirmed')}
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
                      {fmtDate(booking.checkIn, lang)} &rarr; {fmtDate(booking.checkOut, lang)}
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

              <div className="mt-5 flex flex-wrap gap-2.5">
                {booking.status === 'pending' && (
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
      <Footer />
    </>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fmtRupiah, fmtDate } from '../utils/format.js'
import Modal from './ui/Modal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function BookingCard({ booking, onCancel, onDelete }) {
  const { t, lang } = useLanguage()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const cancelled = booking.status === 'cancelled'
  const pending = booking.status === 'pending'

  const badgeClass = cancelled
    ? 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
    : pending
      ? 'bg-[rgba(245,158,11,0.12)] text-[#b45309]'
      : 'bg-[rgba(20,184,166,0.12)] text-rd-teal'

  const badgeLabel = cancelled
    ? t('bookings.cancelled')
    : pending
      ? t('bookings.pending')
      : t('bookings.confirmed')

  return (
    <li className="flex items-center gap-[14px] rounded-[14px] border border-rd-border bg-white p-[14px] max-[768px]:flex-wrap">
      <img
        className="h-[76px] w-[110px] shrink-0 rounded-[10px] object-cover max-[768px]:aspect-video max-[768px]:h-auto max-[768px]:w-full"
        src={booking.hotelImg}
        alt=""
        loading="lazy"
      />
      <div className="flex flex-1 flex-col gap-px text-[12px] text-rd-muted">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <b className="line-clamp-1 text-[12.5px] text-rd-text">{booking.hotelName}</b>
          <span className={`rounded-full px-[9px] py-[3px] text-[11px] font-extrabold ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>
        <span>
          {fmtDate(booking.checkIn, lang)} &rarr; {fmtDate(booking.checkOut, lang)}
        </span>
        <span>
          {t('bookings.summary', { nights: booking.nights, rooms: booking.rooms, guests: booking.guests })}
        </span>
        {booking.roomTypeName && (
          <span>
            {t('bookings.roomType', {
              type: t(`data.roomTypes.${booking.roomTypeId}`) ?? booking.roomTypeName,
            })}
          </span>
        )}
        <span>{fmtRupiah(booking.totalPrice)}</span>
        <small className="font-bold text-rd-teal">
          {t('bookings.code', { id: booking.id, name: booking.guestName })}
        </small>
      </div>
      <div className="ml-auto flex flex-col gap-2 max-[768px]:w-full max-[768px]:flex-row">
        <Link className="btn btn-outline btn-sm" to={`/hotel/${booking.hotelId}`}>
          {t('bookings.viewHotel')}
        </Link>
        {pending && (
          <Link className="btn btn-primary btn-sm" to={`/bayar/${booking.id}`}>
            {t('bookings.payNow')}
          </Link>
        )}
        {!cancelled && (
          <button
            className="rounded-[7px] border border-rd bg-white px-2.5 py-[5px] text-[12px] font-bold text-rd transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd hover:bg-rd hover:text-white"
            type="button"
            onClick={() => setConfirmOpen(true)}
          >
            {t('bookings.cancel')}
          </button>
        )}
        {cancelled && onDelete && (
          <button
            className="rounded-[7px] border border-[#ef4444] bg-white px-2.5 py-[5px] text-[12px] font-bold text-[#ef4444] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef4444] hover:bg-[#ef4444] hover:text-white"
            type="button"
            onClick={() => setDeleteOpen(true)}
          >
            {t('bookings.delete')}
          </button>
        )}
      </div>
      {confirmOpen && (
        <Modal onClose={() => setConfirmOpen(false)} labelledBy="cancel-booking-title">
          <div className="px-5 pt-[18px] pb-[22px]">
            <h3 id="cancel-booking-title" className="text-[19px] font-extrabold leading-[1.3]">
              {t('bookings.cancelTitle')}
            </h3>
            <p className="mt-1 mb-2 text-[13px] text-rd-muted">
              {t('bookings.cancelDesc', { id: booking.id, name: booking.hotelName })}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-[14px] border-t border-[#eee] pt-4">
              <button className="btn btn-outline" type="button" onClick={() => setConfirmOpen(false)}>
                {t('bookings.keep')}
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setConfirmOpen(false)
                  onCancel(booking.id)
                }}
              >
                {t('bookings.confirmCancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {deleteOpen && (
        <Modal onClose={() => setDeleteOpen(false)} labelledBy="delete-booking-title">
          <div className="px-5 pt-[18px] pb-[22px]">
            <h3 id="delete-booking-title" className="text-[19px] font-extrabold leading-[1.3]">
              {t('bookings.deleteTitle')}
            </h3>
            <p className="mt-1 mb-2 text-[13px] text-rd-muted">
              {t('bookings.deleteDesc', { id: booking.id, name: booking.hotelName })}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-[14px] border-t border-[#eee] pt-4">
              <button className="btn btn-outline" type="button" onClick={() => setDeleteOpen(false)}>
                {t('bookings.keep')}
              </button>
              <button
                className="rounded-[10px] bg-[#ef4444] px-4 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#dc2626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef4444]"
                type="button"
                onClick={() => {
                  setDeleteOpen(false)
                  onDelete(booking.id)
                }}
              >
                {t('bookings.confirmDelete')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </li>
  )
}

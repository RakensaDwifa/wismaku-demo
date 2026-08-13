import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fmtRupiah, fmtDate } from '../utils/format.js'
import Modal from './ui/Modal.jsx'

export default function BookingCard({ booking, onCancel }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const cancelled = booking.status === 'cancelled'

  return (
    <li className="orders-item booking-card">
      <img src={booking.hotelImg} alt="" />
      <div className="orders-item__info">
        <div className="orders-item__head">
          <b>{booking.hotelName}</b>
          <span className={`status-badge${cancelled ? ' status-badge--cancelled' : ''}`}>
            {cancelled ? 'Dibatalkan' : 'Dikonfirmasi'}
          </span>
        </div>
        <span>
          {fmtDate(booking.checkIn)} &rarr; {fmtDate(booking.checkOut)}
        </span>
        <span>
          {booking.nights} malam &middot; {booking.rooms} kamar &middot; {booking.guests} tamu
        </span>
        {booking.roomTypeName && <span>Tipe kamar: {booking.roomTypeName}</span>}
        <span>{fmtRupiah(booking.totalPrice)}</span>
        <small>
          Kode: {booking.id} &middot; a.n. {booking.guestName}
        </small>
      </div>
      <div className="booking-card__actions">
        <Link className="btn btn-outline btn-sm" to={`/hotel/${booking.hotelId}`}>
          Lihat Hotel
        </Link>
        {!cancelled && (
          <button className="orders-cancel" type="button" onClick={() => setConfirmOpen(true)}>
            Batal
          </button>
        )}
      </div>
      {confirmOpen && (
        <Modal onClose={() => setConfirmOpen(false)} labelledBy="cancel-booking-title">
          <div className="modal-body">
            <h3 id="cancel-booking-title">Batalkan Pesanan?</h3>
            <p className="modal-loc">
              Pesanan {booking.id} &mdash; {booking.hotelName} akan dibatalkan dan statusnya berubah menjadi
              "Dibatalkan".
            </p>
            <div className="modal-price">
              <button className="btn btn-outline" type="button" onClick={() => setConfirmOpen(false)}>
                Tidak Jadi
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setConfirmOpen(false)
                  onCancel(booking.id)
                }}
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </li>
  )
}

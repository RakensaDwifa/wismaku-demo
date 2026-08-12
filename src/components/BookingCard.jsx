import { fmtRupiah, fmtDate } from '../utils/format.js'
import { Link } from 'react-router-dom'

export default function BookingCard({ booking, onCancel }) {
  return (
    <li className="orders-item booking-card">
      <img src={booking.hotelImg} alt="" />
      <div className="orders-item__info">
        <b>{booking.hotelName}</b>
        <span>
          {fmtDate(booking.checkIn)} &rarr; {fmtDate(booking.checkOut)}
        </span>
        <span>
          {booking.nights} malam &middot; {booking.rooms} kamar &middot; {booking.guests} tamu
        </span>
        <span>{fmtRupiah(booking.totalPrice)}</span>
        <small>
          Kode: {booking.id} &middot; a.n. {booking.guestName}
        </small>
      </div>
      <div className="booking-card__actions">
        <Link className="btn btn-outline btn-sm" to={`/hotel/${booking.hotelId}`}>
          Lihat Hotel
        </Link>
        <button className="orders-cancel" type="button" onClick={() => onCancel(booking.id)}>
          Batal
        </button>
      </div>
    </li>
  )
}

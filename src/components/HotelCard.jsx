const fmtRupiah = (n) => 'Rp ' + n.toLocaleString('id-ID')

export default function HotelCard({ hotel }) {
  return (
    <article className="hotel-card">
      <a
        href="#hotels"
        className="hotel-card__link"
        title="Halaman detail segera hadir"
        onClick={(e) => e.preventDefault()}
        aria-disabled="true"
      >
        <div className="hotel-card__media">
          <img src={hotel.img} alt={hotel.name} loading="lazy" />
          {hotel.discount > 0 && (
            <span className="hotel-card__badge">Hemat {hotel.discount}%</span>
          )}
          <span className="hotel-card__rating">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
            </svg>
            {hotel.rating} ({hotel.reviews})
          </span>
        </div>
        <div className="hotel-card__body">
          <h3 className="hotel-card__name">{hotel.name}</h3>
          <p className="hotel-card__loc">{hotel.area}, {hotel.city}</p>
          <div className="hotel-card__price">
            <span className="hotel-card__from">Mulai dari</span>
            <div className="hotel-card__amount">
              <strong>{fmtRupiah(hotel.price)}</strong>
              <span className="hotel-card__strike">{fmtRupiah(hotel.originalPrice)}</span>
            </div>
            <span className="hotel-card__per">/ malam</span>
          </div>
        </div>
      </a>
    </article>
  )
}
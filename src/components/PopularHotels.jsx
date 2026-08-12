import HotelCard from './HotelCard.jsx'

export default function PopularHotels({ hotels, isSearch, onReset }) {
  return (
    <section className="section hotels-section" id="hotels">
      <div className="container">
        <div className="promo-header">
          <h2 className="section-title">
            {isSearch ? `Hasil Pencarian (${hotels.length})` : 'Hotel Populer'}
          </h2>
          {!isSearch && (
            <button className="btn btn-outline btn-sm is-disabled" type="button" disabled>Lihat Semua</button>
          )}
        </div>
        {hotels.length === 0 ? (
          <div className="hotels-empty">
            <p>Tidak ada penginapan ditemukan.</p>
            <button className="btn btn-primary" type="button" onClick={onReset}>Ubah Pencarian</button>
          </div>
        ) : (
          <div className="hotels-grid">
            {hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}
          </div>
        )}
      </div>
    </section>
  )
}
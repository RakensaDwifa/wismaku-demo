import HotelCard from './HotelCard.jsx'

export default function PopularHotels({ hotels }) {
  const searched = hotels.length > 0 && hotels.length < 12
  return (
    <section className="section hotels-section" id="hotels">
      <div className="container">
        <div className="promo-header">
          <h2 className="section-title">
            {searched ? `Hasil Pencarian (${hotels.length})` : 'Hotel Populer'}
          </h2>
          {!searched && (
            <button className="btn btn-outline btn-sm" type="button">Lihat Semua</button>
          )}
        </div>
        {hotels.length === 0 ? (
          <div className="hotels-empty">
            <p>Tidak ada penginapan ditemukan.</p>
            <button className="btn btn-primary" type="button">Ubah Pencarian</button>
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
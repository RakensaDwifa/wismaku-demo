import { useState } from 'react'
import HotelCard from './HotelCard.jsx'

const INITIAL_LIMIT = 8

export default function PopularHotels({ hotels, isSearch, onReset, searchParams, onOpen }) {
  const [expanded, setExpanded] = useState(false)
  const canExpand = !isSearch && hotels.length > INITIAL_LIMIT
  const visible = expanded ? hotels : hotels.slice(0, INITIAL_LIMIT)
  const nights = searchParams?.nights ?? 0
  const guests = searchParams?.guests ?? 0

  return (
    <section className="section hotels-section" id="hotels">
      <div className="container">
        <div className="promo-header">
          <h2 className="section-title">
            {isSearch ? `Hasil Pencarian (${hotels.length})` : 'Hotel Populer'}
            {isSearch && nights > 0 && (
              <span className="search-meta">{nights} malam &middot; {guests} tamu</span>
            )}
          </h2>
          {canExpand && (
            <button className="btn btn-outline btn-sm" type="button" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Tampilkan Lebih Sedikit' : 'Lihat Semua'}
            </button>
          )}
        </div>
        {hotels.length === 0 ? (
          <div className="hotels-empty">
            <p>Tidak ada penginapan ditemukan.</p>
            <button className="btn btn-primary" type="button" onClick={onReset}>Ubah Pencarian</button>
          </div>
        ) : (
          <div className="hotels-grid">
            {visible.map((h) => <HotelCard key={h.id} hotel={h} nights={nights} onOpen={onOpen} />)}
          </div>
        )}
      </div>
    </section>
  )
}
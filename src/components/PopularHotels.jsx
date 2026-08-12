import { useState } from 'react'
import HotelCard from './HotelCard.jsx'
import FilterBar from './FilterBar.jsx'
import { HotelCardSkeleton } from './Skeletons.jsx'
import ErrorBanner from './ErrorBanner.jsx'

const INITIAL_LIMIT = 8
const STEP = 4

export default function PopularHotels({
  hotels,
  isSearch,
  onReset,
  searchParams,
  onOpen,
  loading = false,
  error,
  onRetry,
  filters,
  onFiltersChange,
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT)
  const totals = hotels.length
  const visible = hotels.slice(0, visibleCount)
  const remaining = totals - visibleCount

  const handleFiltersChange = (next) => {
    onFiltersChange?.(next)
    setVisibleCount(INITIAL_LIMIT)
  }

  const nights = searchParams?.nights ?? 0
  const guests = searchParams?.guests ?? 0

  return (
    <section className="section hotels-section" id="hotels">
      <div className="container">
        <div className="promo-header">
          <h2 className="section-title">
            {isSearch ? `Hasil Pencarian (${totals})` : 'Hotel Populer'}
            {isSearch && nights > 0 && (
              <span className="search-meta">
                {nights} malam &middot; {guests} tamu
              </span>
            )}
          </h2>
          {!loading && !error && totals > 0 && (
            <FilterBar hotels={hotels} filters={filters} onChange={handleFiltersChange} />
          )}
        </div>
        {loading ? (
          <div className="hotels-grid" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <HotelCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorBanner onRetry={onRetry} message="Gagal memuat penginapan." />
        ) : totals === 0 ? (
          <div className="hotels-empty">
            <p>Tidak ada penginapan ditemukan.</p>
            <button className="btn btn-primary" type="button" onClick={onReset}>
              Ubah Pencarian
            </button>
          </div>
        ) : (
          <>
            <div className="hotels-grid">
              {visible.map((h) => (
                <HotelCard key={h.id} hotel={h} nights={nights} onOpen={onOpen} />
              ))}
            </div>
            {remaining > 0 && (
              <div className="load-more">
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setVisibleCount((v) => v + STEP)}
                >
                  Muat Lebih Banyak ({remaining})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

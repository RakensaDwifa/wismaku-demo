import { useState } from 'react'
import HotelCard from './HotelCard.jsx'
import FilterBar from './FilterBar.jsx'
import { HotelCardSkeleton } from './Skeletons.jsx'
import ErrorBanner from './ErrorBanner.jsx'
import { cities } from '../data/cities.js'

const INITIAL_LIMIT = 8
const STEP = 4

export default function PopularHotels({
  hotels,
  allHotels,
  isSearch,
  onReset,
  searchParams,
  onOpen,
  loading = false,
  error,
  onRetry,
  filters,
  onFiltersChange,
  query = '',
  onCityPick,
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
    <section className="bg-[#f7f7f7] py-12 max-[768px]:py-8" id="hotels">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="mb-0 text-[26px] font-extrabold text-black max-[768px]:text-xl">
            {isSearch ? `Hasil Pencarian (${totals})` : 'Hotel Populer'}
            {isSearch && nights > 0 && (
              <span className="ml-2.5 text-[13.5px] font-bold text-rd-teal">
                {nights} malam &middot; {guests} tamu
              </span>
            )}
          </h2>
          {!loading && !error && totals > 0 && (
            <FilterBar
              hotels={hotels}
              allHotels={allHotels}
              filters={filters}
              onChange={handleFiltersChange}
            />
          )}
        </div>
        {loading ? (
          <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <HotelCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorBanner onRetry={onRetry} message="Gagal memuat penginapan." />
        ) : totals === 0 ? (
          <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
            {isSearch && query ? (
              <>
                <p className="mb-[18px] text-rd-muted">
                  Tidak ada penginapan cocok untuk &quot;{query}&quot;
                  {nights > 0 ? ` selama ${nights} malam` : ''}.
                </p>
                <p className="mb-3.5 text-sm">Coba ubah kata kunci atau jelajahi kota populer:</p>
                <div className="mb-[22px] flex flex-wrap justify-center gap-2">
                  {cities.slice(0, 6).map((c) => (
                    <button
                      key={c.name}
                      className="btn btn-outline btn-sm"
                      type="button"
                      onClick={() => onCityPick?.(c.name)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="mb-[18px] text-rd-muted">Tidak ada penginapan ditemukan.</p>
            )}
            <button className="btn btn-primary" type="button" onClick={onReset}>
              Ubah Pencarian
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5">
              {visible.map((h) => (
                <HotelCard key={h.id} hotel={h} nights={nights} onOpen={onOpen} />
              ))}
            </div>
            {remaining > 0 && (
              <div className="mt-7 flex justify-center">
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

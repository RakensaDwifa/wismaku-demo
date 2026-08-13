import { useState } from 'react'
import HotelCard from './HotelCard.jsx'
import { HotelCardSkeleton } from './Skeletons.jsx'
import ErrorBanner from './ErrorBanner.jsx'

const INITIAL_LIMIT = 8
const STEP = 4

export default function PopularHotels({ hotels, onOpen, loading = false, error, onRetry }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT)
  const visible = hotels.slice(0, visibleCount)
  const remaining = hotels.length - visibleCount

  return (
    <section className="bg-[#f7f7f7] py-12 max-[768px]:py-8" id="hotels">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 className="mb-0 text-[26px] font-extrabold text-black max-[768px]:text-xl">Hotel Populer</h2>
        {loading ? (
          <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <HotelCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorBanner onRetry={onRetry} message="Gagal memuat penginapan." />
        ) : hotels.length === 0 ? (
          <div className="mt-6 rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
            <svg
              className="mx-auto mb-4 text-rd-border"
              viewBox="0 0 24 24"
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
              <path d="M10 6h4" />
              <path d="M10 10h4" />
              <path d="M10 14h4" />
              <path d="M10 18h4" />
            </svg>
            <p className="mb-[18px] text-rd-muted">Tidak ada penginapan ditemukan.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5">
              {visible.map((h) => (
                <HotelCard key={h.id} hotel={h} onOpen={onOpen} />
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

import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SearchWidget from '../components/SearchWidget.jsx'
import FilterBar from '../components/FilterBar.jsx'
import HotelCard from '../components/HotelCard.jsx'
import { HotelCardSkeleton } from '../components/Skeletons.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { useHotels, useCities } from '../hooks/useCatalog.js'
import { parseSearchParams, parseSearchWidgetInitial, buildSearchParams } from '../utils/searchParams.js'
import { parseFilters, applyFilters, applySort } from '../utils/filtering.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const INITIAL_LIMIT = 8
const STEP = 4

const filterHotels = (hotels, q) => {
  const query = (q || '').trim().toLowerCase()
  return query
    ? hotels.filter(
        (h) =>
          h.city.toLowerCase().includes(query) ||
          h.area.toLowerCase().includes(query) ||
          h.name.toLowerCase().includes(query),
      )
    : hotels
}

export default function SearchResultsPage() {
  const { hotels, loading, error, refetch } = useHotels()
  const { cities } = useCities()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT)
  const resultsRef = useRef(null)

  const query = (searchParams.get('q') || '').trim()
  const filters = parseFilters(searchParams)
  const filtered = filterHotels(hotels, query)
  const list = applySort(applyFilters(filtered, filters), filters.sort)
  const derived = parseSearchParams(searchParams)
  const visible = list.slice(0, visibleCount)
  const remaining = list.length - visibleCount

  usePageMeta(
    query ? `Hasil Pencarian: ${query}` : 'Semua Penginapan',
    query
      ? `Cari penginapan untuk "${query}" di WismaKu.`
      : 'Jelajahi semua penginapan yang tersedia di WismaKu.',
  )

  const setFilterParams = (nextFilters) => {
    const params = Object.fromEntries(searchParams.entries())
    params.sort = nextFilters.sort === 'relevance' ? '' : nextFilters.sort
    params.amenities = nextFilters.amenities.join(',')
    params.minPrice = nextFilters.minPrice ? String(nextFilters.minPrice) : ''
    params.maxPrice = nextFilters.maxPrice ? String(nextFilters.maxPrice) : ''
    params.minRating = nextFilters.minRating ? String(nextFilters.minRating) : ''
    const cleaned = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''))
    setSearchParams(cleaned, { replace: true })
    setVisibleCount(INITIAL_LIMIT)
  }

  const handleSearch = ({ destination, checkIn, checkOut, rooms, adults, children }) => {
    setSearchParams(buildSearchParams({ destination, checkIn, checkOut, rooms, adults, children }), {
      replace: true,
    })
    setVisibleCount(INITIAL_LIMIT)
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const resetSearch = () => {
    setSearchParams({}, { replace: true })
    setVisibleCount(INITIAL_LIMIT)
  }

  return (
    <>
      <TopBar />
      <Header />
      <main>
        <section className="bg-white py-8 max-[768px]:py-6">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <SearchWidget
              key={JSON.stringify(parseSearchWidgetInitial(searchParams))}
              cities={cities}
              hotels={hotels}
              onSearch={handleSearch}
              initial={parseSearchWidgetInitial(searchParams)}
            />
          </div>
        </section>
        <section className="bg-[#f7f7f7] py-10 max-[768px]:py-8" ref={resultsRef} id="search-results">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="mb-0 text-[26px] font-extrabold text-black max-[768px]:text-xl">
                {query
                  ? `Hasil Pencarian untuk "${query}" (${list.length})`
                  : `Semua Penginapan (${list.length})`}
                {derived.nights > 0 && (
                  <span className="ml-2.5 text-[13.5px] font-bold text-rd-teal">
                    {derived.nights} malam &middot; {derived.guests} tamu
                  </span>
                )}
              </h2>
              {!loading && !error && list.length > 0 && (
                <FilterBar hotels={list} allHotels={filtered} filters={filters} onChange={setFilterParams} />
              )}
            </div>
            {loading ? (
              <div
                className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5"
                aria-hidden="true"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <HotelCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <ErrorBanner onRetry={refetch} message="Gagal memuat penginapan." />
            ) : list.length === 0 ? (
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
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <p className="mb-[18px] text-rd-muted">
                  {query ? `Tidak ada penginapan cocok untuk "${query}"` : 'Tidak ada penginapan ditemukan.'}
                  {query && derived.nights > 0 ? ` selama ${derived.nights} malam.` : query ? '.' : ''}
                </p>
                <button className="btn btn-primary" type="button" onClick={resetSearch}>
                  Ubah Pencarian
                </button>
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5">
                  {visible.map((h) => (
                    <HotelCard
                      key={h.id}
                      hotel={h}
                      nights={derived.nights}
                      onOpen={(hotel) => navigate(`/hotel/${hotel.id}`)}
                    />
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
      </main>
      <Footer />
    </>
  )
}

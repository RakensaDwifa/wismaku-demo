import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SearchWidget from '../components/SearchWidget.jsx'
import FilterBar from '../components/FilterBar.jsx'
import HotelCard from '../components/HotelCard.jsx'
import { HotelCardSkeleton, Skeleton } from '../components/Skeletons.jsx'
import Modal from '../components/ui/Modal.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { useHotels, useCities } from '../hooks/useCatalog.js'
import { parseSearchParams, parseSearchWidgetInitial, buildSearchParams } from '../utils/searchParams.js'
import {
  parseFilters,
  applyFilters,
  applySort,
  countActiveFilters,
  DEFAULT_FILTERS,
} from '../utils/filtering.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useLanguage } from '../i18n/useLanguage.js'

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
  const { t } = useLanguage()
  const { hotels, loading, error, refetch } = useHotels()
  const { cities } = useCities()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT)
  const [filterOpen, setFilterOpen] = useState(false)
  const resultsRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const query = (searchParams.get('q') || '').trim()
  const filters = parseFilters(searchParams)
  const filtered = filterHotels(hotels, query)
  const list = applySort(applyFilters(filtered, filters), filters.sort)
  const derived = parseSearchParams(searchParams)
  const visible = list.slice(0, visibleCount)
  const remaining = list.length - visibleCount
  const activeFilterCount = countActiveFilters(filters)

  usePageMeta(
    query ? t('resultsPage.metaTitleQuery', { q: query }) : t('resultsPage.metaTitleAll'),
    query ? t('resultsPage.metaDescQuery', { q: query }) : t('resultsPage.metaDescAll'),
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
      <main id="main">
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="mb-0 text-[26px] font-extrabold text-black max-[768px]:text-xl">
                {query
                  ? t('resultsPage.headingQuery', { q: query, count: list.length })
                  : t('resultsPage.headingAll', { count: list.length })}
                {derived.nights > 0 && (
                  <span className="ml-2.5 text-[13.5px] font-bold text-rd-teal">
                    {t('resultsPage.metaNights', { nights: derived.nights, guests: derived.guests })}
                  </span>
                )}
              </h2>
              {!loading && !error && (
                <button
                  className="btn btn-outline btn-sm min-[993px]:hidden"
                  type="button"
                  onClick={() => setFilterOpen(true)}
                >
                  {t('filter.title')}
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
              )}
            </div>

            <div className="mt-6 grid items-start gap-6 min-[993px]:grid-cols-[300px_1fr]">
              <aside className="hidden min-[993px]:block" aria-label={t('resultsPage.asideAria')}>
                {loading || error ? (
                  <Skeleton className="rounded-2xl" style={{ height: 440, borderRadius: 16 }} />
                ) : (
                  <div className="min-[993px]:sticky min-[993px]:top-[90px]">
                    <FilterBar
                      hotels={list}
                      allHotels={filtered}
                      filters={filters}
                      onChange={setFilterParams}
                    />
                  </div>
                )}
              </aside>

              <div className="min-w-0">
                {loading ? (
                  <div
                    className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <HotelCardSkeleton key={i} />
                    ))}
                  </div>
                ) : error ? (
                  <ErrorBanner onRetry={refetch} message={t('errors.loadStays')} />
                ) : list.length === 0 ? (
                  <div className="rounded-[14px] border border-dashed border-rd-border bg-white px-5 py-[60px] text-center">
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
                      {query ? t('resultsPage.emptyQuery', { q: query }) : t('resultsPage.emptyAll')}
                      {query && derived.nights > 0
                        ? t('resultsPage.emptyDuration', { nights: derived.nights })
                        : query
                          ? '.'
                          : ''}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2.5">
                      {activeFilterCount > 0 && (
                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={() => setFilterParams(DEFAULT_FILTERS)}
                        >
                          {t('resultsPage.resetFilter')}
                        </button>
                      )}
                      <button className="btn btn-primary" type="button" onClick={resetSearch}>
                        {t('resultsPage.changeSearch')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5">
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
                          {t('home.loadMore', { count: remaining })}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {filterOpen && !loading && !error && (
        <Modal variant="sheet" onClose={() => setFilterOpen(false)} labelledBy="filter-sheet-title">
          <h2 id="filter-sheet-title" className="sr-only">
            {t('resultsPage.sheetTitle')}
          </h2>
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[#dfe2e8]" aria-hidden="true" />
          <div className="overflow-y-auto px-5 py-4">
            <FilterBar hotels={list} allHotels={filtered} filters={filters} onChange={setFilterParams} />
          </div>
          <div className="shrink-0 border-t border-rd-border bg-white px-5 py-4">
            <button className="btn btn-primary w-full" type="button" onClick={() => setFilterOpen(false)}>
              {t('resultsPage.showStays', { count: list.length })}
            </button>
          </div>
        </Modal>
      )}
      <Footer />
    </>
  )
}

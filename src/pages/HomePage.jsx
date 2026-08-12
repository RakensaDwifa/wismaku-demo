import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import CityChips from '../components/CityChips.jsx'
import PromoCarousel from '../components/PromoCarousel.jsx'
import PopularHotels from '../components/PopularHotels.jsx'
import BrandCards from '../components/BrandCards.jsx'
import AssuranceBar from '../components/AssuranceBar.jsx'
import Testimonials from '../components/Testimonials.jsx'
import Footer from '../components/Footer.jsx'
import MemberModal from '../components/MemberModal.jsx'
import PartnerModal from '../components/PartnerModal.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { useHotels, useCities, usePromos, useBrands, useTestimonials } from '../hooks/useCatalog.js'
import { parseSearchParams, parseSearchWidgetInitial, buildSearchParams } from '../utils/searchParams.js'
import { parseFilters, applyFilters, applySort } from '../utils/filtering.js'
import { srcSet } from '../utils/image.js'
import '../styles/app.css'

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

export default function HomePage() {
  const { hotels, loading: hotelsLoading, error: hotelsError, refetch: refetchHotels } = useHotels()
  const { cities, loading: citiesLoading, error: citiesError, refetch: refetchCities } = useCities()
  const { data: promos, loading: promosLoading, error: promosError, refetch: refetchPromos } = usePromos()
  const { data: brands, loading: brandsLoading, error: brandsError, refetch: refetchBrands } = useBrands()
  const {
    data: testimonials,
    loading: testimonialsLoading,
    error: testimonialsError,
    refetch: refetchTestimonials,
  } = useTestimonials()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [clubOpen, setClubOpen] = useState(false)
  const [partnerOpen, setPartnerOpen] = useState(false)
  const hotelsRef = useRef(null)
  const heroRef = useRef(null)

  const query = (searchParams.get('q') || '').trim()
  const isSearch = Boolean(query)
  const filters = parseFilters(searchParams)
  const filtered = isSearch ? filterHotels(hotels, query) : hotels
  const list = applySort(applyFilters(filtered, filters), filters.sort)
  const derivedSearch = isSearch ? parseSearchParams(searchParams) : null

  const setFilterParams = (nextFilters) => {
    const params = Object.fromEntries(searchParams.entries())
    params.sort = nextFilters.sort === 'relevance' ? '' : nextFilters.sort
    params.amenities = nextFilters.amenities.join(',')
    params.minPrice = nextFilters.minPrice ? String(nextFilters.minPrice) : ''
    params.maxPrice = nextFilters.maxPrice ? String(nextFilters.maxPrice) : ''
    const cleaned = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''))
    setSearchParams(cleaned, { replace: true })
  }

  const handleSearch = ({ destination, checkIn, checkOut, rooms, adults, children }) => {
    setSearchParams(buildSearchParams({ destination, checkIn, checkOut, rooms, adults, children }), {
      replace: true,
    })
    hotelsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const resetSearch = () => {
    setSearchParams({}, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openHotel = (hotel) => navigate(`/hotel/${hotel.id}`)

  return (
    <>
      <TopBar />
      <Header />
      <main>
        <div ref={heroRef}>
          <Hero cities={cities} onSearch={handleSearch} initial={parseSearchWidgetInitial(searchParams)} />
        </div>
        <CityChips
          cities={cities}
          onPick={(c) => handleSearch({ destination: c })}
          loading={citiesLoading}
          error={citiesError}
          onRetry={refetchCities}
        />
        <PromoCarousel
          promos={promos}
          onShowHotels={() => hotelsRef.current?.scrollIntoView({ behavior: 'smooth' })}
          loading={promosLoading}
          error={promosError}
          onRetry={refetchPromos}
        />
        <div ref={hotelsRef}>
          <PopularHotels
            hotels={list}
            isSearch={isSearch}
            onReset={resetSearch}
            searchParams={derivedSearch}
            onOpen={openHotel}
            loading={hotelsLoading}
            error={hotelsError}
            onRetry={refetchHotels}
            filters={filters}
            onFiltersChange={setFilterParams}
          />
        </div>
        {brandsLoading ? (
          <div className="container" aria-hidden="true">
            <div className="skeleton" style={{ height: 28, width: '45%', margin: '48px auto 20px' }} />
            <div className="brands-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="skeleton" key={i} style={{ height: 300, borderRadius: 16 }} />
              ))}
            </div>
          </div>
        ) : brandsError ? (
          <div className="container">
            <ErrorBanner onRetry={refetchBrands} message="Gagal memuat brand." />
          </div>
        ) : (
          <BrandCards brands={brands} />
        )}
        <section className="redclub" id="redclub">
          <div className="container redclub-inner">
            <div className="redclub-text">
              <h2>Gabung WismaClub, Gratis!</h2>
              <p>
                Diskon member hingga 20%, check-in lebih awal, dan fleksibilitas check-out di ribuan properti.
              </p>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => setClubOpen(true)}>
              Daftar WismaClub
            </button>
          </div>
        </section>
        <section className="partner" id="partner">
          <div className="container partner-inner">
            <div className="partner-text">
              <h2>Punya Penginapan? Jadi Partner Kami</h2>
              <p className="gray_color">
                Gabung jaringan 3500+ properti dan naikkan okupansi hingga 2x lipat.
              </p>
              <p className="dark_gray">
                Mitra kami dapat distribusi, teknologi, dan pendampingan pemasaran dari tim WismaKu.
              </p>
              <button className="btn btn-outline" type="button" onClick={() => setPartnerOpen(true)}>
                Pelajari Lebih Lanjut
              </button>
            </div>
            <div className="partner-media">
              <img
                src="https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=900&q=60"
                srcSet={srcSet(
                  'https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=900&q=60',
                  [600, 900, 1200],
                )}
                sizes="(max-width: 768px) 100vw, 45vw"
                alt="Pemilik penginapan bersama tim"
                loading="lazy"
              />
            </div>
          </div>
        </section>
        <AssuranceBar />
        {testimonialsLoading ? (
          <div className="container" aria-hidden="true">
            <div className="skeleton" style={{ height: 28, width: '40%', margin: '48px auto 20px' }} />
            <div className="testimonials-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="skeleton" key={i} style={{ height: 140, borderRadius: 16 }} />
              ))}
            </div>
          </div>
        ) : testimonialsError ? (
          <div className="container">
            <ErrorBanner onRetry={refetchTestimonials} message="Gagal memuat testimoni." />
          </div>
        ) : (
          <Testimonials items={testimonials} />
        )}
      </main>
      <Footer onOpenPartner={() => setPartnerOpen(true)} />
      {clubOpen && <MemberModal onClose={() => setClubOpen(false)} />}
      {partnerOpen && <PartnerModal onClose={() => setPartnerOpen(false)} />}
    </>
  )
}

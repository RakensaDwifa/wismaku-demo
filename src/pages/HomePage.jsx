import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import CityChips from '../components/CityChips.jsx'
import PromoCarousel from '../components/PromoCarousel.jsx'
import PopularHotels from '../components/PopularHotels.jsx'
import RecentHotels from '../components/RecentHotels.jsx'
import AssuranceBar from '../components/AssuranceBar.jsx'
import Testimonials from '../components/Testimonials.jsx'
import Footer from '../components/Footer.jsx'
import MemberModal from '../components/MemberModal.jsx'
import PartnerModal from '../components/PartnerModal.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { Skeleton } from '../components/Skeletons.jsx'
import { useHotels, useCities, usePromos, useTestimonials } from '../hooks/useCatalog.js'
import { buildSearchParams } from '../utils/searchParams.js'
import { srcSet } from '../utils/image.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { getRecentViews } from '../services/history.js'
import { scrollToCenter } from '../utils/scroll.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function HomePage() {
  const { t } = useLanguage()
  const { hotels, loading: hotelsLoading, error: hotelsError, refetch: refetchHotels } = useHotels()
  const { cities, loading: citiesLoading, error: citiesError, refetch: refetchCities } = useCities()
  const { data: promos, loading: promosLoading, error: promosError, refetch: refetchPromos } = usePromos()
  const {
    data: testimonials,
    loading: testimonialsLoading,
    error: testimonialsError,
    refetch: refetchTestimonials,
  } = useTestimonials()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [clubOpen, setClubOpen] = useState(false)
  const [partnerOpen, setPartnerOpen] = useState(false)
  const [recentIds] = useState(() => getRecentViews())
  const hotelsRef = useRef(null)
  const heroRef = useRef(null)

  usePageMeta(null, t('home.metaDesc'))

  const legacyQuery = searchParams.get('q')
  useEffect(() => {
    if (legacyQuery) navigate(`/hasil?${searchParams.toString()}`, { replace: true })
  }, [legacyQuery, searchParams, navigate])

  useEffect(() => {
    const id = location.state?.scrollTo
    if (!id) return
    const t = setTimeout(() => scrollToCenter(id), 100)
    return () => clearTimeout(t)
  }, [location.state])

  const recentHotels = recentIds
    .map((recentId) => hotels.find((h) => String(h.id) === String(recentId)))
    .filter(Boolean)

  const handleSearch = ({ destination, checkIn, checkOut, rooms, adults, children }) => {
    const qs = new URLSearchParams(
      buildSearchParams({ destination, checkIn, checkOut, rooms, adults, children }),
    ).toString()
    navigate(qs ? `/hasil?${qs}` : '/hasil')
  }

  const handleCityPick = (name) => navigate(`/hasil?q=${encodeURIComponent(name)}`)

  const openHotel = (hotel) => navigate(`/hotel/${hotel.id}`)

  return (
    <>
      <TopBar />
      <Header />
      <main id="main">
        <div ref={heroRef}>
          <Hero cities={cities} hotels={hotels} onSearch={handleSearch} initial={{}} />
        </div>
        <CityChips
          cities={cities}
          onPick={handleCityPick}
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
            hotels={hotels}
            onOpen={openHotel}
            loading={hotelsLoading}
            error={hotelsError}
            onRetry={refetchHotels}
          />
        </div>
        <RecentHotels hotels={recentHotels} onOpen={openHotel} />
        <section className="bg-rd-soft py-11" id="redclub">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-6 px-5 max-[768px]:justify-center max-[768px]:text-center">
            <div>
              <h2 className="text-2xl font-extrabold">{t('member.title')}</h2>
              <p className="mt-2 max-w-[560px] text-sm leading-[1.6] text-rd-muted max-[768px]:mx-auto">
                {t('home.clubSubtitle')}
              </p>
            </div>
            <button
              className="btn btn-primary max-[768px]:mx-auto"
              type="button"
              onClick={() => setClubOpen(true)}
            >
              {t('home.joinClub')}
            </button>
          </div>
        </section>
        <section className="bg-white py-12" id="partner">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-[1fr_1.4fr] overflow-hidden rounded-[14px] border border-rd-border bg-white max-[768px]:grid-cols-1">
            <div className="flex flex-col justify-center p-10 max-[768px]:p-7">
              <h2 className="text-2xl font-extrabold leading-[1.3]">{t('partner.title')}</h2>
              <p className="my-3 mb-1 text-sm text-rd-muted">{t('partner.subtitle')}</p>
              <p className="mt-1.5 mb-5 text-[13.5px] leading-[1.6] text-rd-muted">{t('partner.extra')}</p>
              <button
                className="btn btn-outline self-start"
                type="button"
                onClick={() => setPartnerOpen(true)}
              >
                {t('partner.learnMore')}
              </button>
            </div>
            <div className="min-h-[280px] max-[768px]:order-first max-[768px]:min-h-[200px]">
              <img
                src="https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=900&q=60"
                srcSet={srcSet(
                  'https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=900&q=60',
                  [600, 900, 1200],
                )}
                sizes="(max-width: 768px) 100vw, 45vw"
                alt={t('partner.imgAlt')}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
        <AssuranceBar />
        {testimonialsLoading ? (
          <div className="mx-auto w-full max-w-[1200px] px-5" aria-hidden="true">
            <Skeleton className="mx-auto mt-12 mb-5 h-7 w-[40%]" />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 max-[640px]:grid-cols-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[140px] rounded-2xl" />
              ))}
            </div>
          </div>
        ) : testimonialsError ? (
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <ErrorBanner onRetry={refetchTestimonials} message={t('errors.loadTestimonials')} />
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

import { useRef, useState } from 'react'
import TopBar from './components/TopBar.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import CityChips from './components/CityChips.jsx'
import PromoCarousel from './components/PromoCarousel.jsx'
import PopularHotels from './components/PopularHotels.jsx'
import BrandCards from './components/BrandCards.jsx'
import AssuranceBar from './components/AssuranceBar.jsx'
import Testimonials from './components/Testimonials.jsx'
import Footer from './components/Footer.jsx'
import { cities } from './data/cities.js'
import { hotels, promos, brands, testimonials } from './data/hotels.js'
import './styles/app.css'

export default function App() {
  const [filtered, setFiltered] = useState(hotels)
  const [searchActive, setSearchActive] = useState(false)
  const hotelsRef = useRef(null)
  const heroRef = useRef(null)

  const handleSearch = ({ destination }) => {
    const q = (destination || '').trim().toLowerCase()
    const next = q
      ? hotels.filter((h) => h.city.toLowerCase().includes(q) || h.area.toLowerCase().includes(q) || h.name.toLowerCase().includes(q))
      : hotels
    setFiltered(next)
    setSearchActive(Boolean(q))
    hotelsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const resetSearch = () => {
    setFiltered(hotels)
    setSearchActive(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <TopBar />
      <Header />
      <main>
        <div ref={heroRef}>
          <Hero cities={cities} onSearch={handleSearch} />
        </div>
        <CityChips cities={cities} onPick={(c) => handleSearch({ destination: c })} />
        <PromoCarousel promos={promos} />
        <div ref={hotelsRef}>
          <PopularHotels hotels={filtered} isSearch={searchActive} onReset={resetSearch} />
        </div>
        <BrandCards brands={brands} />
        <section className="redclub" id="redclub">
          <div className="container redclub-inner">
            <div className="redclub-text">
              <h2>Gabung WismaClub, Gratis!</h2>
              <p>Diskon member hingga 20%, check-in lebih awal, dan fleksibilitas check-out di ribuan properti.</p>
            </div>
            <button className="btn btn-primary is-disabled" type="button" disabled>
              Daftar WismaClub
            </button>
          </div>
        </section>
        <section className="partner" id="partner">
          <div className="container partner-inner">
            <div className="partner-text">
              <h2>Punya Penginapan? Jadi Partner Kami</h2>
              <p className="gray_color">Gabung jaringan 3500+ properti dan naikkan okupansi hingga 2x lipat.</p>
              <p className="dark_gray">Mitra kami dapat distribusi, teknologi, dan pendampingan pemasaran dari tim WismaKu.</p>
              <button className="btn btn-outline is-disabled" type="button" disabled>
                Pelajari Lebih Lanjut
              </button>
            </div>
            <div className="partner-media">
              <img
                src="https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=900&q=60"
                alt="Pemilik penginapan bersama tim"
                loading="lazy"
              />
            </div>
          </div>
        </section>
        <AssuranceBar />
        <Testimonials items={testimonials} />
      </main>
      <Footer />
    </>
  )
}
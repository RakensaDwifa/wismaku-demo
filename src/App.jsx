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
import AppDownload from './components/AppDownload.jsx'
import Footer from './components/Footer.jsx'
import { cities } from './data/cities.js'
import { hotels, promos, brands, testimonials } from './data/hotels.js'
import './styles/app.css'

export default function App() {
  const [filtered, setFiltered] = useState(hotels)
  const hotelsRef = useRef(null)

  const handleSearch = ({ destination }) => {
    const q = (destination || '').trim().toLowerCase()
    const next = q
      ? hotels.filter((h) => h.city.toLowerCase().includes(q) || h.area.toLowerCase().includes(q) || h.name.toLowerCase().includes(q))
      : hotels
    setFiltered(next)
    hotelsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <TopBar />
      <Header />
      <main>
        <Hero cities={cities} onSearch={handleSearch} />
        <CityChips cities={cities} onPick={(c) => handleSearch({ destination: c })} />
        <PromoCarousel promos={promos} />
        <div ref={hotelsRef}>
          <PopularHotels hotels={filtered} />
        </div>
        <BrandCards brands={brands} />
        <AssuranceBar />
        <Testimonials items={testimonials} />
        <AppDownload />
      </main>
      <Footer />
    </>
  )
}
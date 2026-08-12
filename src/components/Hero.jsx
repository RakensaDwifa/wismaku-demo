import { useEffect, useRef, useState } from 'react'
import SearchWidget from './SearchWidget.jsx'

export default function Hero({ cities, onSearch }) {
  const heroRef = useRef(null)
  const [fixed, setFixed] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return
      const heroBottom = heroRef.current.getBoundingClientRect().bottom
      setFixed(heroBottom <= 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section ref={heroRef} className={`hero${fixed ? ' hero--search-fixed' : ''}`} id="top">
      <div className="hero-bg">
        <img
          src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1800&q=70"
          alt="Suasana penginapan yang nyaman"
        />
        <div className="hero-overlay" />
      </div>
      <div className="hero-content container">
        <h1 className="hero-title">
          Booking Hotel Murah, <br />
          <span>Harga Promo Hanya di RedDoo</span>
        </h1>
        <p className="hero-sub">
          Penginapan bersih, nyaman, dan terjangkau di lebih dari 100 kota strategis di Indonesia.
        </p>
      </div>
      <div className={`search-wrap${fixed ? ' search-wrap--fixed' : ''}`}>
        <div className="container">
          <SearchWidget cities={cities} onSearch={onSearch} />
        </div>
      </div>
    </section>
  )
}
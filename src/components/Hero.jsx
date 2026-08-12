import { useEffect, useRef, useState } from 'react'
import SearchWidget from './SearchWidget.jsx'
import { srcSet } from '../utils/image.js'

export default function Hero({ cities, hotels, onSearch, initial }) {
  const heroRef = useRef(null)
  const [fixed, setFixed] = useState(false)

  const heroImg =
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1800&q=70'

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
          src={heroImg}
          srcSet={srcSet(heroImg, [800, 1200, 1800])}
          sizes="100vw"
          alt="Suasana penginapan yang nyaman"
          fetchpriority="high"
        />
        <div className="hero-overlay" />
      </div>
      <div className="hero-content container">
        <h1 className="hero-title">
          Booking Hotel Murah, <br />
          <span>Harga Promo Hanya di WismaKu</span>
        </h1>
        <p className="hero-sub">
          Penginapan bersih, nyaman, dan terjangkau di lebih dari 100 kota strategis di Indonesia.
        </p>
      </div>
      <div className={`search-wrap${fixed ? ' search-wrap--fixed' : ''}`}>
        <div className="container">
          <SearchWidget
            key={JSON.stringify(initial)}
            cities={cities}
            hotels={hotels}
            onSearch={onSearch}
            initial={initial}
          />
        </div>
      </div>
    </section>
  )
}

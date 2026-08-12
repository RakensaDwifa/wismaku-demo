import { useEffect, useState } from 'react'
import { srcSet } from '../utils/image.js'
import ErrorBanner from './ErrorBanner.jsx'

export default function PromoCarousel({ promos, onShowHotels, loading = false, error, onRetry }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || promos.length === 0) return
    const t = setInterval(() => setActive((i) => (i + 1) % promos.length), 5000)
    return () => clearInterval(t)
  }, [promos.length, paused])

  const go = (dir) => {
    if (promos.length === 0) return
    setActive((i) => (i + dir + promos.length) % promos.length)
  }

  if (loading) {
    return (
      <section className="section promo-section" id="promo">
        <div className="container">
          <div className="promo-header">
            <h2 className="section-title promo-title">Penawaran Menarik</h2>
          </div>
          {error ? (
            <ErrorBanner onRetry={onRetry} message="Gagal memuat promo." />
          ) : (
            <div className="skeleton" style={{ height: 260, borderRadius: 16 }} aria-hidden="true" />
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="section promo-section" id="promo">
      <div className="container">
        <div className="promo-header">
          <h2 className="section-title promo-title">Penawaran Menarik</h2>
          <button className="btn btn-outline btn-sm" type="button" onClick={onShowHotels}>
            Lihat Semua Promo
          </button>
        </div>
        {error ? (
          <ErrorBanner onRetry={onRetry} message="Gagal memuat promo." />
        ) : (
          <div
            className="carousel"
            role="region"
            aria-roledescription="carousel"
            aria-label="Penawaran menarik"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            {promos.map((p, i) => (
              <div
                className={`carousel-slide${i === active ? ' is-active' : ''}`}
                key={p.id}
                aria-hidden={i !== active}
              >
                <img
                  src={p.img}
                  srcSet={srcSet(p.img, [600, 1200, 1600])}
                  sizes="100vw"
                  alt={p.title}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
                <div className="carousel-caption">
                  <h3>{p.title}</h3>
                  <p>{p.subtitle}</p>
                  <button
                    className="carousel-cta"
                    type="button"
                    onClick={onShowHotels}
                    title="Lihat penginapan pilihan"
                  >
                    Pesan Sekarang
                  </button>
                </div>
              </div>
            ))}
            <button
              className="carousel-arrow carousel-arrow--prev"
              type="button"
              onClick={() => go(-1)}
              aria-label="Sebelumnya"
            >
              &#8249;
            </button>
            <button
              className="carousel-arrow carousel-arrow--next"
              type="button"
              onClick={() => go(1)}
              aria-label="Berikutnya"
            >
              &#8250;
            </button>
            <div className="carousel-dots">
              {promos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={`dot${i === active ? ' is-active' : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === active}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

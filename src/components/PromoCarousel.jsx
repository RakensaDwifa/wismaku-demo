import { useEffect, useState } from 'react'

export default function PromoCarousel({ promos }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % promos.length), 5000)
    return () => clearInterval(t)
  }, [promos.length])

  const go = (dir) => {
    setActive((i) => (i + dir + promos.length) % promos.length)
  }

  return (
    <section className="section promo-section" id="promo">
      <div className="container">
        <div className="promo-header">
          <h2 className="section-title promo-title">Penawaran Menarik</h2>
          <button className="btn btn-outline btn-sm" type="button">Lihat Semua Promo</button>
        </div>
        <div className="carousel">
          {promos.map((p, i) => (
            <div className={`carousel-slide${i === active ? ' is-active' : ''}`} key={p.id}>
              <img src={p.img} alt={p.title} />
              <div className="carousel-caption">
                <h3>{p.title}</h3>
                <p>{p.subtitle}</p>
                <span className="carousel-cta">Pesan Sekarang</span>
              </div>
            </div>
          ))}
          <button className="carousel-arrow carousel-arrow--prev" type="button" onClick={() => go(-1)} aria-label="Sebelumnya">&#8249;</button>
          <button className="carousel-arrow carousel-arrow--next" type="button" onClick={() => go(1)} aria-label="Berikutnya">&#8250;</button>
          <div className="carousel-dots">
            {promos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`dot${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
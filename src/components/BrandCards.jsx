export default function BrandCards({ brands }) {
  return (
    <section className="section brands-section" id="brands">
      <div className="container">
        <h2 className="section-title">Pilihan Brand &amp; Akomodasi Terbaik</h2>
        <div className="brands-grid">
          {brands.map((b) => (
            <article className="brand-card" key={b.name}>
              <div className="brand-card__media">
                <img src={b.img} alt={b.name} loading="lazy" />
              </div>
              <div className="brand-card__body">
                <h3 className="brand-card__name">
                  <span className="brand-card__dot" style={{ background: b.color }} />
                  {b.name}
                </h3>
                <p className="brand-card__tag">{b.tagline}</p>
                <p className="brand-card__desc">{b.desc}</p>
                <button className="brand-card__btn is-disabled" type="button" disabled>Lihat Semua</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
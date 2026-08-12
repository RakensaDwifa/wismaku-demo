export default function Testimonials({ items }) {
  return (
    <section className="section testimonials-section">
      <div className="container">
        <h2 className="section-title">Kata Mereka Tentang WismaKu</h2>
        <div className="testimonials-grid">
          {items.map((t) => (
            <article className="testimonial-card" key={t.name}>
              <div className="testimonial-stars" aria-label={`Rating ${t.rating} dari 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" width="16" height="16" fill={i < t.rating ? '#F59E0B' : '#D8D8D8'} aria-hidden="true">
                    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                  </svg>
                ))}
              </div>
              <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar" aria-hidden="true">{t.name.charAt(0)}</span>
                <div>
                  <b>{t.name}</b>
                  <span>{t.city}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
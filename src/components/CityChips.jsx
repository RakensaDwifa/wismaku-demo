import { srcSet } from '../utils/image.js'
import { CityChipsSkeleton } from './Skeletons.jsx'
import ErrorBanner from './ErrorBanner.jsx'

export default function CityChips({ cities, onPick, loading = false, error, onRetry }) {
  if (loading) {
    return (
      <section className="section cities-section">
        <div className="container">
          <h2 className="section-title">Cari Penginapan di Kota Favoritmu</h2>
          <CityChipsSkeleton />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section cities-section">
        <div className="container">
          <h2 className="section-title">Cari Penginapan di Kota Favoritmu</h2>
          <ErrorBanner onRetry={onRetry} message="Gagal memuat kota." />
        </div>
      </section>
    )
  }

  return (
    <section className="section cities-section">
      <div className="container">
        <h2 className="section-title">Cari Penginapan di Kota Favoritmu</h2>
        <div className="city-chips">
          {cities.map((c) => (
            <button className="city-chip" type="button" key={c.name} onClick={() => onPick(c.name)}>
              <img
                src={c.img}
                srcSet={srcSet(c.img, [200, 400, 800])}
                sizes="(max-width: 768px) 44vw, 160px"
                alt={c.name}
                loading="lazy"
              />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HotelCardSkeleton() {
  return (
    <article className="hotel-card" aria-hidden="true">
      <div className="skeleton hotel-card__media" style={{ height: 160 }} />
      <div className="hotel-card__body">
        <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 18, width: '60%' }} />
      </div>
    </article>
  )
}

export function CityChipsSkeleton() {
  return (
    <div className="city-chips" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="skeleton" key={i} style={{ height: 104, borderRadius: 14 }} />
      ))}
    </div>
  )
}

export function PromoSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
    </div>
  )
}

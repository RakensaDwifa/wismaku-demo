export default function CityChips({ cities, onPick }) {
  return (
    <section className="section cities-section">
      <div className="container">
        <h2 className="section-title">Cari Penginapan di Kota Favoritmu</h2>
        <div className="city-chips">
          {cities.map((c) => (
            <button className="city-chip" type="button" key={c.name} onClick={() => onPick(c.name)}>
              <img src={c.img} alt={c.name} loading="lazy" />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
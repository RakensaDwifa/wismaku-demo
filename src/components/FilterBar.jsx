import { useEffect, useRef, useState } from 'react'
import { ALL_AMENITIES, SORT_OPTIONS, priceBounds } from '../utils/filtering.js'

export default function FilterBar({ hotels, filters, onChange }) {
  const [open, setOpen] = useState(false)
  const barRef = useRef(null)
  const bounds = priceBounds(hotels)
  const maxBound = bounds.min === bounds.max ? bounds.min + 1 : bounds.max

  const hasFilter =
    filters.sort !== 'relevance' ||
    filters.amenities.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice > 0 ||
    filters.minRating > 0

  useEffect(() => {
    const close = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const set = (patch) => onChange({ ...filters, ...patch })

  const toggleAmenity = (name) => {
    const next = filters.amenities.includes(name)
      ? filters.amenities.filter((a) => a !== name)
      : [...filters.amenities, name]
    set({ amenities: next })
  }

  const reset = () => onChange({ sort: 'relevance', amenities: [], minPrice: 0, maxPrice: 0 })

  return (
    <div className="filter-bar" ref={barRef}>
      <div className="filter-bar__row">
        <button
          className="btn btn-outline btn-sm filter-toggle"
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="filter-panel"
        >
          Filter{hasFilter ? ' (aktif)' : ''}
        </button>
        <label className="filter-sort">
          <span>Urutkan</span>
          <select
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value })}
            aria-label="Urutkan hotel"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {hasFilter && (
          <button className="btn btn-outline btn-sm" type="button" onClick={reset}>
            Reset Filter
          </button>
        )}
      </div>

      {open && (
        <div className="filter-panel" id="filter-panel">
          <fieldset className="filter-group">
            <legend>Fasilitas</legend>
            <div className="filter-chips">
              {ALL_AMENITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`filter-chip${filters.amenities.includes(a) ? ' is-active' : ''}`}
                  onClick={() => toggleAmenity(a)}
                  aria-pressed={filters.amenities.includes(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="filter-group">
            <legend>Harga / malam</legend>
            <div className="filter-prices">
              <label>
                Min
                <input
                  type="number"
                  min={bounds.min}
                  max={maxBound}
                  value={filters.minPrice || ''}
                  placeholder={String(bounds.min)}
                  onChange={(e) => set({ minPrice: Math.max(0, Number(e.target.value) || 0) })}
                />
              </label>
              <span>&ndash;</span>
              <label>
                Maks
                <input
                  type="number"
                  min={bounds.min}
                  max={maxBound}
                  value={filters.maxPrice || ''}
                  placeholder={String(maxBound)}
                  onChange={(e) => set({ maxPrice: Math.max(0, Number(e.target.value) || 0) })}
                />
              </label>
            </div>
          </fieldset>
        </div>
      )}
    </div>
  )
}

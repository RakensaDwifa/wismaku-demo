import { useEffect, useRef, useState } from 'react'
import { ALL_AMENITIES, SORT_OPTIONS, priceBounds } from '../utils/filtering.js'

const RATING_OPTIONS = [
  { value: 0, label: 'Semua' },
  { value: 3, label: '3+ Bintang' },
  { value: 4, label: '4+ Bintang' },
]

const DEFAULT_FILTERS = { sort: 'relevance', amenities: [], minPrice: 0, maxPrice: 0, minRating: 0 }

export default function FilterBar({ hotels, allHotels, filters, onChange }) {
  const [open, setOpen] = useState(false)
  const barRef = useRef(null)
  const bounds = priceBounds(allHotels || hotels)
  const maxBound = bounds.min === bounds.max ? bounds.min + 1 : bounds.max
  const minPos = filters.minPrice || bounds.min
  const maxPos = filters.maxPrice || maxBound

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

  const reset = () => onChange(DEFAULT_FILTERS)

  const setMinPrice = (v) => {
    const val = Math.min(Number(v) || 0, maxBound)
    set({
      minPrice: val,
      maxPrice: filters.maxPrice > 0 ? Math.max(filters.maxPrice, val) : 0,
    })
  }

  const setMaxPrice = (v) => {
    const val = Math.min(maxBound, Math.max(0, Number(v) || 0))
    set({
      maxPrice: val,
      minPrice: filters.minPrice > 0 ? Math.min(filters.minPrice, val) : 0,
    })
  }

  const onMinInput = (e) => {
    const v = e.target.value
    if (v === '') return set({ minPrice: 0 })
    setMinPrice(v)
  }

  const onMaxInput = (e) => {
    const v = e.target.value
    if (v === '') return set({ maxPrice: 0 })
    setMaxPrice(v)
  }

  return (
    <div className="flex items-center gap-3 max-[768px]:w-full" ref={barRef}>
      <div className="flex flex-wrap items-center gap-2.5 max-[768px]:w-full">
        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="filter-panel"
        >
          Filter{hasFilter ? ' (aktif)' : ''}
        </button>
        <label className="inline-flex items-center gap-2 text-[13px] font-bold text-rd-text">
          <span>Urutkan</span>
          <select
            className="rounded-lg border border-rd-border bg-white px-2.5 py-2 text-[13px] font-semibold text-rd-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd max-[768px]:flex-1"
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
        <div className="mt-4 rounded-[14px] border border-rd-border bg-white p-4" id="filter-panel">
          <fieldset className="m-0 mb-[14px] border-none p-0">
            <legend className="mb-2 p-0 text-[13px] font-extrabold text-rd-muted">Rating</legend>
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className="rounded-full border border-rd-border bg-white px-3 py-[7px] text-[13px] font-semibold text-rd-text transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd aria-pressed:border-rd-teal aria-pressed:bg-[#f0fdfa] aria-pressed:text-[#0f766e]"
                  onClick={() => set({ minRating: r.value })}
                  aria-pressed={filters.minRating === r.value}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="m-0 mb-[14px] border-none p-0">
            <legend className="mb-2 p-0 text-[13px] font-extrabold text-rd-muted">Fasilitas</legend>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="rounded-full border border-rd-border bg-white px-3 py-[7px] text-[13px] font-semibold text-rd-text transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd aria-pressed:border-rd-teal aria-pressed:bg-[#f0fdfa] aria-pressed:text-[#0f766e]"
                  onClick={() => toggleAmenity(a)}
                  aria-pressed={filters.amenities.includes(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="m-0 mb-[14px] border-none p-0">
            <legend className="mb-2 p-0 text-[13px] font-extrabold text-rd-muted">Harga / malam</legend>
            <div className="filter-range">
              <input
                type="range"
                className="range-min"
                aria-label="Harga minimum"
                min={bounds.min}
                max={maxBound}
                value={minPos}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="range"
                className="range-max"
                aria-label="Harga maksimum"
                min={bounds.min}
                max={maxBound}
                value={maxPos}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2.5 max-[768px]:flex-col max-[768px]:items-stretch">
              <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-rd-muted">
                Min
                <input
                  className="w-[110px] rounded-lg border border-rd-border bg-white px-2.5 py-2 text-[14px] text-rd-text focus:border-rd focus:outline-none max-[768px]:w-full"
                  type="number"
                  min={bounds.min}
                  max={maxBound}
                  value={filters.minPrice || ''}
                  placeholder={String(bounds.min)}
                  onChange={onMinInput}
                />
              </label>
              <span>&ndash;</span>
              <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-rd-muted">
                Maks
                <input
                  className="w-[110px] rounded-lg border border-rd-border bg-white px-2.5 py-2 text-[14px] text-rd-text focus:border-rd focus:outline-none max-[768px]:w-full"
                  type="number"
                  min={bounds.min}
                  max={maxBound}
                  value={filters.maxPrice || ''}
                  placeholder={String(maxBound)}
                  onChange={onMaxInput}
                />
              </label>
            </div>
          </fieldset>
        </div>
      )}
    </div>
  )
}

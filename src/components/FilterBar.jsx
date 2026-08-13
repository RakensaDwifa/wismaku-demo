import {
  SORT_OPTIONS,
  ALL_AMENITIES,
  priceBounds,
  DEFAULT_FILTERS,
  countActiveFilters,
} from '../utils/filtering.js'

const RATING_OPTIONS = [
  { value: 0, label: 'Semua' },
  { value: 3, label: '3+ Bintang' },
  { value: 4, label: '4+ Bintang' },
]

export default function FilterBar({ hotels, allHotels, filters, onChange }) {
  const bounds = priceBounds(allHotels || hotels)
  const maxBound = bounds.min === bounds.max ? bounds.min + 1 : bounds.max
  const minPos = filters.minPrice || bounds.min
  const maxPos = filters.maxPrice || maxBound
  const activeCount = countActiveFilters(filters)

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
    <div className="rounded-2xl border border-rd-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[16px] font-extrabold text-rd-text">
          Filter
          {activeCount > 0 && (
            <span className="grid min-w-[20px] place-items-center rounded-full bg-rd px-1.5 py-[2px] text-[11px] font-extrabold text-white">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            className="text-[12.5px] font-bold text-rd transition-colors hover:text-rd-dark hover:underline"
            type="button"
            onClick={reset}
          >
            Reset Semua
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-extrabold text-rd-muted" htmlFor="filter-sort">
            Urutkan
          </label>
          <select
            className="w-full rounded-[10px] border border-rd-border bg-white px-3 py-2.5 text-[13.5px] font-semibold text-rd-text transition-[border-color] duration-150 focus:border-rd focus:outline-none"
            id="filter-sort"
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="m-0 border-none p-0">
          <legend className="mb-2 p-0 text-[13px] font-extrabold text-rd-muted">Rating</legend>
          <div className="flex flex-col gap-2">
            {RATING_OPTIONS.map((r) => {
              const active = filters.minRating === r.value
              return (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-all duration-150 ${
                    active ? 'border-rd bg-rd-soft' : 'border-rd-border bg-white hover:border-[#c9ccd4]'
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="filter-rating"
                    value={r.value}
                    checked={active}
                    onChange={() => set({ minRating: r.value })}
                  />
                  <span
                    className={`grid size-[18px] shrink-0 place-items-center rounded-full border-2 ${
                      active ? 'border-rd' : 'border-[#c9ccd4]'
                    }`}
                    aria-hidden="true"
                  >
                    {active && <span className="size-2.5 rounded-full bg-rd" />}
                  </span>
                  <span
                    className={`text-[13.5px] font-semibold ${active ? 'text-[#0f766e]' : 'text-rd-text'}`}
                  >
                    {r.label}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="m-0 border-none p-0">
          <legend className="mb-2 p-0 text-[13px] font-extrabold text-rd-muted">Fasilitas</legend>
          <div className="flex flex-col gap-2">
            {ALL_AMENITIES.map((a) => {
              const active = filters.amenities.includes(a)
              return (
                <label
                  key={a}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-all duration-150 ${
                    active ? 'border-rd bg-rd-soft' : 'border-rd-border bg-white hover:border-[#c9ccd4]'
                  }`}
                >
                  <input
                    className="sr-only"
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleAmenity(a)}
                  />
                  <span
                    className={`grid size-[18px] shrink-0 place-items-center rounded-[5px] border-2 ${
                      active ? 'border-rd bg-rd' : 'border-[#c9ccd4] bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {active && (
                      <svg
                        viewBox="0 0 24 24"
                        width="12"
                        height="12"
                        fill="none"
                        stroke="white"
                        strokeWidth="3.2"
                      >
                        <path d="m4.5 12.5 5 5 10-11" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`text-[13.5px] font-semibold ${active ? 'text-[#0f766e]' : 'text-rd-text'}`}
                  >
                    {a}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="m-0 border-none p-0">
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
          <div className="flex items-center gap-2.5">
            <label className="flex flex-1 flex-col gap-1 text-[12px] font-semibold text-rd-muted">
              Min
              <input
                className="rounded-[10px] border border-rd-border bg-white px-3 py-2 text-[14px] text-rd-text focus:border-rd focus:outline-none"
                type="number"
                min={bounds.min}
                max={maxBound}
                value={filters.minPrice || ''}
                placeholder={String(bounds.min)}
                onChange={onMinInput}
              />
            </label>
            <span className="pt-[18px] text-[13px] text-rd-muted">&ndash;</span>
            <label className="flex flex-1 flex-col gap-1 text-[12px] font-semibold text-rd-muted">
              Maks
              <input
                className="rounded-[10px] border border-rd-border bg-white px-3 py-2 text-[14px] text-rd-text focus:border-rd focus:outline-none"
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
    </div>
  )
}

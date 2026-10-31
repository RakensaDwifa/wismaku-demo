import { useLayoutEffect, useRef } from 'react'
import {
  SORT_OPTIONS,
  ALL_AMENITIES,
  priceBounds,
  DEFAULT_FILTERS,
  countActiveFilters,
} from '../utils/filtering.js'
import { useLanguage } from '../i18n/useLanguage.js'

const RATING_OPTIONS = [
  { value: 0, labelKey: 'filter.ratingAll' },
  { value: 3, labelKey: 'filter.rating3' },
  { value: 4, labelKey: 'filter.rating4' },
]

// ponytail: hanya bilangan bulat Rupiah (tanpa desimal); pakai Intl pecahan/library masking bila tambah mata uang desimal
const fmtNum = (n) => (n > 0 ? n.toLocaleString('id-ID') : '')
const parseDigits = (s) => s.replace(/\D/g, '')

const caretForDigits = (formatted, digits) => {
  if (digits <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] >= '0' && formatted[i] <= '9' && ++seen === digits) return i + 1
  }
  return formatted.length
}

const onPriceKeyDown = (e) => {
  const el = e.currentTarget
  const { selectionStart: s, selectionEnd: end, value } = el
  if (s !== end || s == null) return
  if (e.key === 'Backspace' && s > 1 && value[s - 1] === '.') el.setSelectionRange(s - 2, s)
  else if (e.key === 'Delete' && value[s] === '.') el.setSelectionRange(s, s + 2)
}

export default function FilterBar({ hotels, allHotels, filters, onChange }) {
  const { t } = useLanguage()
  const bounds = priceBounds(allHotels || hotels)
  const maxBound = bounds.min === bounds.max ? bounds.min + 1 : bounds.max
  const minPos = filters.minPrice || bounds.min
  const maxPos = filters.maxPrice || maxBound
  const activeCount = countActiveFilters(filters)
  const caretRef = useRef(null)

  useLayoutEffect(() => {
    if (!caretRef.current) return
    const { el, pos } = caretRef.current
    caretRef.current = null
    if (document.activeElement === el) el.setSelectionRange(pos, pos)
  })

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

  const handlePriceInput = (e, key, currentVal) => {
    const el = e.target
    const caret = el.selectionStart ?? el.value.length
    const allDigits = parseDigits(el.value)
    const trimmed = allDigits.replace(/^0+/, '')
    const leadingZeros = allDigits.length - trimmed.length
    const digitsBefore = Math.max(0, parseDigits(el.value.slice(0, caret)).length - leadingZeros)
    const rawNum = trimmed ? Number(trimmed) : 0
    const nextVal = rawNum ? Math.min(rawNum, maxBound) : 0
    const nextFormatted = fmtNum(nextVal)
    const nextPos = rawNum > maxBound ? nextFormatted.length : caretForDigits(nextFormatted, digitsBefore)

    if (nextVal === currentVal) {
      queueMicrotask(() => {
        if (document.activeElement === el) el.setSelectionRange(nextPos, nextPos)
      })
      return
    }
    caretRef.current = { el, pos: nextPos }
    set({ [key]: nextVal })
  }

  const onMinBlur = () => {
    if (filters.minPrice > 0 && filters.maxPrice > 0 && filters.minPrice > filters.maxPrice) {
      set({ maxPrice: filters.minPrice })
    }
  }

  const onMaxBlur = () => {
    if (filters.minPrice > 0 && filters.maxPrice > 0 && filters.maxPrice < filters.minPrice) {
      set({ minPrice: filters.maxPrice })
    }
  }

  return (
    <div className="rounded-2xl border border-rd-border bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[16px] font-extrabold text-rd-text">
          {t('filter.title')}
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
            {t('filter.resetAll')}
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-extrabold text-rd-muted" htmlFor="filter-sort">
            {t('filter.sort')}
          </label>
          <select
            className="w-full rounded-[10px] border border-rd-border bg-white px-3 py-2.5 text-[13.5px] font-semibold text-rd-text transition-[border-color] duration-150 focus:border-rd focus:outline-none"
            id="filter-sort"
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="m-0 border-none p-0">
          <legend className="mb-2 p-0 text-[13px] font-extrabold text-rd-muted">{t('filter.rating')}</legend>
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
                    {t(r.labelKey)}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="m-0 border-none p-0">
          <legend className="mb-2 p-0 text-[13px] font-extrabold text-rd-muted">
            {t('filter.facilities')}
          </legend>
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
                    {t('filter.amenities')[a] ?? a}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="m-0 border-none p-0">
          <legend className="mb-2 p-0 text-[13px] font-extrabold text-rd-muted">
            {t('filter.pricePerNight')}
          </legend>
          <div className="filter-range">
            <input
              type="range"
              className="range-min"
              aria-label={t('filter.minAria')}
              min={bounds.min}
              max={maxBound}
              value={minPos}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="range"
              className="range-max"
              aria-label={t('filter.maxAria')}
              min={bounds.min}
              max={maxBound}
              value={maxPos}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2.5">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] font-semibold text-rd-muted">
              {t('filter.min')}
              <span className="flex items-center gap-1.5 rounded-[10px] border border-rd-border bg-white px-2.5 py-2 transition-[border-color] duration-150 focus-within:border-rd">
                <span className="select-none text-[13px] font-bold text-rd-muted" aria-hidden="true">
                  Rp
                </span>
                <input
                  className="w-full min-w-0 bg-transparent text-[13.5px] text-rd-text focus:outline-none"
                  type="text"
                  inputMode="numeric"
                  aria-label={t('filter.min')}
                  value={fmtNum(filters.minPrice)}
                  placeholder={bounds.min.toLocaleString('id-ID')}
                  onKeyDown={onPriceKeyDown}
                  onChange={(e) => handlePriceInput(e, 'minPrice', filters.minPrice)}
                  onBlur={onMinBlur}
                />
              </span>
            </label>
            <span className="pt-[18px] text-[13px] text-rd-muted">&ndash;</span>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] font-semibold text-rd-muted">
              {t('filter.max')}
              <span className="flex items-center gap-1.5 rounded-[10px] border border-rd-border bg-white px-2.5 py-2 transition-[border-color] duration-150 focus-within:border-rd">
                <span className="select-none text-[13px] font-bold text-rd-muted" aria-hidden="true">
                  Rp
                </span>
                <input
                  className="w-full min-w-0 bg-transparent text-[13.5px] text-rd-text focus:outline-none"
                  type="text"
                  inputMode="numeric"
                  aria-label={t('filter.max')}
                  value={fmtNum(filters.maxPrice)}
                  placeholder={maxBound.toLocaleString('id-ID')}
                  onKeyDown={onPriceKeyDown}
                  onChange={(e) => handlePriceInput(e, 'maxPrice', filters.maxPrice)}
                  onBlur={onMaxBlur}
                />
              </span>
            </label>
          </div>
        </fieldset>
      </div>
    </div>
  )
}

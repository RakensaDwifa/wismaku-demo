import { useEffect, useMemo, useRef, useState } from 'react'
import DateRangePicker from './DateRangePicker.jsx'
import { toYMD } from '../utils/format.js'
import { buildSuggestions, highlightParts } from '../utils/suggestions.js'
import { getRecentSearches, addRecentSearch } from '../services/history.js'

const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

const Highlight = ({ text, query }) => {
  const parts = highlightParts(text, query)
  if (!parts) return text
  return parts.map((p, i) =>
    p.match ? (
      <b className="text-rd" key={i}>
        {p.text}
      </b>
    ) : (
      <span key={i}>{p.text}</span>
    ),
  )
}

export default function SearchWidget({ cities, hotels = [], onSearch, initial = {} }) {
  const [destination, setDestination] = useState(initial.destination || '')
  const [checkIn, setCheckIn] = useState(initial.checkIn || new Date())
  const [checkOut, setCheckOut] = useState(initial.checkOut || addDays(new Date(), 1))
  const [guestOpen, setGuestOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState(getRecentSearches)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [rooms, setRooms] = useState(initial.rooms || 1)
  const [adults, setAdults] = useState(initial.adults || 2)
  const [children, setChildren] = useState(initial.children || 0)
  const guestRef = useRef(null)
  const cityRef = useRef(null)
  const inputRef = useRef(null)

  const rows = useMemo(() => {
    const recents = destination
      ? []
      : recentSearches.map((q) => ({ type: 'recent', key: `recent-${q}`, name: q }))
    return [...recents, ...buildSuggestions(cities, hotels, destination)]
  }, [cities, hotels, destination, recentSearches])

  const recents = rows.filter((r) => r.type === 'recent')
  const results = rows.filter((r) => r.type !== 'recent')
  const citiesRow = results.filter((r) => r.type === 'city')
  const hotelsRow = results.filter((r) => r.type === 'hotel')

  useEffect(() => {
    const close = (e) => {
      if (guestRef.current && !guestRef.current.contains(e.target)) setGuestOpen(false)
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (!cityOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setCityOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cityOpen])

  const record = (q) => setRecentSearches(addRecentSearch(q))

  const selectRow = (row) => {
    setDestination(row.name)
    setCityOpen(false)
    setActiveIndex(-1)
    record(row.name)
  }

  const handleRange = (from, to) => {
    setCheckIn(from)
    setCheckOut(to)
  }

  const apply = () => {
    record(destination)
    onSearch({ destination, checkIn: toYMD(checkIn), checkOut: toYMD(checkOut), rooms, adults, children })
  }

  const onKeyDown = (e) => {
    if (rows.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (rows.length === 0 ? -1 : (i + 1) % rows.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? rows.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault()
        selectRow(rows[activeIndex])
      }
    }
  }

  const openCity = () => {
    setCityOpen((v) => !v)
    setActiveIndex(-1)
  }

  const step = (setter, value, max) => () => {
    if (value + 1 <= max) setter(value + 1)
  }
  const down = (setter, value, min) => () => {
    if (value - 1 >= min) setter(value - 1)
  }

  const itemId = (row) => `sw-opt-${row.key.replace(/[^a-zA-Z0-9]/g, '-')}`

  const renderRow = (row, index) => {
    const isActive = index === activeIndex
    return (
      <li key={row.key} role="option" aria-selected={isActive} id={itemId(row)}>
        <button type="button" onClick={() => selectRow(row)}>
          {row.type === 'recent' ? (
            <span className="mr-2 inline-block w-[18px] text-xs text-rd-muted" aria-hidden="true">
              &uarr;
            </span>
          ) : row.type === 'city' ? (
            <span className="mr-2 inline-block w-[18px] text-xs text-rd-teal" aria-hidden="true">
              &#9873;
            </span>
          ) : (
            <span className="mr-2 inline-block w-[18px] text-xs text-rd-teal" aria-hidden="true">
              &#127968;
            </span>
          )}
          <Highlight text={row.name} query={destination} />
          {row.type === 'hotel' && row.area && (
            <span className="mt-0.5 block text-xs font-medium text-rd-muted">
              {row.area} &middot; {row.city}
            </span>
          )}
        </button>
      </li>
    )
  }

  return (
    <div
      className="grid max-[640px]:grid-cols-1 grid-cols-[1.5fr_2fr_1.2fr_auto] items-stretch overflow-visible rounded-[14px] border-2 border-rd bg-white shadow-rd-lg"
      id="search-widget"
    >
      <div className="relative flex flex-col justify-center border-r border-r-[#eee] px-4 py-3" ref={cityRef}>
        <label className="sw-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          Tujuan
        </label>
        <button
          className="sw-value"
          type="button"
          onClick={openCity}
          aria-expanded={cityOpen}
          aria-controls="sw-suggest-box"
          aria-haspopup="listbox"
        >
          {destination || 'Mau ke mana?'}
        </button>
        {cityOpen && (
          <div className="absolute top-[calc(100%+10px)] left-0 z-[60] min-w-[280px] overflow-hidden rounded-xl border border-[#eee] bg-white shadow-rd-lg">
            <input
              ref={inputRef}
              className="w-full border-b border-[#eee] px-4 py-3 text-sm text-rd-text"
              placeholder="Cari kota, area, atau penginapan..."
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value)
                setActiveIndex(-1)
              }}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded={cityOpen}
              aria-controls="sw-suggest-box"
              aria-activedescendant={activeIndex >= 0 ? itemId(rows[activeIndex]) : undefined}
              autoFocus
            />
            <div id="sw-suggest-box" role="listbox" aria-label="Saran destinasi">
              {rows.length === 0 ? (
                <p className="px-4 py-3 text-sm text-rd-muted">
                  Tidak ada hasil untuk &quot;{destination}&quot;
                </p>
              ) : (
                <>
                  {destination === '' && recents.length > 0 && (
                    <>
                      <p className="px-4 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-[0.4px] text-rd-muted">
                        Pencarian Terakhir
                      </p>
                      <ul className="max-h-[280px] list-none overflow-y-auto">
                        {recents.map((r, i) => renderRow(r, i))}
                      </ul>
                    </>
                  )}
                  {citiesRow.length > 0 && (
                    <>
                      <p className="px-4 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-[0.4px] text-rd-muted">
                        Kota
                      </p>
                      <ul className="max-h-[280px] list-none overflow-y-auto">
                        {citiesRow.map((r, i) => renderRow(r, recents.length + i))}
                      </ul>
                    </>
                  )}
                  {hotelsRow.length > 0 && (
                    <>
                      <p className="px-4 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-[0.4px] text-rd-muted">
                        Penginapan &amp; Area
                      </p>
                      <ul className="max-h-[280px] list-none overflow-y-auto">
                        {hotelsRow.map((r, i) => renderRow(r, recents.length + citiesRow.length + i))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <DateRangePicker checkIn={checkIn} checkOut={checkOut} onSelect={handleRange} />

      <div className="relative flex flex-col justify-center px-4 py-3" ref={guestRef}>
        <label className="sw-label">Tamu &amp; Kamar</label>
        <button
          className="sw-value"
          type="button"
          onClick={() => setGuestOpen((v) => !v)}
          aria-expanded={guestOpen}
          aria-controls="sw-guest-box"
          aria-haspopup="group"
        >
          {rooms} kamar &middot; {adults + children} tamu
        </button>
        {guestOpen && (
          <div
            className="absolute top-[calc(100%+10px)] left-0 z-[60] min-w-[260px] rounded-xl border border-[#eee] bg-white p-4 shadow-rd-lg"
            id="sw-guest-box"
            role="group"
            aria-label="Jumlah tamu dan kamar"
          >
            {[
              { label: 'Kamar', val: rooms, min: 1, max: 9, set: setRooms },
              { label: 'Dewasa', val: adults, min: 1, max: 9, set: setAdults },
              { label: 'Anak-anak', val: children, min: 0, max: 6, set: setChildren },
            ].map((r) => (
              <div
                className="mb-3 flex items-center justify-between gap-5 text-sm font-bold last:mb-0"
                key={r.label}
              >
                <span>{r.label}</span>
                <div className="flex items-center gap-3">
                  <button
                    className="grid size-8 max-[768px]:size-10 place-items-center rounded-full border border-rd-border text-base leading-none text-rd-text transition-all hover:border-rd hover:text-rd"
                    type="button"
                    onClick={down(r.set, r.val, r.min)}
                    aria-label={`Kurangi ${r.label}`}
                  >
                    &minus;
                  </button>
                  <b className="min-w-4 text-center">{r.val}</b>
                  <button
                    className="grid size-8 max-[768px]:size-10 place-items-center rounded-full border border-rd-border text-base leading-none text-rd-text transition-all hover:border-rd hover:text-rd"
                    type="button"
                    onClick={step(r.set, r.val, r.min, r.max)}
                    aria-label={`Tambah ${r.label}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="rounded-e-xl bg-[linear-gradient(95deg,#10b981,#0d9488)] px-[30px] text-base font-extrabold whitespace-nowrap text-white transition-[filter] hover:brightness-[1.08] max-[640px]:mx-3 max-[640px]:mb-3 max-[640px]:rounded-lg"
        type="button"
        onClick={apply}
      >
        Cari Hotel
      </button>
    </div>
  )
}

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
  return parts.map((p, i) => (p.match ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>))
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
      <li
        key={row.key}
        role="option"
        aria-selected={isActive}
        id={itemId(row)}
        className={isActive ? 'is-active' : ''}
      >
        <button type="button" onClick={() => selectRow(row)}>
          {row.type === 'recent' ? (
            <span className="sw-opt-type sw-opt-type--recent" aria-hidden="true">
              &uarr;
            </span>
          ) : row.type === 'city' ? (
            <span className="sw-opt-type" aria-hidden="true">
              &#9873;
            </span>
          ) : (
            <span className="sw-opt-type" aria-hidden="true">
              &#127968;
            </span>
          )}
          <Highlight text={row.name} query={destination} />
          {row.type === 'hotel' && row.area && (
            <span className="sw-opt-sub">
              {row.area} &middot; {row.city}
            </span>
          )}
        </button>
      </li>
    )
  }

  return (
    <div className="search-widget" id="search-widget">
      <div className="sw-field sw-city" ref={cityRef}>
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
          <div className="sw-dropdown">
            <input
              ref={inputRef}
              className="sw-search"
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
            <div className="sw-suggest" id="sw-suggest-box" role="listbox" aria-label="Saran destinasi">
              {rows.length === 0 ? (
                <p className="sw-suggest-empty">Tidak ada hasil untuk &quot;{destination}&quot;</p>
              ) : (
                <>
                  {destination === '' && recents.length > 0 && (
                    <>
                      <p className="sw-suggest-label">Pencarian Terakhir</p>
                      <ul className="sw-city-list">{recents.map((r, i) => renderRow(r, i))}</ul>
                    </>
                  )}
                  {citiesRow.length > 0 && (
                    <>
                      <p className="sw-suggest-label">Kota</p>
                      <ul className="sw-city-list">
                        {citiesRow.map((r, i) => renderRow(r, recents.length + i))}
                      </ul>
                    </>
                  )}
                  {hotelsRow.length > 0 && (
                    <>
                      <p className="sw-suggest-label">Penginapan &amp; Area</p>
                      <ul className="sw-city-list">
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

      <div className="sw-field sw-guests" ref={guestRef}>
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
            className="sw-dropdown sw-guest-box"
            id="sw-guest-box"
            role="group"
            aria-label="Jumlah tamu dan kamar"
          >
            {[
              { label: 'Kamar', val: rooms, min: 1, max: 9, set: setRooms },
              { label: 'Dewasa', val: adults, min: 1, max: 9, set: setAdults },
              { label: 'Anak-anak', val: children, min: 0, max: 6, set: setChildren },
            ].map((r) => (
              <div className="sw-guest-row" key={r.label}>
                <span>{r.label}</span>
                <div className="stepper">
                  <button type="button" onClick={down(r.set, r.val, r.min)} aria-label={`Kurangi ${r.label}`}>
                    &minus;
                  </button>
                  <b>{r.val}</b>
                  <button
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

      <button className="btn-search" type="button" onClick={apply}>
        Cari Hotel
      </button>
    </div>
  )
}

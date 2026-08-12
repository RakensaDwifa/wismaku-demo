import { useEffect, useRef, useState } from 'react'
import DateRangePicker from './DateRangePicker.jsx'
import { toYMD } from '../utils/format.js'

const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export default function SearchWidget({ cities, onSearch, initial = {} }) {
  const [destination, setDestination] = useState(initial.destination || '')
  const [checkIn, setCheckIn] = useState(initial.checkIn || new Date())
  const [checkOut, setCheckOut] = useState(initial.checkOut || addDays(new Date(), 1))
  const [guestOpen, setGuestOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [rooms, setRooms] = useState(initial.rooms || 1)
  const [adults, setAdults] = useState(initial.adults || 2)
  const [children, setChildren] = useState(initial.children || 0)
  const guestRef = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (guestRef.current && !guestRef.current.contains(e.target)) setGuestOpen(false)
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

  const handleRange = (from, to) => {
    setCheckIn(from)
    setCheckOut(to)
  }

  const apply = () => {
    onSearch({ destination, checkIn: toYMD(checkIn), checkOut: toYMD(checkOut), rooms, adults, children })
  }

  const pickCity = (name) => {
    setDestination(name)
    setCityOpen(false)
  }

  const step = (setter, value, min, max) => () => {
    if (value + 1 <= max) setter(value + 1)
  }
  const down = (setter, value, min) => () => {
    if (value - 1 >= min) setter(value - 1)
  }

  return (
    <div className="search-widget" id="search-widget">
      <div className="sw-field sw-city">
        <label className="sw-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          Tujuan
        </label>
        <button
          className="sw-value"
          type="button"
          onClick={() => setCityOpen((v) => !v)}
          aria-expanded={cityOpen}
          aria-controls="sw-city-list"
          aria-haspopup="listbox"
        >
          {destination || 'Mau ke mana?'}
        </button>
        {cityOpen && (
          <div className="sw-dropdown">
            <input
              className="sw-search"
              placeholder="Cari kota atau destinasi..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              autoFocus
            />
            <ul className="sw-city-list" id="sw-city-list" role="listbox" aria-label="Daftar kota">
              {cities
                .filter((c) => c.name.toLowerCase().includes(destination.toLowerCase()))
                .map((c) => (
                  <li key={c.name} role="option" aria-selected={destination === c.name}>
                    <button type="button" onClick={() => pickCity(c.name)}>
                      {c.name}
                    </button>
                  </li>
                ))}
            </ul>
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

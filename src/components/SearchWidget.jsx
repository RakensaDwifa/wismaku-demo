import { useEffect, useRef, useState } from 'react'
import DateRangePicker from './DateRangePicker.jsx'

const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export default function SearchWidget({ cities, onSearch }) {
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn] = useState(new Date())
  const [checkOut, setCheckOut] = useState(addDays(new Date(), 1))
  const [guestOpen, setGuestOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [rooms, setRooms] = useState(1)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const guestRef = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (guestRef.current && !guestRef.current.contains(e.target)) setGuestOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

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
        <button className="sw-value" type="button" onClick={() => setCityOpen((v) => !v)}>
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
            <ul className="sw-city-list">
              {cities.filter((c) => c.name.toLowerCase().includes(destination.toLowerCase())).map((c) => (
                <li key={c.name}>
                  <button type="button" onClick={() => pickCity(c.name)}>{c.name}</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <DateRangePicker checkIn={checkIn} checkOut={checkOut} onSelect={handleRange} />

      <div className="sw-field sw-guests" ref={guestRef}>
        <label className="sw-label">Tamu &amp; Kamar</label>
        <button className="sw-value" type="button" onClick={() => setGuestOpen((v) => !v)}>
          {rooms} kamar &middot; {adults + children} tamu
        </button>
        {guestOpen && (
          <div className="sw-dropdown sw-guest-box">
            {[
              { label: 'Kamar', val: rooms, min: 1, max: 9, set: setRooms },
              { label: 'Dewasa', val: adults, min: 1, max: 9, set: setAdults },
              { label: 'Anak-anak', val: children, min: 0, max: 6, set: setChildren },
            ].map((r) => (
              <div className="sw-guest-row" key={r.label}>
                <span>{r.label}</span>
                <div className="stepper">
                  <button type="button" onClick={down(r.set, r.val, r.min)} aria-label={`Kurangi ${r.label}`}>&minus;</button>
                  <b>{r.val}</b>
                  <button type="button" onClick={step(r.set, r.val, r.min, r.max)} aria-label={`Tambah ${r.label}`}>+</button>
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
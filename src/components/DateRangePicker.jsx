import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { id } from 'date-fns/locale'
import 'react-day-picker/style.css'

const fmtDate = (d) =>
  d
    ? new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(d)
    : 'Pilih tanggal'

export default function DateRangePicker({ checkIn, checkOut, onSelect }) {
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setMobile(mq.matches)
    const onChange = (e) => setMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const today = new Date()
  const nights =
    checkIn && checkOut ? Math.round((checkOut - checkIn) / 86400000) : 0

  const handleSelect = (range) => {
    if (range && range.from && range.to) onSelect(range.from, range.to)
  }

  return (
    <div className="sw-dates" ref={wrapRef}>
      <div className="sw-field sw-field-date">
        <label className="sw-label">Check-in</label>
        <button className="sw-value" type="button" onClick={() => setOpen((v) => !v)}>
          {fmtDate(checkIn)}
        </button>
      </div>
      <div className="sw-field sw-field-date">
        <label className="sw-label">Check-out</label>
        <button className="sw-value" type="button" onClick={() => setOpen((v) => !v)}>
          {fmtDate(checkOut)}
        </button>
      </div>
      {open && (
        <div className="date-popup">
          <DayPicker
            mode="range"
            min={1}
            numberOfMonths={mobile ? 1 : 2}
            locale={id}
            today={today}
            selected={{ from: checkIn, to: checkOut }}
            onSelect={handleSelect}
            disabled={{ before: today }}
            showOutsideDays
            footer={
              <div className="date-popup-footer">
                {nights > 0 ? (
                  <b>{nights} malam</b>
                ) : (
                  <span>Pilih tanggal check-in dan check-out</span>
                )}
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}
import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import 'react-day-picker/style.css'

const fmtDate = (d) =>
  d
    ? new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(d)
    : 'Pilih tanggal'

export default function DateRangePicker({ checkIn, checkOut, onSelect }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('checkin')
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
  const range = checkIn && checkOut && checkOut > checkIn ? { from: checkIn, to: checkOut } : undefined

  const openFor = (field) => {
    setActive(field)
    setOpen((v) => (active === field ? !v : true))
  }

  const pickCheckIn = (d) => {
    if (!d) return
    const nextOut = !checkOut || d >= checkOut ? addDays(d, 1) : checkOut
    onSelect(d, nextOut)
  }

  const pickCheckOut = (d) => {
    if (!d) return
    let from = checkIn
    let to = d
    if (d <= checkIn) {
      from = d
      to = addDays(d, 1)
    }
    onSelect(from, to)
    setOpen(false)
  }

  return (
    <div className="sw-dates" ref={wrapRef}>
      <div className={`sw-field sw-field-date${active === 'checkin' ? ' is-active' : ''}`}>
        <label className="sw-label">Check-in</label>
        <button className="sw-value" type="button" onClick={() => openFor('checkin')}>
          {fmtDate(checkIn)}
        </button>
      </div>
      <div className={`sw-field sw-field-date${active === 'checkout' ? ' is-active' : ''}`}>
        <label className="sw-label">Check-out</label>
        <button className="sw-value" type="button" onClick={() => openFor('checkout')}>
          {fmtDate(checkOut)}
        </button>
      </div>
      {open && (
        <div className="date-popup">
          <DayPicker
            mode="single"
            numberOfMonths={mobile ? 1 : 2}
            locale={id}
            today={today}
            selected={active === 'checkin' ? checkIn : checkOut}
            onSelect={(d) => (active === 'checkin' ? pickCheckIn(d) : pickCheckOut(d))}
            disabled={{ before: active === 'checkin' ? today : checkIn }}
            modifiers={
              range && {
                rangeStart: checkIn,
                rangeEnd: checkOut,
                rangeMiddle: { after: checkIn, before: checkOut },
              }
            }
            modifiersClassNames={{
              rangeStart: 'rdp-day_range_start',
              rangeEnd: 'rdp-day_range_end',
              rangeMiddle: 'rdp-day_range_middle',
            }}
            showOutsideDays
            footer={
              <div className="date-popup-footer">
                {nights > 0 ? (
                  <b>{nights} malam</b>
                ) : (
                  <span>
                    {active === 'checkin' ? 'Pilih tanggal check-in' : 'Pilih tanggal check-out'}
                  </span>
                )}
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}
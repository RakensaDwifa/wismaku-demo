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
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches)
  const wrapRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
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
  const nights = checkIn && checkOut ? Math.round((checkOut - checkIn) / 86400000) : 0
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
    <div
      className="relative grid grid-cols-2 items-stretch max-[992px]:col-span-2 max-[992px]:border-b max-[992px]:border-b-[#eee]"
      ref={wrapRef}
    >
      <div className="relative flex flex-col justify-center border-r border-r-[#eee] px-4 py-[14px] last:border-r-0">
        <label className="mb-[5px] inline-flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.4px] uppercase text-rd-muted">
          Check-in
        </label>
        <button
          className={`w-full cursor-pointer text-left text-[15px] font-bold whitespace-nowrap text-rd-text transition-colors duration-150 hover:text-rd${active === 'checkin' ? ' text-rd' : ''}`}
          type="button"
          onClick={() => openFor('checkin')}
        >
          {fmtDate(checkIn)}
        </button>
      </div>
      <div className="relative flex flex-col justify-center border-r border-r-[#eee] px-4 py-[14px] last:border-r-0">
        <label className="mb-[5px] inline-flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.4px] uppercase text-rd-muted">
          Check-out
        </label>
        <button
          className={`w-full cursor-pointer text-left text-[15px] font-bold whitespace-nowrap text-rd-text transition-colors duration-150 hover:text-rd${active === 'checkout' ? ' text-rd' : ''}`}
          type="button"
          onClick={() => openFor('checkout')}
        >
          {fmtDate(checkOut)}
        </button>
      </div>
      {open && (
        <div className="absolute top-[calc(100%+10px)] left-1/2 z-[80] -translate-x-1/2 rounded-[14px] border border-[#eee] bg-white px-[14px] pt-4 pb-[10px] shadow-rd-lg max-[640px]:right-0 max-[640px]:left-0 max-[640px]:translate-x-0">
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
              <div className="mt-2 border-t border-[#f0f0f0] pt-2.5 pb-1 text-center text-[13px] text-rd-muted">
                {nights > 0 ? (
                  <b className="text-[14px] text-rd">{nights} malam</b>
                ) : (
                  <span>{active === 'checkin' ? 'Pilih tanggal check-in' : 'Pilih tanggal check-out'}</span>
                )}
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}

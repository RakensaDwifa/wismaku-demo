import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthModal from './AuthModal.jsx'
import DateRangePicker from './DateRangePicker.jsx'
import { getMember, getActiveUser } from '../services/member.js'
import { fmtRupiah, fmtDate, parseYMD, toYMD, resolveStayDates } from '../utils/format.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function BookingBox({ hotel, search, rooms = 1, adults = 2, children = 0 }) {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [roomTypeId, setRoomTypeId] = useState(hotel.roomTypes?.[0]?.id ?? 'standard')
  const [dateRange, setDateRange] = useState(() =>
    resolveStayDates({ checkIn: search?.checkIn, checkOut: search?.checkOut }),
  )
  const [isMember, setIsMember] = useState(false)
  const [user, setUser] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)

  const nights = dateRange.nights
  const roomType = hotel.roomTypes?.find((t) => t.id === roomTypeId) ??
    hotel.roomTypes?.[0] ?? { id: 'standard', name: 'Standar', price: hotel.price }

  const subtotal = roomType.price * nights * rooms
  const cancelDays = hotel.policy?.cancelRule.match(/(\d+) hari/)?.[1] ?? '1'

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const [m, u] = await Promise.all([getMember(), getActiveUser()])
        if (live) {
          setIsMember(Boolean(m))
          setUser(u)
        }
      } catch {
        if (live) {
          setIsMember(false)
          setUser(null)
        }
      }
    }
    sync()
    window.addEventListener('wismaku:session-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:session-changed', sync)
    }
  }, [])

  const goBooking = () => {
    const params = new URLSearchParams({
      roomTypeId: roomType.id,
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
      checkIn: dateRange.checkIn,
      checkOut: dateRange.checkOut,
    })
    navigate(`/pesan/${hotel.id}?${params.toString()}`)
  }

  return (
    <aside className="h-fit rounded-2xl border border-rd-border bg-white p-4 shadow-rd min-[993px]:sticky min-[993px]:top-[90px]">
      <p className="text-[12px] font-extrabold tracking-[0.4px] uppercase text-rd-muted">
        {t('bookingBox.priceFrom')}
      </p>
      <p className="mt-0.5 text-[22px] font-extrabold text-rd">
        {fmtRupiah(roomType.price)}{' '}
        <small className="text-[13px] font-semibold text-rd-muted">{t('hotelCard.perNight')}</small>
      </p>

      {hotel.roomTypes?.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[12.5px] font-extrabold text-rd-text">{t('bookingBox.selectRoom')}</p>
          <div className="flex flex-col gap-2">
            {hotel.roomTypes.map((rt) => (
              <button
                key={rt.id}
                type="button"
                className={`flex cursor-pointer flex-col gap-0.5 rounded-[10px] border-[1.5px] border-rd-border bg-white p-2.5 text-left transition-[border-color,background] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd hover:border-rd-teal aria-pressed:border-rd-teal aria-pressed:bg-[rgba(20,184,166,0.07)]`}
                onClick={() => setRoomTypeId(rt.id)}
                aria-pressed={rt.id === roomTypeId}
              >
                <span className="flex items-center justify-between gap-2">
                  <b className="text-[13.5px] text-rd-text">{t(`data.roomTypes.${rt.id}`)}</b>
                  <span className="font-extrabold text-rd">
                    {fmtRupiah(rt.price)}{' '}
                    <small className="font-semibold text-rd-muted">{t('hotelCard.perNight')}</small>
                  </span>
                </span>
                <span className="text-[12px] text-rd-muted">
                  {t('bookingBox.upToGuests', { n: rt.capacity })}
                  {rt.originalPrice ? <s className="ml-1">{fmtRupiah(rt.originalPrice)}</s> : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-[10px] border border-rd-border bg-white">
        <DateRangePicker
          checkIn={parseYMD(dateRange.checkIn)}
          checkOut={parseYMD(dateRange.checkOut)}
          onSelect={(from, to) =>
            setDateRange(resolveStayDates({ checkIn: toYMD(from), checkOut: toYMD(to) }))
          }
          className="border-b border-b-[#eee]"
        />
        <div className="rounded-b-[10px] bg-rd-soft px-[14px] py-2.5 text-[13px] text-rd-text">
          <p>
            {fmtDate(dateRange.checkIn, lang)} &rarr; {fmtDate(dateRange.checkOut, lang)}{' '}
            {t('bookingBox.nightsShort', { nights })}
          </p>
          <p className="mt-1">{t('bookingBox.roomsGuests', { rooms, guests: adults + children })}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[14px] text-rd-text">
        <span>{t('bookingBox.subtotalCalc', { price: fmtRupiah(roomType.price), nights, rooms })}</span>
        <b>{fmtRupiah(subtotal)}</b>
      </div>

      {isMember ? (
        <p className="mt-2 rounded-[8px] bg-[rgba(20,184,166,0.1)] px-3 py-2 text-[12.5px] font-bold text-rd-teal">
          {t('bookingBox.memberDiscount')}
        </p>
      ) : !user ? (
        <button
          className="mt-2 w-full rounded-[8px] border border-dashed border-rd-teal bg-[rgba(20,184,166,0.08)] px-3 py-2 text-[12.5px] font-bold text-rd-teal transition-colors hover:bg-[rgba(20,184,166,0.16)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd"
          type="button"
          onClick={() => setAuthOpen(true)}
        >
          {t('bookingBox.memberCta')}
        </button>
      ) : null}

      <button className="btn btn-primary mt-4 w-full" type="button" onClick={goBooking}>
        {t('promo.bookNow')}
      </button>
      {hotel.policy && (
        <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-rd-muted">
          {t(`data.cancelRules.${cancelDays}`)}
        </p>
      )}
      {authOpen && <AuthModal initialTab="login" onClose={() => setAuthOpen(false)} />}
    </aside>
  )
}

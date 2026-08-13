import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMember } from '../services/member.js'
import { fmtRupiah, fmtDate } from '../utils/format.js'
import { useLanguage } from '../i18n/useLanguage.js'

export default function BookingBox({ hotel, search, rooms = 1, adults = 2, children = 0 }) {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [roomTypeId, setRoomTypeId] = useState(hotel.roomTypes?.[0]?.id ?? 'standard')
  const [isMember, setIsMember] = useState(false)

  const nights = search?.nights ?? 0
  const hasDates = Boolean(search?.checkIn && search?.checkOut)
  const roomType = hotel.roomTypes?.find((t) => t.id === roomTypeId) ??
    hotel.roomTypes?.[0] ?? { id: 'standard', name: 'Standar', price: hotel.price }

  const subtotal = roomType.price * (nights || 1) * rooms
  const cancelDays = hotel.policy?.cancelRule.match(/(\d+) hari/)?.[1] ?? '1'

  useEffect(() => {
    let live = true
    const sync = async () => {
      try {
        const m = await getMember()
        if (live) setIsMember(Boolean(m))
      } catch {
        if (live) setIsMember(false)
      }
    }
    sync()
    window.addEventListener('wismaku:members-changed', sync)
    return () => {
      live = false
      window.removeEventListener('wismaku:members-changed', sync)
    }
  }, [])

  const goBooking = () => {
    const params = new URLSearchParams({
      roomTypeId: roomType.id,
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
    })
    if (hasDates) {
      params.set('checkIn', search.checkIn)
      params.set('checkOut', search.checkOut)
    }
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

      <div className="mt-4 rounded-[10px] border border-rd-border bg-rd-soft px-[14px] py-3 text-[13px] text-rd-text">
        {hasDates ? (
          <p>
            {fmtDate(search.checkIn, lang)} &rarr; {fmtDate(search.checkOut, lang)}{' '}
            {t('bookingBox.nightsShort', { nights })}
          </p>
        ) : (
          <p className="text-rd-muted">{t('bookingBox.noDates')}</p>
        )}
        <p className="mt-1">{t('bookingBox.roomsGuests', { rooms, guests: adults + children })}</p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[14px] text-rd-text">
        <span>
          {t('bookingBox.subtotalCalc', { price: fmtRupiah(roomType.price), nights: nights || 1, rooms })}
        </span>
        <b>{fmtRupiah(subtotal)}</b>
      </div>

      {isMember && (
        <p className="mt-2 rounded-[8px] bg-[rgba(20,184,166,0.1)] px-3 py-2 text-[12.5px] font-bold text-rd-teal">
          {t('bookingBox.memberDiscount')}
        </p>
      )}

      <button className="btn btn-primary mt-4 w-full" type="button" onClick={goBooking}>
        {t('promo.bookNow')}
      </button>
      {hotel.policy && (
        <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-rd-muted">
          {t(`data.cancelRules.${cancelDays}`)}
        </p>
      )}
    </aside>
  )
}

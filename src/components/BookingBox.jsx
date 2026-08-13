import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMember } from '../services/member.js'
import { fmtRupiah, fmtDate } from '../utils/format.js'

export default function BookingBox({ hotel, search, rooms = 1, adults = 2, children = 0 }) {
  const navigate = useNavigate()
  const [roomTypeId, setRoomTypeId] = useState(hotel.roomTypes?.[0]?.id ?? 'standard')
  const [isMember, setIsMember] = useState(false)

  const nights = search?.nights ?? 0
  const hasDates = Boolean(search?.checkIn && search?.checkOut)
  const roomType = hotel.roomTypes?.find((t) => t.id === roomTypeId) ??
    hotel.roomTypes?.[0] ?? { id: 'standard', name: 'Standar', price: hotel.price }

  const subtotal = roomType.price * (nights || 1) * rooms

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
      <p className="text-[12px] font-extrabold tracking-[0.4px] uppercase text-rd-muted">Harga mulai dari</p>
      <p className="mt-0.5 text-[22px] font-extrabold text-rd">
        {fmtRupiah(roomType.price)} <small className="text-[13px] font-semibold text-rd-muted">/ malam</small>
      </p>

      {hotel.roomTypes?.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[12.5px] font-extrabold text-rd-text">Pilih Tipe Kamar</p>
          <div className="flex flex-col gap-2">
            {hotel.roomTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`flex cursor-pointer flex-col gap-0.5 rounded-[10px] border-[1.5px] border-rd-border bg-white p-2.5 text-left transition-[border-color,background] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd hover:border-rd-teal aria-pressed:border-rd-teal aria-pressed:bg-[rgba(20,184,166,0.07)]`}
                onClick={() => setRoomTypeId(t.id)}
                aria-pressed={t.id === roomTypeId}
              >
                <span className="flex items-center justify-between gap-2">
                  <b className="text-[13.5px] text-rd-text">{t.name}</b>
                  <span className="font-extrabold text-rd">
                    {fmtRupiah(t.price)} <small className="font-semibold text-rd-muted">/ malam</small>
                  </span>
                </span>
                <span className="text-[12px] text-rd-muted">
                  hingga {t.capacity} tamu{' '}
                  {t.originalPrice ? <s className="ml-1">{fmtRupiah(t.originalPrice)}</s> : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-[10px] border border-rd-border bg-rd-soft px-[14px] py-3 text-[13px] text-rd-text">
        {hasDates ? (
          <p>
            {fmtDate(search.checkIn)} &rarr; {fmtDate(search.checkOut)} ({nights} malam)
          </p>
        ) : (
          <p className="text-rd-muted">Belum ada tanggal terpilih &mdash; dihitung 1 malam.</p>
        )}
        <p className="mt-1">
          {rooms} kamar &middot; {adults + children} tamu
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[14px] text-rd-text">
        <span>
          {fmtRupiah(roomType.price)} &times; {nights || 1} malam &times; {rooms} kamar
        </span>
        <b>{fmtRupiah(subtotal)}</b>
      </div>

      {isMember && (
        <p className="mt-2 rounded-[8px] bg-[rgba(20,184,166,0.1)] px-3 py-2 text-[12.5px] font-bold text-rd-teal">
          &#9733; Diskon member 10% otomatis di halaman pemesanan
        </p>
      )}

      <button className="btn btn-primary mt-4 w-full" type="button" onClick={goBooking}>
        Pesan Sekarang
      </button>
      {hotel.policy && (
        <p className="mt-3 text-center text-[11.5px] leading-[1.5] text-rd-muted">
          {hotel.policy.cancelRule}
        </p>
      )}
    </aside>
  )
}

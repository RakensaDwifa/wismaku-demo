import { addDays, differenceInCalendarDays } from 'date-fns'

export const fmtRupiah = (n) => 'Rp ' + n.toLocaleString('id-ID')

export const fmtDate = (iso, lang = 'id') => {
  if (!iso) return '-'
  const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00')
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const parseYMD = (ymd) => {
  const [y, m, d] = (ymd || '').split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export const resolveStayDates = ({ checkIn, checkOut, createdAt, nights = 1 } = {}) => {
  const inDate = parseYMD(checkIn)
  const outDate = parseYMD(checkOut)
  if (inDate && outDate && outDate > inDate) {
    return { checkIn, checkOut, nights: differenceInCalendarDays(outDate, inDate) }
  }
  const created = createdAt ? new Date(createdAt) : null
  const base = created && !Number.isNaN(created.getTime()) ? created : new Date()
  const safeNights = Math.max(1, Number(nights) || 1)
  return {
    checkIn: toYMD(base),
    checkOut: toYMD(addDays(base, safeNights)),
    nights: safeNights,
  }
}

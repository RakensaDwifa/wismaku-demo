import { differenceInCalendarDays } from 'date-fns'
import { parseYMD } from './format.js'

const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function parseSearchParams(params) {
  const checkIn = params.get('checkIn')
  const checkOut = params.get('checkOut')
  const hasDates = Boolean(checkIn && checkOut && new Date(checkOut) > new Date(checkIn))
  return {
    hasDates,
    nights: hasDates ? differenceInCalendarDays(new Date(checkOut), new Date(checkIn)) : 0,
    guests: Number(params.get('adults') || 0) + Number(params.get('children') || 0),
    rooms: Number(params.get('rooms') || 1),
    checkIn: hasDates ? checkIn : null,
    checkOut: hasDates ? checkOut : null,
  }
}

export function parseSearchWidgetInitial(params) {
  return {
    destination: params.get('q') || '',
    checkIn: parseYMD(params.get('checkIn')) || new Date(),
    checkOut: parseYMD(params.get('checkOut')) || addDays(new Date(), 1),
    rooms: Number(params.get('rooms')) || 1,
    adults: Number(params.get('adults')) || 2,
    children: Number(params.get('children')) || 0,
  }
}

export function buildSearchParams({ destination, checkIn, checkOut, rooms, adults, children }) {
  const params = {}
  const q = (destination || '').trim()
  if (q) params.q = q
  if (checkIn) params.checkIn = checkIn
  if (checkOut) params.checkOut = checkOut
  if (rooms) params.rooms = String(rooms)
  if (adults) params.adults = String(adults)
  if (children) params.children = String(children)
  return params
}

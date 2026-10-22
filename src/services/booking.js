import { request, USE_MOCK } from './api.js'
import { BookingPayloadSchema, parsePayload } from '../schemas/contracts.js'
import { toYMD } from '../utils/format.js'
import { hotels } from '../data/hotels.js'

const STORAGE_KEY = 'wismaku_bookings'
const CHANGE_EVENT = 'wismaku:bookings-changed'
const IMG_FALLBACK =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60'

const notify = () => {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

const bookRef = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

const toLocal = (payload) => ({
  id: `WK-${Date.now().toString(36).toUpperCase()}`,
  createdAt: new Date().toISOString(),
  status: 'pending',
  ...payload,
})

const migrateImg = (booking) => {
  if (/^https?:\/\//.test(booking.hotelImg || '')) return booking
  const hotel = hotels.find((h) => String(h.id) === String(booking.hotelId))
  return { ...booking, hotelImg: hotel?.img ?? IMG_FALLBACK }
}

const migrateDates = (booking) => {
  if (booking.checkIn && booking.checkOut) return booking
  const base = booking.createdAt ? new Date(booking.createdAt) : new Date()
  return {
    ...booking,
    checkIn: toYMD(new Date(base.getTime() + 86400000)),
    checkOut: toYMD(new Date(base.getTime() + 2 * 86400000)),
  }
}

/**
 * Terapkan migrasi data booking lama (gambar hotel + tanggal check-in/out).
 *
 * Migrasi dijalankan pada titik TULIS dan satu kali saat modul dimuat -
 * bukan pada setiap pembacaan. Sebelumnya `getBookings()` menulis ulang
 * `localStorage` setiap kali dipanggil (side effect saat read).
 */
const migrateList = (list) => list.map(migrateImg).map(migrateDates)

const persist = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrateList(list)))
}

/**
 * Jalankan migrasi pada data booking yang tersimpan dan tulis hasilnya.
 * Dipanggil satu kali saat modul dimuat serta pada setiap titik tulis.
 */
export const migrateBookings = () => {
  try {
    const list = bookRef()
    if (!list.length) return []
    const migrated = migrateList(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    return migrated
  } catch {
    return []
  }
}

// Migrasi satu kali saat modul dimuat, untuk booking yang dibuat sebelum
// field `hotelImg` / `checkIn` / `checkOut` tersedia.
migrateBookings()

export async function getBookings({ email } = {}) {
  if (USE_MOCK) {
    const list = migrateList(bookRef())
    if (email) {
      const clean = String(email).trim().toLowerCase()
      return list.filter((b) => b.email?.trim().toLowerCase() === clean)
    }
    return list
  }
  return request('/bookings')
}

export async function createBooking(payload) {
  const data = parsePayload(BookingPayloadSchema, payload)
  if (USE_MOCK) {
    const booking = toLocal(data)
    const list = bookRef()
    list.unshift(booking)
    persist(list)
    notify()
    return booking
  }
  const booking = await request('/bookings', { method: 'POST', body: data })
  notify()
  return booking
}

export async function cancelBooking(id) {
  if (USE_MOCK) {
    const list = bookRef().map((b) =>
      b.id === id ? { ...b, status: 'cancelled', cancelledAt: new Date().toISOString() } : b,
    )
    persist(list)
    notify()
    return list
  }
  await request(`/bookings/${id}`, { method: 'DELETE' })
  notify()
}

export async function payBooking(id, method) {
  if (USE_MOCK) {
    const list = bookRef().map((b) =>
      b.id === id
        ? { ...b, status: 'confirmed', paymentMethod: method, paidAt: new Date().toISOString() }
        : b,
    )
    persist(list)
    notify()
    return list.find((b) => b.id === id)
  }
  const booking = await request(`/bookings/${id}/pay`, { method: 'POST', body: { method } })
  notify()
  return booking
}

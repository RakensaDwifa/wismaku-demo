import { request, USE_MOCK } from './api.js'
import { BookingPayloadSchema, parsePayload } from '../schemas/contracts.js'

const STORAGE_KEY = 'wismaku_bookings'
const CHANGE_EVENT = 'wismaku:bookings-changed'

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

export async function getBookings() {
  if (USE_MOCK) return bookRef()
  return request('/bookings')
}

export async function createBooking(payload) {
  const data = parsePayload(BookingPayloadSchema, payload)
  if (USE_MOCK) {
    const booking = toLocal(data)
    const list = bookRef()
    list.unshift(booking)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    notify()
    return list.find((b) => b.id === id)
  }
  const booking = await request(`/bookings/${id}/pay`, { method: 'POST', body: { method } })
  notify()
  return booking
}

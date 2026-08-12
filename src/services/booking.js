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

export function getBookings() {
  return bookRef()
}

export function createBooking(payload) {
  const booking = {
    id: `WK-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    ...payload,
  }
  const list = bookRef()
  list.unshift(booking)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  notify()
  return booking
}

export function cancelBooking(id) {
  const list = bookRef().filter((b) => b.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  notify()
  return list
}
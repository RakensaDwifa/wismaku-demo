import { request, USE_MOCK } from './api.js'
import { ReviewPayloadSchema, parsePayload } from '../schemas/contracts.js'

const STORAGE_KEY = 'wismaku_reviews'
const CHANGE_EVENT = 'wismaku:reviews-changed'

const notify = () => {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

const toLocal = (payload) => ({
  id: `RV-${Date.now().toString(36).toUpperCase()}`,
  ...payload,
  date: new Date().toISOString().slice(0, 10),
  createdAt: new Date().toISOString(),
})

export async function getReviews(hotelId) {
  if (USE_MOCK) return read().filter((r) => String(r.hotelId) === String(hotelId))
  return request(`/hotels/${hotelId}/reviews`)
}

export async function addReview(payload) {
  const data = parsePayload(ReviewPayloadSchema, payload)
  if (USE_MOCK) {
    const list = read()
    if (list.some((r) => String(r.hotelId) === String(data.hotelId))) {
      throw new Error('Anda sudah mengulas penginapan ini.')
    }
    const review = toLocal(data)
    list.unshift(review)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    notify()
    return review
  }
  const review = await request(`/hotels/${data.hotelId}/reviews`, { method: 'POST', body: data })
  notify()
  return review
}

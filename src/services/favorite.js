import { request, USE_MOCK } from './api.js'

const FAV_KEY = 'wismaku_favorites'
const CHANGE_EVENT = 'wismaku:favorites-changed'

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || []
  } catch {
    return []
  }
}

const notify = () => {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export async function getFavorites() {
  if (USE_MOCK) return read()
  return request('/favorites')
}

export async function isFavorite(id) {
  if (USE_MOCK) return read().includes(String(id))
  return request(`/favorites/${id}`).catch(() => false)
}

export async function toggleFavorite(id) {
  const key = String(id)
  if (USE_MOCK) {
    const list = read()
    const next = list.includes(key) ? list.filter((x) => x !== key) : [...list, key]
    localStorage.setItem(FAV_KEY, JSON.stringify(next))
    notify()
    return { id: key, active: next.includes(key) }
  }
  const current = await isFavorite(id)
  if (current) {
    await request(`/favorites/${key}`, { method: 'DELETE' })
  } else {
    await request('/favorites', { method: 'POST', body: { hotelId: key } })
  }
  notify()
  return { id: key, active: !current }
}

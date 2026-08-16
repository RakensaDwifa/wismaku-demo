import { request, USE_MOCK } from './api.js'

const FAV_KEY = 'wismaku_favorites'
const CHANGE_EVENT = 'wismaku:favorites-changed'

const keyFor = (user) =>
  user?.email ? `wismaku_favorites:${String(user.email).trim().toLowerCase()}` : FAV_KEY

const read = (key = FAV_KEY) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

const notify = () => {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export async function getFavorites(user) {
  if (USE_MOCK) return read(keyFor(user))
  return request('/favorites')
}

export async function isFavorite(id, user) {
  if (USE_MOCK) return read(keyFor(user)).includes(String(id))
  return request(`/favorites/${id}`).catch(() => false)
}

export async function toggleFavorite(id, user) {
  const key = String(id)
  if (USE_MOCK) {
    const scoped = keyFor(user)
    const list = read(scoped)
    const next = list.includes(key) ? list.filter((x) => x !== key) : [...list, key]
    localStorage.setItem(scoped, JSON.stringify(next))
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

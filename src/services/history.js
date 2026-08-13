const RECENT_KEY = 'wismaku_recent_searches'
const MAX_ITEMS = 5
const VIEW_KEY = 'wismaku_recent_views'
const MAX_VIEWS = 6

const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY))
    return Array.isArray(list) ? list.filter((q) => typeof q === 'string') : []
  } catch {
    return []
  }
}

export function getRecentSearches() {
  return read()
}

export function addRecentSearch(query) {
  const q = (query || '').trim()
  if (!q) return read()
  const next = [q, ...read().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_ITEMS)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

export function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY)
  return []
}

const readViews = () => {
  try {
    const list = JSON.parse(localStorage.getItem(VIEW_KEY))
    return Array.isArray(list) ? list.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function getRecentViews() {
  return readViews()
}

export function addRecentView(id) {
  if (id == null || id === '') return readViews()
  const key = String(id)
  const next = [key, ...readViews().filter((v) => v !== key)].slice(0, MAX_VIEWS)
  localStorage.setItem(VIEW_KEY, JSON.stringify(next))
  return next
}

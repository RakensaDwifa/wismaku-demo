const RECENT_KEY = 'wismaku_recent_searches'
const MAX_ITEMS = 5

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

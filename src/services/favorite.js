import { supabase } from '../lib/supabase.js'

const CHANGE_EVENT = 'wismaku:favorites-changed'
const SESSION_EVENT = 'wismaku:session-changed'

let inflightFavorites = null
let cachedFavorites = null

export const clearFavoritesCache = () => {
  inflightFavorites = null
  cachedFavorites = null
}

const notify = () => {
  clearFavoritesCache()
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

if (typeof window !== 'undefined') {
  window.addEventListener(SESSION_EVENT, clearFavoritesCache)
}

export async function getFavorites() {
  if (!supabase) return []
  const useCache = !import.meta.env?.VITEST
  if (useCache && cachedFavorites !== null) return cachedFavorites
  if (inflightFavorites) return inflightFavorites
  inflightFavorites = (async () => {
    try {
      const { data, error } = await supabase.from('favorites').select('hotel_id')
      if (error) return []
      const list = (data ?? []).map((r) => String(typeof r === 'object' && r !== null ? r.hotel_id : r))
      if (useCache) cachedFavorites = list
      return list
    } finally {
      inflightFavorites = null
    }
  })()
  return inflightFavorites
}

export async function isFavorite(id) {
  if (!supabase) return false
  const list = await getFavorites()
  return list.includes(String(id))
}

export async function toggleFavorite(id, user) {
  const key = String(id)
  if (!supabase) {
    notify()
    return { id: key, active: false }
  }
  const current = await isFavorite(key)
  const payload = user?.id ? { user_id: user.id, hotel_id: key } : { hotel_id: key }
  const { error } = current
    ? await supabase.from('favorites').delete().eq('hotel_id', key)
    : await supabase.from('favorites').insert(payload)
  if (error) throw new Error(error.message)
  notify()
  return { id: key, active: !current }
}

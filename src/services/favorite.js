import { supabase } from '../lib/supabase.js'

const CHANGE_EVENT = 'wismaku:favorites-changed'

const notify = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

export async function getFavorites() {
  if (!supabase) return []
  const { data, error } = await supabase.from('favorites').select('hotel_id')
  if (error) return []
  return (data ?? []).map((r) => String(r.hotel_id))
}

export async function isFavorite(id) {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('favorites')
    .select('hotel_id')
    .eq('hotel_id', String(id))
    .maybeSingle()
  if (error) return false
  return !!data
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

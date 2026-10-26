import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Client singleton untuk browser. Memakai anon key (publishable) — aman diekspos
 * karena RLS di server yang menegakkan batas akses per pengguna.
 *
 * Bila env belum diset (mis. unit test tanpa .env), client dibuat sebagai null
 * agar modul tetap bisa di-import; pemanggil wajib menangani null.
 */
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null

if (!supabase) {
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diset.')
}

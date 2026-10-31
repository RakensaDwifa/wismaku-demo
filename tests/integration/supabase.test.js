import { describe, expect, it } from 'vitest'
import { supabase } from '../../src/lib/supabase.js'

describe('supabase client', () => {
  it('diekspor sebagai instance client yang valid', () => {
    // Dalam environment tanpa .env (mis. CI minimal), client bisa null —
    // itu perilaku yang disengaja, bukan kegagalan.
    if (supabase === null) {
      console.warn('supabase client null — lewati asersi koneksi (env belum diset).')
      return
    }
    expect(typeof supabase.from).toBe('function')
    expect(typeof supabase.auth).toBe('object')
    expect(typeof supabase.auth.getUser).toBe('function')
  })

  it('bisa membaca katalog cities (integrasi, butuh env + jaringan)', async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('cities').select('id,name').limit(3)
    if (error) throw error
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })
})

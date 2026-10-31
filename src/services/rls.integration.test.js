// ============================================================================
// RLS integration test — butuh local Supabase stack (supabase start).
// Otomatis di-skip bila VITE_SUPABASE_URL tidak diset.
// ============================================================================
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const skip = !import.meta.env.VITE_SUPABASE_URL

describe.skipIf(skip)('RLS: isolasi data per pengguna', () => {
  const emailA = `rls-a-${Date.now()}@test.local`
  const emailB = `rls-b-${Date.now()}@test.local`
  const password = 'rahasia123'
  let clientA, clientB
  let bookingIdA

  beforeAll(async () => {
    clientA = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
    clientB = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })

    await clientA.auth.signUp({ email: emailA, password })
    await clientB.auth.signUp({ email: emailB, password })

    await clientA.auth.signInWithPassword({ email: emailA, password })
    await clientB.auth.signInWithPassword({ email: emailB, password })

    const { data: userData } = await clientA.auth.getUser()
    const { data: hotel } = await clientA.from('hotels').select('id').limit(1).single()

    const { data, error } = await clientA
      .from('bookings')
      .insert({
        user_id: userData.user.id,
        hotel_id: hotel.id,
        hotel_name: 'Hotel Test RLS',
        nights: 1,
        rooms: 1,
        guests: 1,
        room_type_id: 'standard',
        room_type_name: 'Standar',
        room_price: 100000,
        total_price: 100000,
        guest_name: 'User A',
        email: emailA,
        phone: '081234567890',
        status: 'pending',
      })
      .select()
      .single()
    if (error) throw error
    bookingIdA = data.id
  })

  afterAll(async () => {
    if (bookingIdA) await clientA?.from('bookings').delete().eq('id', bookingIdA)
  })

  it('user B tidak bisa membaca booking user A', async () => {
    const { data } = await clientB.from('bookings').select('*').eq('id', bookingIdA)
    expect(data).toEqual([])
  })

  it('user B tidak bisa mengubah booking user A', async () => {
    const { data } = await clientB
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingIdA)
      .select()
    expect(data).toEqual([])
    const { data: check } = await clientA.from('bookings').select('status').eq('id', bookingIdA).single()
    expect(check.status).toBe('pending')
  })

  it('user B tidak bisa menghapus booking user A', async () => {
    const { data } = await clientB.from('bookings').delete().eq('id', bookingIdA).select()
    expect(data).toEqual([])
    const { data: check } = await clientA.from('bookings').select('id').eq('id', bookingIdA).maybeSingle()
    expect(check).toBeTruthy()
  })

  it('user A bisa membaca booking miliknya', async () => {
    const { data, error } = await clientA.from('bookings').select('*').eq('id', bookingIdA).maybeSingle()
    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data.id).toBe(bookingIdA)
  })

  it('user A tidak bisa mengonfirmasi status pembayaran langsung dari klien', async () => {
    const { error } = await clientA
      .from('bookings')
      .update({ status: 'confirmed', payment_method: 'qris' })
      .eq('id', bookingIdA)
    expect(error).toBeTruthy()
    expect(error.message).toMatch(/server pembayaran/i)
  })
})

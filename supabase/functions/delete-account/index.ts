import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Konfigurasi server belum lengkap.' }, 500)

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return json({ error: 'Sesi login diperlukan.' }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const {
    data: { user },
    error: authErr,
  } = await admin.auth.getUser(jwt)
  if (authErr || !user) return json({ error: 'Sesi tidak valid atau telah berakhir.' }, 401)

  let body: { confirmEmail?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Payload JSON tidak valid.' }, 400)
  }

  // Konfirmasi ulang di server: email yang diketik harus sama dengan email akun.
  const typed = typeof body?.confirmEmail === 'string' ? body.confirmEmail.trim().toLowerCase() : ''
  if (!user.email || typed !== user.email.toLowerCase()) {
    return json({ error: 'Email konfirmasi tidak cocok.' }, 400)
  }

  // Tolak bila masih ada pesanan terkonfirmasi yang belum selesai (cegah kehilangan data pembayaran).
  const today = new Date().toISOString().slice(0, 10)
  const { count, error: countErr } = await admin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .gte('check_out', today)
  if (countErr) return json({ error: 'Gagal memeriksa pesanan aktif.' }, 500)
  if ((count ?? 0) > 0) {
    return json(
      { error: 'Akun tidak dapat dihapus selama masih ada pesanan terkonfirmasi yang belum selesai.' },
      409,
    )
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
  if (delErr) return json({ error: 'Gagal menghapus akun.' }, 500)

  return json({ ok: true })
})

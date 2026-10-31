import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const MIDTRANS_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/v1/transactions'
const MIDTRANS_API_BASE = 'https://api.sandbox.midtrans.com/v2'

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

const normalizeMethod = (paymentType?: string | null): string | null => {
  if (!paymentType) return null
  if (
    ['bank_transfer', 'echannel', 'permata', 'bca_va', 'bni_va', 'bri_va', 'cimb_va'].includes(paymentType)
  ) {
    return 'va'
  }
  if (paymentType === 'qris') return 'qris'
  if (['gopay', 'shopeepay', 'dana', 'ovo'].includes(paymentType)) return 'ewallet'
  return paymentType
}

const isPaidStatus = (txStatus?: string, fraudStatus?: string) =>
  txStatus === 'settlement' || (txStatus === 'capture' && (!fraudStatus || fraudStatus === 'accept'))

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY') ?? ''
  const clientKey = Deno.env.get('MIDTRANS_CLIENT_KEY') ?? ''

  if (!supabaseUrl || !serviceRoleKey || !serverKey) {
    return json({ error: 'Konfigurasi server pembayaran belum lengkap.' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!jwt) {
    return json({ error: 'Sesi login diperlukan.' }, 401)
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const {
    data: { user },
    error: authErr,
  } = await supabaseAdmin.auth.getUser(jwt)

  if (authErr || !user) {
    return json({ error: 'Sesi tidak valid atau telah berakhir.' }, 401)
  }

  let body: { bookingId?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Payload JSON tidak valid.' }, 400)
  }

  const bookingId = typeof body?.bookingId === 'string' ? body.bookingId.trim() : ''
  const action = body?.action === 'verify' || body?.action === 'reset' ? body.action : 'token'
  if (!bookingId) {
    return json({ error: 'bookingId wajib diisi.' }, 400)
  }

  const { data: booking, error: fetchErr } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr) {
    return json({ error: 'Gagal memuat data pesanan.' }, 500)
  }
  if (!booking) {
    return json({ error: 'Pesanan tidak ditemukan.' }, 404)
  }

  const basicAuth = `Basic ${btoa(`${serverKey}:`)}`

  const checkMidtransStatus = async (orderId: string) => {
    const res = await fetch(`${MIDTRANS_API_BASE}/${encodeURIComponent(orderId)}/status`, {
      headers: { Accept: 'application/json', Authorization: basicAuth },
    })
    return await res.json()
  }

  if (action === 'verify') {
    if (booking.status === 'confirmed' || !booking.midtrans_order_id) {
      return json({
        status: booking.status,
        paymentMethod: booking.payment_method,
        paidAt: booking.paid_at,
      })
    }

    const tx = await checkMidtransStatus(booking.midtrans_order_id)
    if (String(tx?.status_code) === '404') {
      return json({
        status: booking.status,
        paymentMethod: booking.payment_method,
        midtransStatus: 'unselected',
      })
    }

    const txStatus = String(tx?.transaction_status ?? '')
    const method = normalizeMethod(tx?.payment_type) ?? booking.payment_method

    if (isPaidStatus(txStatus, tx?.fraud_status)) {
      const paidAt = booking.paid_at ?? new Date().toISOString()
      const { error: updErr } = await supabaseAdmin
        .from('bookings')
        .update({ status: 'confirmed', payment_method: method, paid_at: paidAt })
        .eq('id', booking.id)
      if (updErr) return json({ error: 'Gagal memperbarui status pembayaran.' }, 500)
      return json({ status: 'confirmed', paymentMethod: method, paidAt, midtransStatus: txStatus })
    }

    if (txStatus === 'pending' && method && method !== booking.payment_method) {
      await supabaseAdmin.from('bookings').update({ payment_method: method }).eq('id', booking.id)
    } else if (txStatus === 'cancel' || txStatus === 'expire') {
      await supabaseAdmin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      return json({ status: 'cancelled', paymentMethod: method, midtransStatus: txStatus })
    } else if (txStatus === 'deny') {
      await supabaseAdmin.from('bookings').update({ snap_token: null }).eq('id', booking.id)
    }

    return json({ status: booking.status, paymentMethod: method, midtransStatus: txStatus })
  }

  if (booking.status === 'confirmed') {
    return json({ status: 'confirmed', token: null, clientKey })
  }
  if (booking.status === 'cancelled') {
    return json({ error: 'Pesanan yang sudah dibatalkan tidak dapat dibayar.' }, 409)
  }

  const expiresAtMs = booking.expires_at ? new Date(booking.expires_at).getTime() : null
  if (expiresAtMs !== null && expiresAtMs <= Date.now()) {
    return json({ error: 'Waktu pembayaran pesanan ini telah habis. Silakan buat pesanan baru.' }, 409)
  }

  if (action === 'token' && booking.snap_token && booking.midtrans_order_id) {
    const tx = await checkMidtransStatus(booking.midtrans_order_id)
    const txStatus = String(tx?.transaction_status ?? '')

    if (isPaidStatus(txStatus, tx?.fraud_status)) {
      const paidAt = booking.paid_at ?? new Date().toISOString()
      const method = normalizeMethod(tx?.payment_type) ?? booking.payment_method
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'confirmed', payment_method: method, paid_at: paidAt })
        .eq('id', booking.id)
      return json({ status: 'confirmed', token: null, clientKey, paymentMethod: method })
    }

    if (String(tx?.status_code) === '404' || txStatus === 'pending') {
      return json({
        status: 'pending',
        token: booking.snap_token,
        orderId: booking.midtrans_order_id,
        clientKey,
      })
    }
  }

  if (action === 'reset' && booking.midtrans_order_id) {
    await fetch(`${MIDTRANS_API_BASE}/${encodeURIComponent(booking.midtrans_order_id)}/cancel`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: basicAuth },
    }).catch(() => null)
  }

  const shortId = String(booking.id).replace(/-/g, '').slice(0, 12).toUpperCase()
  const orderId = `WK-${shortId}-${Date.now().toString(36).toUpperCase()}`
  const grossAmount = Math.max(1, Math.round(Number(booking.total_price)))

  const snapPayload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: [
      {
        id: String(booking.room_type_id || 'room').slice(0, 50),
        price: grossAmount,
        quantity: 1,
        name: `${booking.hotel_name} (${booking.nights} mlm)`.slice(0, 50),
      },
    ],
    customer_details: {
      first_name: String(booking.guest_name || 'Tamu').slice(0, 50),
      email: booking.email,
      phone: booking.phone,
    },
    // Transaksi Midtrans kedaluwarsa bersamaan dengan batas waktu pesanan.
    expiry: {
      unit: 'minute',
      duration: expiresAtMs ? Math.max(1, Math.ceil((expiresAtMs - Date.now()) / 60000)) : 60,
    },
  }

  const snapRes = await fetch(MIDTRANS_SNAP_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: basicAuth,
    },
    body: JSON.stringify(snapPayload),
  })

  const snapData = await snapRes.json()
  if (!snapRes.ok || !snapData?.token) {
    const msg = Array.isArray(snapData?.error_messages)
      ? snapData.error_messages.join(', ')
      : 'Gagal membuat sesi pembayaran Midtrans.'
    return json({ error: msg }, 502)
  }

  const { error: saveErr } = await supabaseAdmin
    .from('bookings')
    .update({
      snap_token: snapData.token,
      midtrans_order_id: orderId,
    })
    .eq('id', booking.id)

  if (saveErr) {
    return json({ error: 'Gagal menyimpan token pembayaran.' }, 500)
  }

  return json({
    status: 'pending',
    token: snapData.token,
    redirectUrl: snapData.redirect_url,
    orderId,
    clientKey,
  })
})

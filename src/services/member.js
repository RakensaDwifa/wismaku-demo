import { supabase } from '../lib/supabase.js'
import {
  ChangePasswordSchema,
  LoginPayloadSchema,
  MemberPayloadSchema,
  ResetRequestSchema,
  ResetVerifyOtpSchema,
  PartnerPayloadSchema,
  UpdateProfileSchema,
  UserPayloadSchema,
  parsePayload,
} from '../schemas/contracts.js'

const CHANGE_EVENT = 'wismaku:session-changed'
export const OPEN_AUTH_EVENT = 'wismaku:open-auth'
const AUTH_RETURN_KEY = 'wismaku.authReturnTo'
const SESSION_TTL_MS = 5000

let inflightUser = null
let cachedUser = undefined
let cachedAt = 0

export const clearSessionCache = () => {
  inflightUser = null
  cachedUser = undefined
  cachedAt = 0
}

export const openAuthModal = (tab = 'login') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_AUTH_EVENT, { detail: { tab } }))
  }
}

const notConfigured = () => {
  const error = new Error('Supabase belum dikonfigurasi. Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.')
  error.code = 'SUPABASE_NOT_CONFIGURED'
  return error
}

const authError = (code, message) => {
  const error = new Error(message)
  error.code = code
  return error
}

const notify = () => {
  clearSessionCache()
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT))
}

const publicUser = (user) =>
  user ? { id: user.id, name: user.name, email: user.email, joinedAt: user.joinedAt } : null

const fetchProfile = async (userId) => {
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) return null
  return data
}

const toAppUser = (authUser, profile) => {
  if (!authUser) return null
  return {
    id: authUser.id,
    name: profile?.name ?? authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? '',
    phone: profile?.phone ?? authUser.user_metadata?.phone ?? authUser.phone ?? '',
    email: authUser.email ?? profile?.email ?? '',
    provider: profile?.provider ?? 'email',
    avatarUrl:
      profile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? null,
    loggedInAt: authUser.last_sign_in_at ?? profile?.joined_at ?? null,
  }
}

/* ---------------------------------------------------------------------------
 *  Sesi / akun
 * ------------------------------------------------------------------------- */

export async function getActiveUser() {
  if (!supabase) return null
  const useTtl = !import.meta.env?.VITEST
  if (useTtl && cachedUser !== undefined && Date.now() - cachedAt < SESSION_TTL_MS) {
    return cachedUser
  }
  if (inflightUser) return inflightUser
  inflightUser = (async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        cachedUser = null
        cachedAt = Date.now()
        return null
      }
      const profile = await fetchProfile(data.user.id)
      const user = toAppUser(data.user, profile)
      cachedUser = user
      cachedAt = Date.now()
      return user
    } finally {
      inflightUser = null
    }
  })()
  return inflightUser
}

export const sanitizeReturnPath = (value) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    /[\r\n]/.test(trimmed)
  ) {
    return null
  }
  return trimmed
}

const stripBasename = (path) => {
  const base = import.meta.env?.BASE_URL?.replace(/\/$/, '') || ''
  if (base && (path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}?`))) {
    const stripped = path.slice(base.length)
    return stripped.startsWith('/') ? stripped : `/${stripped}`
  }
  return path
}

const clearAuthReturnPath = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return
  try {
    window.sessionStorage.removeItem(AUTH_RETURN_KEY)
  } catch {
    /* abaikan */
  }
}

export const peekAuthReturnPath = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null
  try {
    const safe = sanitizeReturnPath(window.sessionStorage.getItem(AUTH_RETURN_KEY))
    return safe && safe !== '/' ? safe : null
  } catch {
    return null
  }
}

export const consumeAuthReturnPath = () => {
  const safe = peekAuthReturnPath()
  clearAuthReturnPath()
  return safe
}

export async function registerUser(payload) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(UserPayloadSchema, payload)
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { name: data.name } },
  })
  if (error) throw new Error(error.message)
  if (!authData?.user) throw new Error('Pendaftaran gagal.')
  clearAuthReturnPath()
  notify()
  return publicUser({
    id: authData.user.id,
    name: data.name,
    email: data.email,
    joinedAt: new Date().toISOString(),
  })
}

export async function loginUser(email, password) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(LoginPayloadSchema, { email, password })
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
  if (error || !authData?.user) throw authError('INVALID_CREDENTIALS', 'Kredensial tidak cocok.')
  const profile = await fetchProfile(authData.user.id)
  const user = toAppUser(authData.user, profile)
  clearAuthReturnPath()
  notify()
  return publicUser(user)
}

export async function logout() {
  if (!supabase) return null
  await supabase.auth.signOut()
  clearAuthReturnPath()
  notify()
  return null
}

/* ---------------------------------------------------------------------------
 *  Provider (OAuth via Supabase Auth)
 * ------------------------------------------------------------------------- */

const originUrl = () =>
  typeof window !== 'undefined' && window.location?.origin ? window.location.origin : undefined

const prepareOAuthRedirect = () => {
  if (typeof window === 'undefined' || !window.location) return undefined
  const origin = originUrl()
  const rawPath = `${window.location.pathname || '/'}${window.location.search || ''}`
  const safeFull = sanitizeReturnPath(rawPath) ?? '/'
  const routerPath = sanitizeReturnPath(stripBasename(safeFull)) ?? '/'
  try {
    if (routerPath !== '/') window.sessionStorage?.setItem(AUTH_RETURN_KEY, routerPath)
    else window.sessionStorage?.removeItem(AUTH_RETURN_KEY)
  } catch {
    /* abaikan */
  }
  return origin ? `${origin}${safeFull}` : undefined
}

const loginOAuth = async (provider) => {
  if (!supabase) throw notConfigured()
  const targetUrl = prepareOAuthRedirect()
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: targetUrl },
  })
  if (error) {
    clearAuthReturnPath()
    throw new Error(error.message)
  }
}

export async function loginGoogle() {
  return loginOAuth('google')
}

export async function loginFacebook() {
  return loginOAuth('facebook')
}

/* ---------------------------------------------------------------------------
 *  Pemulihan, ubah password, dan hapus akun
 * ------------------------------------------------------------------------- */

// ponytail: tautan reset mendarat di /akun dengan sesi pemulihan; form ubah password di sana
// langsung dipakai. Tambahkan event PASSWORD_RECOVERY bila butuh sorotan khusus.
export async function requestPasswordReset(email) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(ResetRequestSchema, { email })
  const base = import.meta.env?.BASE_URL?.replace(/\/$/, '') || ''
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${originUrl() ?? ''}${base}/akun`,
  })
  if (error) throw new Error(error.message)
}

export async function verifyPasswordResetOtp({ email, token, password }) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(ResetVerifyOtpSchema, { email, token, password })
  const { error: otpError } = await supabase.auth.verifyOtp({
    email: data.email,
    token: data.token,
    type: 'recovery',
  })
  if (otpError) throw new Error(otpError.message)

  const { error: updateError } = await supabase.auth.updateUser({ password: data.password })
  if (updateError) throw new Error(updateError.message)

  notify()
}

export async function updatePassword(password) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(ChangePasswordSchema, { password })
  const { error } = await supabase.auth.updateUser({ password: data.password })
  if (error) throw new Error(error.message)
}

export async function updateProfile(payload) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(UpdateProfileSchema, payload)
  const { data: authData, error: authErr } = await supabase.auth.updateUser({
    data: { name: data.name, phone: data.phone ?? '' },
  })
  if (authErr) throw new Error(authErr.message)

  if (authData?.user) {
    const updateBody = { name: data.name }
    if (data.phone !== undefined) {
      updateBody.phone = data.phone || null
    }
    const { error: profileErr } = await supabase
      .from('profiles')
      .update(updateBody)
      .eq('id', authData.user.id)

    if (profileErr) {
      // Fallback bila kolom phone belum terpasang di schema cache
      await supabase.from('profiles').update({ name: data.name }).eq('id', authData.user.id)
    }
  }

  notify()
  return getActiveUser()
}

export async function deleteAccount(confirmEmail) {
  if (!supabase) throw notConfigured()
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirmEmail },
  })
  if (error) {
    let msg = error.message
    if (typeof error.context?.json === 'function') {
      const payload = await error.context.json().catch(() => null)
      if (payload?.error) msg = payload.error
    }
    throw new Error(msg || 'Gagal menghapus akun.')
  }
  if (data?.error) throw new Error(data.error)
  await supabase.auth.signOut({ scope: 'local' }).catch(() => null)
  notify()
}

// Sinkronkan state UI saat sesi berubah (mis. setelah redirect OAuth).
if (supabase && typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      notify()
    }
  })
}

/* ---------------------------------------------------------------------------
 *  Member WismaClub
 * ------------------------------------------------------------------------- */

export async function getMember() {
  if (!supabase) return null
  const user = await getActiveUser()
  if (!user) return null
  const { data, error } = await supabase.from('members').select('*').eq('user_id', user.id).maybeSingle()
  if (error) return null
  return data
}

export async function registerMember(payload) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(MemberPayloadSchema, payload)
  const user = await getActiveUser()
  if (!user) throw new Error('Harus masuk dulu.')
  const memberNo = `MC-${Date.now().toString(36).toUpperCase()}`
  const { data: member, error } = await supabase
    .from('members')
    .insert({ user_id: user.id, member_no: memberNo, name: data.name, email: data.email })
    .select()
    .single()
  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message ?? '')) {
      const existing = await getMember()
      if (existing) return existing
    }
    throw new Error(error.message)
  }
  notify()
  return member
}

/* ---------------------------------------------------------------------------
 *  Partner penginapan
 * ------------------------------------------------------------------------- */

export async function getPartners() {
  if (!supabase) return []
  const { data, error } = await supabase.from('partners').select('*')
  if (error) return []
  return data ?? []
}

// ponytail: ID dibuat di klien dengan crypto.randomUUID() agar insert tidak perlu .select()
// (menjaga RLS SELECT tabel partners tetap tertutup bagi anonim).
export async function registerPartner(payload) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(PartnerPayloadSchema, payload)
  const user = await getActiveUser()
  const id = crypto.randomUUID()
  const { error } = await supabase.from('partners').insert({
    id,
    user_id: user?.id ?? null,
    owner_name: data.ownerName,
    property_name: data.propertyName,
    city: data.city,
    email: data.email,
  })
  if (error) throw new Error(error.message)
  return {
    id,
    userId: user?.id ?? null,
    ownerName: data.ownerName,
    propertyName: data.propertyName,
    city: data.city,
    email: data.email,
  }
}

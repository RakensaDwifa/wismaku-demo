import { supabase } from '../lib/supabase.js'
import {
  ChangePasswordSchema,
  LoginPayloadSchema,
  MemberPayloadSchema,
  ResetRequestSchema,
  PartnerPayloadSchema,
  UserPayloadSchema,
  parsePayload,
} from '../schemas/contracts.js'

const CHANGE_EVENT = 'wismaku:session-changed'
export const OPEN_AUTH_EVENT = 'wismaku:open-auth'
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
    name: profile?.name ?? authUser.email?.split('@')[0] ?? '',
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
  notify()
  return publicUser(user)
}

export async function logout() {
  if (!supabase) return null
  await supabase.auth.signOut()
  notify()
  return null
}

/* ---------------------------------------------------------------------------
 *  Provider (OAuth via Supabase Auth)
 * ------------------------------------------------------------------------- */

const redirectTo = () =>
  typeof window !== 'undefined' && window.location ? window.location.origin : undefined

export async function loginGoogle() {
  if (!supabase) throw notConfigured()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo() },
  })
  if (error) throw new Error(error.message)
}

export async function loginFacebook() {
  if (!supabase) throw notConfigured()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: redirectTo() },
  })
  if (error) throw new Error(error.message)
}

/* ---------------------------------------------------------------------------
 *  Pemulihan, ubah password, dan hapus akun
 * ------------------------------------------------------------------------- */

// ponytail: tautan reset mendarat di /akun dengan sesi pemulihan; form ubah password di sana
// langsung dipakai. Tambahkan event PASSWORD_RECOVERY bila butuh sorotan khusus.
export async function requestPasswordReset(email) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(ResetRequestSchema, { email })
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${redirectTo() ?? ''}/akun`,
  })
  if (error) throw new Error(error.message)
}

export async function updatePassword(password) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(ChangePasswordSchema, { password })
  const { error } = await supabase.auth.updateUser({ password: data.password })
  if (error) throw new Error(error.message)
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
  if (error) throw new Error(error.message)
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

export async function registerPartner(payload) {
  if (!supabase) throw notConfigured()
  const data = parsePayload(PartnerPayloadSchema, payload)
  const user = await getActiveUser()
  const { data: partner, error } = await supabase
    .from('partners')
    .insert({
      user_id: user?.id ?? null,
      owner_name: data.ownerName,
      property_name: data.propertyName,
      city: data.city,
      email: data.email,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return partner
}

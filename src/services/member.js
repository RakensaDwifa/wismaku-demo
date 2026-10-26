import { supabase } from '../lib/supabase.js'
import {
  LoginPayloadSchema,
  MemberPayloadSchema,
  PartnerPayloadSchema,
  UserPayloadSchema,
  parsePayload,
} from '../schemas/contracts.js'

const CHANGE_EVENT = 'wismaku:session-changed'

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
    loggedInAt: new Date().toISOString(),
  }
}

/* ---------------------------------------------------------------------------
 *  Sesi / akun
 * ------------------------------------------------------------------------- */

export async function getActiveUser() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  const profile = await fetchProfile(data.user.id)
  return toAppUser(data.user, profile)
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
 *  Provider (OAuth ditunda — Supabase Auth akan dipakai nanti)
 * ------------------------------------------------------------------------- */

export async function loginGoogle() {
  throw authError('OAUTH_NOT_CONFIGURED', 'Login Google belum tersedia.')
}

export async function loginFacebook() {
  throw authError('OAUTH_NOT_CONFIGURED', 'Login Facebook belum tersedia.')
}

export function getLastGoogleProfile() {
  return null
}

export function getLastFacebookProfile() {
  return null
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

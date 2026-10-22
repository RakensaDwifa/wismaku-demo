import { request, USE_MOCK } from './api.js'
import {
  MemberPayloadSchema,
  PartnerPayloadSchema,
  UserPayloadSchema,
  parsePayload,
} from '../schemas/contracts.js'

const MEMBER_KEY = 'wismaku_members'
const USER_KEY = 'wismaku_users'
const PARTNER_KEY = 'wismaku_partners'
const ACTIVE_KEY = 'wismaku_active_member'
const ACTIVE_USER_KEY = 'wismaku_active_user'
const GOOGLE_PROFILE_KEY = 'wismaku_google_profile'
const FACEBOOK_PROFILE_KEY = 'wismaku_facebook_profile'
const CHANGE_EVENT = 'wismaku:session-changed'

/*
 * ============================================================================
 *  DEMO ONLY - PASSWORD DISIMPAN PLAINTEXT
 * ============================================================================
 *  Pada mode mock, `password` disimpan apa adanya di localStorage browser.
 *  Ini SENGAJA TIDAK di-hash: aplikasi ini adalah demo pembelajaran tanpa
 *  backend sungguhan, dan hash base64/statis hanya memberi ilusi keamanan
 *  tanpa menambah perlindungan nyata.
 *
 *  - Mode mock  : password plaintext di localStorage (lihat catatan README).
 *  - Mode API   : `VITE_USE_MOCK=false` -> password dikirim ke backend dan
 *                 tidak pernah menyentuh localStorage.
 *
 *  JANGAN pakai kode ini sebagai basis sistem autentikasi produksi.
 * ============================================================================
 */

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

const setActive = (id) => {
  try {
    if (id == null) localStorage.removeItem(ACTIVE_KEY)
    else localStorage.setItem(ACTIVE_KEY, id)
  } catch {
    return
  }
}

const notify = () => {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

const readObject = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || null
  } catch {
    return null
  }
}

const writeObject = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export async function getMember() {
  if (USE_MOCK) {
    const activeId = (() => {
      try {
        return localStorage.getItem(ACTIVE_KEY)
      } catch {
        return null
      }
    })()
    if (!activeId) return null
    const list = read(MEMBER_KEY)
    return list.find((m) => m.id === activeId) ?? null
  }
  return request('/member')
}

export async function registerMember(payload) {
  const data = parsePayload(MemberPayloadSchema, payload)
  if (USE_MOCK) {
    const member = {
      id: `MC-${Date.now().toString(36).toUpperCase()}`,
      ...data,
      joinedAt: new Date().toISOString(),
    }
    const list = read(MEMBER_KEY)
    list.push(member)
    localStorage.setItem(MEMBER_KEY, JSON.stringify(list))
    setActive(member.id)
    notify()
    return member
  }
  const member = await request('/member', { method: 'POST', body: data })
  notify()
  return member
}

export async function registerUser(payload) {
  const data = parsePayload(UserPayloadSchema, payload)
  if (USE_MOCK) {
    const user = {
      id: `US-${Date.now().toString(36).toUpperCase()}`,
      ...data,
      joinedAt: new Date().toISOString(),
    }
    const list = read(USER_KEY)
    list.push(user)
    localStorage.setItem(USER_KEY, JSON.stringify(list))
    setActiveUser({ name: user.name, email: user.email, provider: 'email' })
    return user
  }
  const user = await request('/users/register', { method: 'POST', body: data })
  notify()
  return user
}

export async function loginUser(email, password) {
  const clean = (email || '').trim().toLowerCase()
  if (USE_MOCK) {
    // `u?.email` dijaga karena entri lama di localStorage bisa saja tidak punya email.
    const user = read(USER_KEY).find((u) => (u?.email || '').toLowerCase() === clean)
    if (!user || user.password !== password) throw new Error('Kredensial tidak cocok.')
    setActiveUser({ name: user.name, email: user.email, provider: 'email' })
    return user
  }
  const user = await request('/users/login', { method: 'POST', body: { email: clean, password } })
  setActiveUser({ name: user.name, email: user.email, provider: 'email' })
  return user
}

const setActiveUser = (profile) => {
  writeObject(ACTIVE_USER_KEY, { ...profile, loggedInAt: new Date().toISOString() })
  notify()
}

const loginProvider = async (provider, { name, email }, profileKey) => {
  const profile = {
    name: (name || '').trim(),
    email: (email || '').trim().toLowerCase(),
    provider,
  }
  if (USE_MOCK) {
    writeObject(profileKey, profile)
    setActiveUser(profile)
    return profile
  }
  const user = await request(`/member/${provider}-login`, { method: 'POST', body: profile })
  notify()
  return user
}

export async function loginGoogle(payload) {
  return loginProvider('google', payload, GOOGLE_PROFILE_KEY)
}

export async function loginFacebook(payload) {
  return loginProvider('facebook', payload, FACEBOOK_PROFILE_KEY)
}

export function getActiveUser() {
  if (USE_MOCK) return readObject(ACTIVE_USER_KEY)
  return null
}

export function getLastGoogleProfile() {
  if (USE_MOCK) return readObject(GOOGLE_PROFILE_KEY)
  return null
}

export function getLastFacebookProfile() {
  if (USE_MOCK) return readObject(FACEBOOK_PROFILE_KEY)
  return null
}

export async function logout() {
  if (USE_MOCK) {
    setActive(null)
    writeObject(ACTIVE_USER_KEY, null)
    notify()
    return null
  }
  await request('/member/logout', { method: 'POST' })
  writeObject(ACTIVE_USER_KEY, null)
  notify()
  return null
}

export async function getPartners() {
  if (USE_MOCK) return read(PARTNER_KEY)
  return request('/partners')
}

export async function registerPartner(payload) {
  const data = parsePayload(PartnerPayloadSchema, payload)
  if (USE_MOCK) {
    const partner = {
      id: `PT-${Date.now().toString(36).toUpperCase()}`,
      ...data,
      submittedAt: new Date().toISOString(),
    }
    const list = read(PARTNER_KEY)
    list.push(partner)
    localStorage.setItem(PARTNER_KEY, JSON.stringify(list))
    return partner
  }
  return request('/partners', { method: 'POST', body: data })
}

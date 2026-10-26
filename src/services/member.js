import { request, USE_MOCK } from './api.js'
import { hashPassword, needsRehash, verifyPassword } from './password.js'
import {
  LoginPayloadSchema,
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
const ATTEMPTS_KEY = 'wismaku_login_attempts'
const GOOGLE_PROFILE_KEY = 'wismaku_google_profile'
const FACEBOOK_PROFILE_KEY = 'wismaku_facebook_profile'
const CHANGE_EVENT = 'wismaku:session-changed'

/** Setelah 5 percobaan gagal, email dikunci 60 detik untuk meredam brute force dari console. */
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_LOCK_MS = 60_000
const ATTEMPT_TTL_MS = 24 * 60 * 60 * 1000

/*
 * ============================================================================
 *  MODE MOCK - PASSWORD DI-HASH, BUKAN PLAINTEXT
 * ============================================================================
 *  Sejak perbaikan keamanan, `wismaku_users` hanya menyimpan `passwordHash`
 *  (PBKDF2-HMAC-SHA512 + salt acak per akun) — lihat src/services/password.js.
 *
 *  - Mode mock : hash disimpan di localStorage. Akun lama yang masih plaintext
 *                otomatis di-upgrade saat login pertama yang berhasil.
 *  - Mode API  : `VITE_USE_MOCK=false` -> password dikirim ke backend dan tidak
 *                pernah menyentuh localStorage.
 *
 *  Ini tetap BUKAN auth produksi: tanpa server, hash bisa di-brute-force
 *  offline dan sesi bisa diforge dari DevTools. Lihat SECURITY.md.
 * ============================================================================
 */

const normalizeEmail = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const authError = (code, message, details = {}) => {
  const error = new Error(message)
  error.code = code
  Object.assign(error, details)
  return error
}

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

const readObject = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || null
  } catch {
    return null
  }
}

const write = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
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

/** Hanya field aman yang boleh keluar dari service — hash tidak pernah dikembalikan ke UI. */
const publicUser = (user) =>
  user ? { id: user.id, name: user.name, email: user.email, joinedAt: user.joinedAt } : null

const setActiveUser = (profile) => {
  write(ACTIVE_USER_KEY, { ...profile, loggedInAt: new Date().toISOString() })
  notify()
}

/* ---------------------------------------------------------------------------
 *  Pembatasan percobaan login (disimpan lokal, per email)
 * ------------------------------------------------------------------------- */

const readAttempts = () => {
  const state = readObject(ATTEMPTS_KEY)
  return state && typeof state === 'object' ? state : {}
}

const writeAttempts = (state, now) => {
  const pruned = Object.entries(state).filter(([, entry]) => now - (entry?.updatedAt ?? 0) < ATTEMPT_TTL_MS)
  write(ATTEMPTS_KEY, pruned.length ? Object.fromEntries(pruned) : null)
}

const getRemainingLockMs = (email, now) => {
  const { lockedUntil } = readAttempts()[email] ?? {}
  return typeof lockedUntil === 'number' && lockedUntil > now ? lockedUntil - now : 0
}

const lockMessage = (ms) => `Terlalu banyak percobaan masuk. Coba lagi dalam ${Math.ceil(ms / 1000)} detik.`

/** Catat satu kegagalan; mengembalikan sisa waktu kunci bila batas tercapai. */
const recordFailedLogin = (email, now) => {
  const state = readAttempts()
  const previous = state[email]
  const fresh = !previous || (previous.lockedUntil != null && previous.lockedUntil <= now)
  const fails = (fresh ? 0 : (previous.fails ?? 0)) + 1
  const locked = fails >= MAX_LOGIN_ATTEMPTS
  state[email] = {
    fails: locked ? 0 : fails,
    lockedUntil: locked ? now + LOGIN_LOCK_MS : null,
    updatedAt: now,
  }
  writeAttempts(state, now)
  return locked ? LOGIN_LOCK_MS : 0
}

const clearFailedLogins = (email, now) => {
  const state = readAttempts()
  if (!state[email]) return
  delete state[email]
  writeAttempts(state, now)
}

/**
 * Email yang tidak terdaftar tetap menjalankan satu verifikasi hash supaya waktu
 * responsnya setara dengan email yang ada (mencegah enumerasi akun lewat timing).
 */
let dummyHash = null
const equalizeTiming = async (password) => {
  if (!dummyHash) dummyHash = await hashPassword('wismaku-timing-equalizer')
  await verifyPassword(password, dummyHash)
}

/* ---------------------------------------------------------------------------
 *  Migrasi record lama
 * ------------------------------------------------------------------------- */

/** Naikkan record plaintext/parameter usang menjadi hash terkini setelah login berhasil. */
const upgradePasswordIfNeeded = async (user, password) => {
  const stored = user.passwordHash ?? user.password
  if (!needsRehash(stored)) return user

  const upgraded = { ...user, passwordHash: await hashPassword(password) }
  delete upgraded.password
  delete upgraded.passwordUpdatedAt

  const list = read(USER_KEY).map((entry) => (entry.id === user.id ? upgraded : entry))
  write(USER_KEY, list)
  return upgraded
}

/* ---------------------------------------------------------------------------
 *  Member WismaClub (tanpa password)
 * ------------------------------------------------------------------------- */

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
    write(MEMBER_KEY, list)
    setActive(member.id)
    notify()
    return member
  }
  const member = await request('/member', { method: 'POST', body: data })
  notify()
  return member
}

/* ---------------------------------------------------------------------------
 *  Akun email + password
 * ------------------------------------------------------------------------- */

export async function registerUser(payload) {
  const data = parsePayload(UserPayloadSchema, payload)
  if (USE_MOCK) {
    const exists = read(USER_KEY).some((entry) => normalizeEmail(entry?.email) === data.email)
    if (exists) throw authError('EMAIL_TAKEN', 'Email sudah terdaftar.')

    const user = {
      id: `US-${Date.now().toString(36).toUpperCase()}`,
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      joinedAt: new Date().toISOString(),
    }
    const list = read(USER_KEY)
    list.push(user)
    write(USER_KEY, list)
    setActiveUser({ name: user.name, email: user.email, provider: 'email' })
    return publicUser(user)
  }
  const user = await request('/users/register', { method: 'POST', body: data })
  notify()
  return publicUser(user)
}

export async function loginUser(email, password) {
  const data = parsePayload(LoginPayloadSchema, { email, password })

  if (!USE_MOCK) {
    const user = await request('/users/login', { method: 'POST', body: data })
    setActiveUser({ name: user.name, email: normalizeEmail(user.email), provider: 'email' })
    return publicUser(user)
  }

  const now = Date.now()
  const lockedMs = getRemainingLockMs(data.email, now)
  if (lockedMs) throw authError('ACCOUNT_LOCKED', lockMessage(lockedMs), { retryAfterMs: lockedMs })

  // `entry?.email` dijaga karena entri lama di localStorage bisa saja tidak punya email.
  const user = read(USER_KEY).find((entry) => normalizeEmail(entry?.email) === data.email)

  if (!user) {
    await equalizeTiming(data.password)
    const lockMs = recordFailedLogin(data.email, now)
    throw lockMs
      ? authError('ACCOUNT_LOCKED', lockMessage(lockMs), { retryAfterMs: lockMs })
      : authError('INVALID_CREDENTIALS', 'Kredensial tidak cocok.')
  }

  const valid = await verifyPassword(data.password, user.passwordHash ?? user.password)
  if (!valid) {
    const lockMs = recordFailedLogin(data.email, now)
    throw lockMs
      ? authError('ACCOUNT_LOCKED', lockMessage(lockMs), { retryAfterMs: lockMs })
      : authError('INVALID_CREDENTIALS', 'Kredensial tidak cocok.')
  }

  clearFailedLogins(data.email, now)
  const upgraded = await upgradePasswordIfNeeded(user, data.password)
  setActiveUser({ name: upgraded.name, email: normalizeEmail(upgraded.email), provider: 'email' })
  return publicUser(upgraded)
}

const loginProvider = async (provider, { name, email }, profileKey) => {
  const profile = {
    name: (name || '').trim(),
    email: normalizeEmail(email),
    provider,
  }
  if (USE_MOCK) {
    write(profileKey, profile)
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
    write(ACTIVE_USER_KEY, null)
    notify()
    return null
  }
  await request('/member/logout', { method: 'POST' })
  write(ACTIVE_USER_KEY, null)
  notify()
  return null
}

/* ---------------------------------------------------------------------------
 *  Partner penginapan
 * ------------------------------------------------------------------------- */

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
    write(PARTNER_KEY, list)
    return partner
  }
  return request('/partners', { method: 'POST', body: data })
}

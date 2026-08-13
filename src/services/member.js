import { request, USE_MOCK } from './api.js'
import { MemberPayloadSchema, PartnerPayloadSchema, parsePayload } from '../schemas/contracts.js'

const MEMBER_KEY = 'wismaku_members'
const PARTNER_KEY = 'wismaku_partners'
const ACTIVE_KEY = 'wismaku_active_member'
const ACTIVE_USER_KEY = 'wismaku_active_user'
const GOOGLE_PROFILE_KEY = 'wismaku_google_profile'
const CHANGE_EVENT = 'wismaku:session-changed'

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

export async function loginGoogle({ name, email }) {
  const profile = {
    name: (name || '').trim(),
    email: (email || '').trim().toLowerCase(),
    loggedInAt: new Date().toISOString(),
  }
  if (USE_MOCK) {
    writeObject(ACTIVE_USER_KEY, profile)
    writeObject(GOOGLE_PROFILE_KEY, profile)
    notify()
    return profile
  }
  const user = await request('/member/google-login', { method: 'POST', body: profile })
  notify()
  return user
}

export function getGoogleUser() {
  if (USE_MOCK) return readObject(ACTIVE_USER_KEY)
  return null
}

export function getLastGoogleProfile() {
  if (USE_MOCK) return readObject(GOOGLE_PROFILE_KEY)
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

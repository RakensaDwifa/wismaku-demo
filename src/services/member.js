import { request, USE_MOCK } from './api.js'
import { MemberPayloadSchema, PartnerPayloadSchema, parsePayload } from '../schemas/contracts.js'

const MEMBER_KEY = 'wismaku_members'
const PARTNER_KEY = 'wismaku_partners'
const ACTIVE_KEY = 'wismaku_active_member'
const CHANGE_EVENT = 'wismaku:members-changed'

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

export async function loginMember(email, password) {
  const clean = (email || '').trim().toLowerCase()
  if (USE_MOCK) {
    const member = read(MEMBER_KEY).find((m) => m.email.toLowerCase() === clean)
    if (!member || member.password !== password) throw new Error('Kredensial tidak cocok.')
    setActive(member.id)
    notify()
    return member
  }
  const member = await request('/member/login', { method: 'POST', body: { email: clean, password } })
  setActive(member.id)
  notify()
  return member
}

export async function logoutMember() {
  if (USE_MOCK) {
    setActive(null)
    notify()
    return null
  }
  await request('/member/logout', { method: 'POST' })
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

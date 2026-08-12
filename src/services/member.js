import { request, USE_MOCK } from './api.js'
import { MemberPayloadSchema, PartnerPayloadSchema, parsePayload } from '../schemas/contracts.js'

const MEMBER_KEY = 'wismaku_members'
const PARTNER_KEY = 'wismaku_partners'
const CHANGE_EVENT = 'wismaku:members-changed'

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

const notify = () => {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export async function getMember() {
  if (USE_MOCK) {
    const list = read(MEMBER_KEY)
    return list.length > 0 ? list[list.length - 1] : null
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
    notify()
    return member
  }
  const member = await request('/member', { method: 'POST', body: data })
  notify()
  return member
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

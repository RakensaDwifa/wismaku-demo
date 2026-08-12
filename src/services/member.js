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

export function getMember() {
  const list = read(MEMBER_KEY)
  return list.length > 0 ? list[list.length - 1] : null
}

export function registerMember({ name, email }) {
  const member = {
    id: `MC-${Date.now().toString(36).toUpperCase()}`,
    name,
    email,
    joinedAt: new Date().toISOString(),
  }
  const list = read(MEMBER_KEY)
  list.push(member)
  localStorage.setItem(MEMBER_KEY, JSON.stringify(list))
  notify()
  return member
}

export function getPartners() {
  return read(PARTNER_KEY)
}

export function registerPartner({ ownerName, propertyName, city, email }) {
  const partner = {
    id: `PT-${Date.now().toString(36).toUpperCase()}`,
    ownerName,
    propertyName,
    city,
    email,
    submittedAt: new Date().toISOString(),
  }
  const list = read(PARTNER_KEY)
  list.push(partner)
  localStorage.setItem(PARTNER_KEY, JSON.stringify(list))
  return partner
}
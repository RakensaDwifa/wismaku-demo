import { beforeEach, describe, expect, it } from 'vitest'
import {
  getMember,
  getGoogleUser,
  getLastGoogleProfile,
  registerMember,
  loginGoogle,
  logout,
  getPartners,
  registerPartner,
} from './member.js'

describe('registerMember / getMember', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('membuat member dengan id MC dan auto-login', async () => {
    const m = await registerMember({ name: 'Dewi Lestari', email: 'dewi@example.com' })
    expect(m.id).toMatch(/^MC-/)
    expect(m.joinedAt).toBeTruthy()
    expect((await getMember()).email).toBe('dewi@example.com')
  })

  it('mengembalikan null saat belum ada member', async () => {
    expect(await getMember()).toBeNull()
  })

  it('menolak payload tidak valid', async () => {
    await expect(registerMember({ name: 'X', email: 'bukan-email' })).rejects.toThrow()
  })
})

describe('loginGoogle / logout', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loginGoogle membuat sesi user Google', async () => {
    const u = await loginGoogle({ name: 'Andi Wijaya', email: 'andi@gmail.com' })
    expect(u.email).toBe('andi@gmail.com')
    expect(getGoogleUser()).toEqual(expect.objectContaining({ name: 'Andi Wijaya' }))
  })

  it('getLastGoogleProfile menyimpan profil untuk prefill', async () => {
    await loginGoogle({ name: 'Andi Wijaya', email: 'andi@gmail.com' })
    expect(getLastGoogleProfile().email).toBe('andi@gmail.com')
  })

  it('logout menghapus sesi member dan user Google', async () => {
    await registerMember({ name: 'Dewi Lestari', email: 'dewi@example.com' })
    await loginGoogle({ name: 'Andi Wijaya', email: 'andi@gmail.com' })
    await logout()
    expect(await getMember()).toBeNull()
    expect(getGoogleUser()).toBeNull()
  })

  it('logout tanpa sesi tidak error', async () => {
    await logout()
    expect(getGoogleUser()).toBeNull()
  })
})

describe('registerPartner / getPartners', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('membuat partner dengan id PT', async () => {
    const p = await registerPartner({
      ownerName: 'Andi Wijaya',
      propertyName: 'Wisma Andi',
      city: 'Jakarta',
      email: 'andi@example.com',
    })
    expect(p.id).toMatch(/^PT-/)
    expect((await getPartners()).length).toBe(1)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import {
  getMember,
  registerMember,
  loginMember,
  logoutMember,
  getPartners,
  registerPartner,
} from './member.js'

describe('registerMember / getMember', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('membuat member dengan id MC dan auto-login', async () => {
    const m = await registerMember({
      name: 'Dewi Lestari',
      email: 'dewi@example.com',
      password: 'rahasia123',
    })
    expect(m.id).toMatch(/^MC-/)
    expect(m.joinedAt).toBeTruthy()
    expect((await getMember()).email).toBe('dewi@example.com')
  })

  it('mengembalikan null saat belum ada member', async () => {
    expect(await getMember()).toBeNull()
  })

  it('menolak payload tidak valid', async () => {
    await expect(
      registerMember({ name: 'X', email: 'bukan-email', password: 'rahasia123' }),
    ).rejects.toThrow()
  })

  it('menolak password kurang dari 6 karakter', async () => {
    await expect(
      registerMember({ name: 'Dewi Lestari', email: 'dewi@example.com', password: '123' }),
    ).rejects.toThrow()
  })
})

describe('loginMember / logoutMember', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('login dengan email dan password yang benar', async () => {
    await registerMember({ name: 'Dewi Lestari', email: 'dewi@example.com', password: 'rahasia123' })
    await logoutMember()
    expect(await getMember()).toBeNull()
    const m = await loginMember('dewi@example.com', 'rahasia123')
    expect(m.email).toBe('dewi@example.com')
    expect((await getMember()).id).toBe(m.id)
  })

  it('menolak password yang salah', async () => {
    await registerMember({ name: 'Dewi Lestari', email: 'dewi@example.com', password: 'rahasia123' })
    await logoutMember()
    await expect(loginMember('dewi@example.com', 'salah')).rejects.toThrow()
    expect(await getMember()).toBeNull()
  })

  it('menolak email yang belum terdaftar', async () => {
    await expect(loginMember('sapa@example.com', 'rahasia123')).rejects.toThrow()
  })

  it('logout menghapus sesi', async () => {
    await registerMember({ name: 'Dewi Lestari', email: 'dewi@example.com', password: 'rahasia123' })
    await logoutMember()
    expect(await getMember()).toBeNull()
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

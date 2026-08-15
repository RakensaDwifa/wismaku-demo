import { beforeEach, describe, expect, it } from 'vitest'
import {
  getMember,
  getActiveUser,
  getLastGoogleProfile,
  getLastFacebookProfile,
  registerMember,
  registerUser,
  loginUser,
  loginGoogle,
  loginFacebook,
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

describe('registerUser / loginUser', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('registerUser membuat akun US dan auto-login', async () => {
    const u = await registerUser({
      name: 'Budi Santoso',
      email: 'budi@email.com',
      password: 'rahasia123',
    })
    expect(u.id).toMatch(/^US-/)
    expect(getActiveUser()).toEqual(expect.objectContaining({ provider: 'email', email: 'budi@email.com' }))
  })

  it('menolak password kurang dari 6 karakter', async () => {
    await expect(
      registerUser({ name: 'Budi Santoso', email: 'budi@email.com', password: '123' }),
    ).rejects.toThrow()
  })

  it('loginUser dengan kredensial benar', async () => {
    await registerUser({ name: 'Budi Santoso', email: 'budi@email.com', password: 'rahasia123' })
    await logout()
    expect(getActiveUser()).toBeNull()
    await loginUser('budi@email.com', 'rahasia123')
    expect(getActiveUser()).toEqual(expect.objectContaining({ provider: 'email', name: 'Budi Santoso' }))
  })

  it('menolak password salah dan email belum terdaftar', async () => {
    await registerUser({ name: 'Budi Santoso', email: 'budi@email.com', password: 'rahasia123' })
    await logout()
    await expect(loginUser('budi@email.com', 'salah')).rejects.toThrow()
    await expect(loginUser('sapa@email.com', 'rahasia123')).rejects.toThrow()
  })
})

describe('loginGoogle / loginFacebook / logout', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loginGoogle membuat sesi provider google dan profil prefill', async () => {
    await loginGoogle({ name: 'Andi Wijaya', email: 'andi@gmail.com' })
    expect(getActiveUser()).toEqual(expect.objectContaining({ provider: 'google' }))
    expect(getLastGoogleProfile().email).toBe('andi@gmail.com')
  })

  it('loginFacebook membuat sesi provider facebook dan profil prefill', async () => {
    await loginFacebook({ name: 'Rina Putri', email: 'rina@facebook.com' })
    expect(getActiveUser()).toEqual(expect.objectContaining({ provider: 'facebook' }))
    expect(getLastFacebookProfile().email).toBe('rina@facebook.com')
  })

  it('logout menghapus sesi member dan user', async () => {
    await registerMember({ name: 'Dewi Lestari', email: 'dewi@example.com' })
    await loginGoogle({ name: 'Andi Wijaya', email: 'andi@gmail.com' })
    await logout()
    expect(await getMember()).toBeNull()
    expect(getActiveUser()).toBeNull()
  })

  it('logout tanpa sesi tidak error', async () => {
    await logout()
    expect(getActiveUser()).toBeNull()
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

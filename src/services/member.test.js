import { beforeEach, describe, expect, it } from 'vitest'
import { getMember, registerMember, getPartners, registerPartner } from './member.js'

describe('registerMember / getMember', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('membuat member dengan id MC dan menyimpannya', async () => {
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

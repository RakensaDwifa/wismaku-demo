import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('tidak crash saat data user lama tidak punya field email', async () => {
    localStorage.setItem('wismaku_users', JSON.stringify([{ id: 'US-LAMA', name: 'Tanpa Email' }]))
    await expect(loginUser('apa@saja.com', 'rahasia123')).rejects.toThrow('Kredensial tidak cocok.')
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

describe('keamanan kredensial akun', () => {
  const email = 'siti@email.com'
  const password = 'rahasia123'

  const registerSiti = () => registerUser({ name: 'Siti Aminah', email, password })

  beforeEach(() => {
    localStorage.clear()
  })

  it('menyimpan password sebagai hash, bukan plaintext', async () => {
    await registerSiti()

    const raw = localStorage.getItem('wismaku_users')
    expect(raw).not.toContain(password)

    const [stored] = JSON.parse(raw)
    expect(stored.password).toBeUndefined()
    expect(stored.passwordHash).toEqual(expect.objectContaining({ algo: 'PBKDF2-SHA512' }))
  })

  it('tidak membocorkan hash ke pemanggil', async () => {
    const user = await registerSiti()

    expect(user).toEqual(expect.objectContaining({ id: expect.stringMatching(/^US-/), email }))
    expect(user).not.toHaveProperty('passwordHash')
    expect(user).not.toHaveProperty('password')
  })

  it('menolak email duplikat tanpa peduli kapitalisasi', async () => {
    await registerSiti()

    await expect(
      registerUser({ name: 'Siti Lain', email: 'SITI@Email.com', password: 'rahasia456' }),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' })
    expect(JSON.parse(localStorage.getItem('wismaku_users'))).toHaveLength(1)
  })

  it('meng-upgrade record plaintext lama saat login berhasil', async () => {
    localStorage.setItem(
      'wismaku_users',
      JSON.stringify([{ id: 'US-LAMA', name: 'Akun Lama', email: 'lama@email.com', password: 'lama123' }]),
    )

    await loginUser('Lama@Email.com', 'lama123')

    const [stored] = JSON.parse(localStorage.getItem('wismaku_users'))
    expect(stored.password).toBeUndefined()
    expect(stored.passwordHash).toEqual(expect.objectContaining({ algo: 'PBKDF2-SHA512' }))
  })

  it('mengunci email setelah 5 kali gagal lalu membuka setelah masa tunggu', async () => {
    await registerSiti()

    for (let i = 0; i < 5; i += 1) {
      await expect(loginUser(email, 'salah1234')).rejects.toBeInstanceOf(Error)
    }

    await expect(loginUser(email, password)).rejects.toMatchObject({ code: 'ACCOUNT_LOCKED' })

    const spy = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000)
    try {
      await expect(loginUser(email, password)).resolves.toEqual(expect.objectContaining({ email }))
    } finally {
      spy.mockRestore()
    }
    expect(localStorage.getItem('wismaku_login_attempts')).toBeNull()
  })
})

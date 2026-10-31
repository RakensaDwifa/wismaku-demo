import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteAccount,
  getActiveUser,
  getMember,
  getPartners,
  loginFacebook,
  loginGoogle,
  loginUser,
  logout,
  registerMember,
  registerPartner,
  registerUser,
  requestPasswordReset,
  updatePassword,
} from './member.js'

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

const { mockAuth, mockFrom, mockInvoke, qb } = vi.hoisted(() => {
  const mockAuth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    signInWithOAuth: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  }
  const mockInvoke = vi.fn()
  const mockFrom = vi.fn()
  function qb(resolved) {
    const b = {
      select: vi.fn(() => b),
      eq: vi.fn(() => b),
      maybeSingle: vi.fn(() => Promise.resolve(resolved)),
      single: vi.fn(() => Promise.resolve(resolved)),
      insert: vi.fn(() => b),
    }
    b.insert.mockReturnValue(b)
    b.select.mockReturnValue(b)
    // supabase.from(...).select('*') tanpa .single() harus bisa di-await
    b.then = (resolve, reject) => Promise.resolve(resolved).then(resolve, reject)
    return b
  }
  return { mockAuth, mockFrom, mockInvoke, qb }
})

vi.mock('../lib/supabase.js', () => ({
  supabase: { auth: mockAuth, from: mockFrom, functions: { invoke: mockInvoke } },
}))

const profileRow = (overrides = {}) => ({
  id: 'u-1',
  name: 'Budi Santoso',
  email: 'budi@email.com',
  provider: 'email',
  joined_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  mockFrom.mockImplementation(() => qb({ data: null, error: null }))
})

// ---------------------------------------------------------------------------
// Sesi
// ---------------------------------------------------------------------------

describe('getActiveUser', () => {
  it('mengembalikan null bila tidak ada sesi', async () => {
    expect(await getActiveUser()).toBeNull()
  })

  it('mengembalikan user + profil bila sesi ada', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'u-1', email: 'budi@email.com' } },
      error: null,
    })
    mockFrom.mockImplementation(() => qb({ data: profileRow(), error: null }))
    const user = await getActiveUser()
    expect(user).toEqual(
      expect.objectContaining({
        id: 'u-1',
        email: 'budi@email.com',
        name: 'Budi Santoso',
        provider: 'email',
      }),
    )
  })

  it('tetap mengembalikan user minimal bila profil belum ada', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'u-1', email: 'budi@email.com' } },
      error: null,
    })
    mockFrom.mockImplementation(() => qb({ data: null, error: null }))
    const user = await getActiveUser()
    expect(user).toEqual(expect.objectContaining({ id: 'u-1', email: 'budi@email.com' }))
  })

  it('menyertakan avatarUrl dan loggedInAt asli serta menggabungkan request paralel', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'u-1',
          email: 'budi@email.com',
          last_sign_in_at: '2026-10-27T05:20:11.000Z',
        },
      },
      error: null,
    })
    mockFrom.mockImplementation(() =>
      qb({ data: profileRow({ avatar_url: 'https://lh3.googleusercontent.com/a/avatar.jpg' }), error: null }),
    )
    const [u1, u2, u3] = await Promise.all([getActiveUser(), getActiveUser(), getActiveUser()])
    expect(mockAuth.getUser).toHaveBeenCalledTimes(1)
    expect(u1).toEqual(u2)
    expect(u2).toEqual(u3)
    expect(u1.avatarUrl).toBe('https://lh3.googleusercontent.com/a/avatar.jpg')
    expect(u1.loggedInAt).toBe('2026-10-27T05:20:11.000Z')
  })
})

describe('registerUser', () => {
  it('memanggil signUp dan mengembalikan user publik', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { user: { id: 'u-1', email: 'budi@email.com' } }, error: null })
    const user = await registerUser({ name: 'Budi Santoso', email: 'budi@email.com', password: 'rahasia123' })
    expect(mockAuth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'budi@email.com',
        password: 'rahasia123',
        options: expect.objectContaining({ data: { name: 'Budi Santoso' } }),
      }),
    )
    expect(user).toEqual(
      expect.objectContaining({ id: 'u-1', email: 'budi@email.com', name: 'Budi Santoso' }),
    )
    expect(user).not.toHaveProperty('password')
  })

  it('melempar error Supabase saat signUp gagal', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { user: null }, error: { message: 'User already registered' } })
    await expect(
      registerUser({ name: 'Budi Santoso', email: 'budi@email.com', password: 'rahasia123' }),
    ).rejects.toThrow()
  })

  it('menolak password kurang dari 8 karakter (validasi klien)', async () => {
    await expect(
      registerUser({ name: 'Budi Santoso', email: 'budi@email.com', password: '123' }),
    ).rejects.toThrow()
  })

  it('menolak email tidak valid (validasi klien)', async () => {
    await expect(
      registerUser({ name: 'Budi Santoso', email: 'bukan-email', password: 'rahasia123' }),
    ).rejects.toThrow()
  })
})

describe('loginUser', () => {
  it('memanggil signInWithPassword dan mengembalikan user', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u-1', email: 'budi@email.com' } },
      error: null,
    })
    mockFrom.mockImplementation(() => qb({ data: profileRow(), error: null }))
    const user = await loginUser('budi@email.com', 'rahasia123')
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'budi@email.com',
      password: 'rahasia123',
    })
    expect(user).toEqual(expect.objectContaining({ email: 'budi@email.com', name: 'Budi Santoso' }))
  })

  it('melempar INVALID_CREDENTIALS saat Supabase error', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })
    await expect(loginUser('budi@email.com', 'salah')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  it('menormalisasi email (trim + lowercase)', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u-1', email: 'budi@email.com' } },
      error: null,
    })
    mockFrom.mockImplementation(() => qb({ data: profileRow(), error: null }))
    await loginUser('  BUDI@Email.com  ', 'rahasia123')
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'budi@email.com',
      password: 'rahasia123',
    })
  })
})

describe('logout', () => {
  it('memanggil signOut', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null })
    await logout()
    expect(mockAuth.signOut).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Pemulihan, ubah password, hapus akun
// ---------------------------------------------------------------------------

describe('requestPasswordReset / updatePassword', () => {
  it('meminta email reset dengan email ternormalisasi dan redirect ke /akun', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
    await requestPasswordReset('  BUDI@Email.com ')
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith(
      'budi@email.com',
      expect.objectContaining({ redirectTo: expect.stringMatching(/\/akun$/) }),
    )
  })

  it('menolak email tidak valid sebelum memanggil Supabase', async () => {
    await expect(requestPasswordReset('bukan-email')).rejects.toThrow()
    expect(mockAuth.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('memperbarui password valid dan menolak password lemah', async () => {
    mockAuth.updateUser.mockResolvedValue({ data: {}, error: null })
    await updatePassword('rahasia123')
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'rahasia123' })

    mockAuth.updateUser.mockClear()
    await expect(updatePassword('abc')).rejects.toThrow()
    await expect(updatePassword('hurufsaja')).rejects.toThrow(/huruf dan angka/i)
    expect(mockAuth.updateUser).not.toHaveBeenCalled()
  })
})

describe('deleteAccount', () => {
  it('memanggil Edge Function delete-account lalu keluar secara lokal', async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null })
    mockAuth.signOut.mockResolvedValue({ error: null })
    await deleteAccount('budi@email.com')
    expect(mockInvoke).toHaveBeenCalledWith('delete-account', { body: { confirmEmail: 'budi@email.com' } })
    expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('meneruskan pesan error dari server dan tidak keluar', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'x',
        context: { json: () => Promise.resolve({ error: 'Email konfirmasi tidak cocok.' }) },
      },
    })
    await expect(deleteAccount('salah@email.com')).rejects.toThrow('Email konfirmasi tidak cocok.')
    expect(mockAuth.signOut).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// OAuth (Google / Facebook)
// ---------------------------------------------------------------------------

describe('loginGoogle / loginFacebook', () => {
  it('memanggil signInWithOAuth dengan provider yang benar', async () => {
    if (!globalThis.window.location) globalThis.window.location = { origin: 'http://localhost:5173' }
    mockAuth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://provider.example' }, error: null })
    await loginGoogle()
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({ redirectTo: expect.any(String) }),
      }),
    )

    mockAuth.signInWithOAuth.mockClear()
    mockAuth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://provider.example' }, error: null })
    await loginFacebook()
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'facebook',
        options: expect.objectContaining({ redirectTo: expect.any(String) }),
      }),
    )
  })

  it('melempar error bila Supabase gagal', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ data: null, error: { message: 'OAuth error' } })
    await expect(loginGoogle()).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Member WismaClub
// ---------------------------------------------------------------------------

describe('getMember', () => {
  it('mengembalikan null bila belum masuk', async () => {
    expect(await getMember()).toBeNull()
  })

  it('mengembalikan record member bila ada', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'u-1', email: 'budi@email.com' } },
      error: null,
    })
    mockFrom.mockImplementation((table) => {
      if (table === 'profiles') return qb({ data: profileRow(), error: null })
      if (table === 'members')
        return qb({
          data: { id: 'm-1', user_id: 'u-1', member_no: 'MC-ABC', name: 'Budi', email: 'budi@email.com' },
          error: null,
        })
      return qb({ data: null, error: null })
    })
    const member = await getMember()
    expect(member).toEqual(expect.objectContaining({ member_no: 'MC-ABC' }))
  })
})

describe('registerMember', () => {
  it('menyisipkan baris ke tabel members bila sudah masuk', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'u-1', email: 'budi@email.com' } },
      error: null,
    })
    mockFrom.mockImplementation((table) => {
      if (table === 'profiles') return qb({ data: profileRow(), error: null })
      if (table === 'members')
        return qb({
          data: {
            id: 'm-1',
            user_id: 'u-1',
            member_no: 'MC-XYZ',
            name: 'Budi Aminah',
            email: 'budi@email.com',
          },
          error: null,
        })
      return qb({ data: null, error: null })
    })
    const member = await registerMember({ name: 'Budi Aminah', email: 'budi@email.com' })
    expect(member).toEqual(expect.objectContaining({ member_no: 'MC-XYZ' }))
  })

  it('melempar error bila belum masuk', async () => {
    await expect(registerMember({ name: 'Budi Aminah', email: 'budi@email.com' })).rejects.toThrow()
  })

  it('menolak payload tidak valid', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'u-1', email: 'budi@email.com' } },
      error: null,
    })
    mockFrom.mockImplementation((table) => {
      if (table === 'profiles') return qb({ data: profileRow(), error: null })
      return qb({ data: null, error: null })
    })
    await expect(registerMember({ name: 'X', email: 'bukan-email' })).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Partner
// ---------------------------------------------------------------------------

describe('getPartners', () => {
  it('mengembalikan array (kosong bila error)', async () => {
    mockFrom.mockImplementation(() => qb({ data: [{ id: 'p-1' }], error: null }))
    expect(await getPartners()).toEqual([{ id: 'p-1' }])
  })

  it('mengembalikan array kosong bila Supabase error', async () => {
    mockFrom.mockImplementation(() => qb({ data: null, error: { message: 'err' } }))
    expect(await getPartners()).toEqual([])
  })
})

describe('registerPartner', () => {
  it('menyisipkan baris ke tabel partners', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'u-1', email: 'budi@email.com' } },
      error: null,
    })
    mockFrom.mockImplementation((table) => {
      if (table === 'profiles') return qb({ data: profileRow(), error: null })
      if (table === 'partners')
        return qb({
          data: {
            id: 'p-1',
            owner_name: 'Budi',
            property_name: 'Wisma Budi',
            city: 'Jakarta',
            email: 'budi@example.com',
          },
          error: null,
        })
      return qb({ data: null, error: null })
    })
    const partner = await registerPartner({
      ownerName: 'Budi',
      propertyName: 'Wisma Budi',
      city: 'Jakarta',
      email: 'budi@example.com',
    })
    expect(partner).toEqual(expect.objectContaining({ id: 'p-1' }))
  })

  it('tetap bisa mendaftar partner tanpa sesi (user_id null)', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    mockFrom.mockImplementation((table) => {
      if (table === 'partners')
        return qb({
          data: {
            id: 'p-2',
            owner_name: 'Anon',
            property_name: 'Wisma Anon',
            city: 'Bandung',
            email: 'anon@example.com',
          },
          error: null,
        })
      return qb({ data: null, error: null })
    })
    const partner = await registerPartner({
      ownerName: 'Anon',
      propertyName: 'Wisma Anon',
      city: 'Bandung',
      email: 'anon@example.com',
    })
    expect(partner).toEqual(expect.objectContaining({ id: 'p-2' }))
  })

  it('melempar error bila insert gagal', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    mockFrom.mockImplementation((table) => {
      if (table === 'partners') return qb({ data: null, error: { message: 'insert failed' } })
      return qb({ data: null, error: null })
    })
    await expect(
      registerPartner({
        ownerName: 'Anon',
        propertyName: 'Wisma Anon',
        city: 'Bandung',
        email: 'anon@example.com',
      }),
    ).rejects.toThrow()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getActiveUser,
  getMember,
  getLastFacebookProfile,
  getLastGoogleProfile,
  getPartners,
  loginFacebook,
  loginGoogle,
  loginUser,
  logout,
  registerMember,
  registerPartner,
  registerUser,
} from './member.js'

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

const { mockAuth, mockFrom, qb } = vi.hoisted(() => {
  const mockAuth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  }
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
  return { mockAuth, mockFrom, qb }
})

vi.mock('../lib/supabase.js', () => ({
  supabase: { auth: mockAuth, from: mockFrom },
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
// OAuth (ditunda)
// ---------------------------------------------------------------------------

describe('loginGoogle / loginFacebook', () => {
  it('melempar OAUTH_NOT_CONFIGURED', async () => {
    await expect(loginGoogle({ name: 'Andi', email: 'andi@gmail.com' })).rejects.toMatchObject({
      code: 'OAUTH_NOT_CONFIGURED',
    })
    await expect(loginFacebook({ name: 'Rina', email: 'rina@facebook.com' })).rejects.toMatchObject({
      code: 'OAUTH_NOT_CONFIGURED',
    })
  })
})

describe('getLastGoogleProfile / getLastFacebookProfile', () => {
  it('mengembalikan null (OAuth belum aktif)', () => {
    expect(getLastGoogleProfile()).toBeNull()
    expect(getLastFacebookProfile()).toBeNull()
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

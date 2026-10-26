import { describe, expect, it } from 'vitest'
import {
  PASSWORD_ALGORITHM,
  PASSWORD_ITERATIONS,
  hashPassword,
  isHashRecord,
  needsRehash,
  verifyPassword,
} from './password.js'

describe('hashPassword', () => {
  it('menghasilkan record PBKDF2 lengkap tanpa menyimpan password asli', async () => {
    const record = await hashPassword('rahasia123')

    expect(record.algo).toBe(PASSWORD_ALGORITHM)
    expect(record.iterations).toBe(PASSWORD_ITERATIONS)
    expect(record.salt).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(record.hash).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(JSON.stringify(record)).not.toContain('rahasia123')
    expect(isHashRecord(record)).toBe(true)
  })

  it('memberi salt berbeda untuk password yang sama', async () => {
    const [a, b] = await Promise.all([hashPassword('rahasia123'), hashPassword('rahasia123')])

    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })
})

describe('verifyPassword', () => {
  it('menerima password yang benar dan menolak yang salah', async () => {
    const record = await hashPassword('rahasia123')

    await expect(verifyPassword('rahasia123', record)).resolves.toBe(true)
    await expect(verifyPassword('rahasia124', record)).resolves.toBe(false)
  })

  it('mendukung record lama berupa plaintext', async () => {
    await expect(verifyPassword('lama123', 'lama123')).resolves.toBe(true)
    await expect(verifyPassword('salah', 'lama123')).resolves.toBe(false)
  })

  it('menolak record rusak tanpa melempar error', async () => {
    const valid = await hashPassword('rahasia123')

    await expect(verifyPassword('rahasia123', null)).resolves.toBe(false)
    await expect(verifyPassword('rahasia123', {})).resolves.toBe(false)
    await expect(verifyPassword('rahasia123', { ...valid, salt: '%%%bukan-base64%%%' })).resolves.toBe(false)
    await expect(verifyPassword('rahasia123', { ...valid, hash: 'QQ' })).resolves.toBe(false)
    await expect(verifyPassword('rahasia123', { ...valid, iterations: 0 })).resolves.toBe(false)
    await expect(verifyPassword('rahasia123', { ...valid, iterations: 9_999_999 })).resolves.toBe(false)
  })
})

describe('needsRehash', () => {
  it('menandai plaintext, record usang, dan record tak dikenal', async () => {
    const valid = await hashPassword('rahasia123')

    expect(needsRehash('plaintext')).toBe(true)
    expect(needsRehash(null)).toBe(true)
    expect(needsRehash({ ...valid, iterations: PASSWORD_ITERATIONS - 1 })).toBe(true)
    expect(needsRehash({ ...valid, algo: 'MD5' })).toBe(true)
    expect(needsRehash(valid)).toBe(false)
  })
})

/**
 * Hashing password untuk mode mock (tanpa backend).
 *
 * CATATAN KEAMANAN
 * ----------------
 * Aplikasi ini tidak punya backend, jadi hash di sini BUKAN pengganti auth
 * produksi. Tujuannya menutup ancaman yang realistis untuk aplikasi demo:
 *
 * - Password tidak lagi terbaca apa adanya di localStorage (DevTools, ekstensi
 *   browser, atau orang lain yang memakai perangkat yang sama).
 * - Password yang sama tidak otomatis membocorkan kredensial situs lain.
 *
 * Yang TIDAK dilindungi (lihat SECURITY.md):
 * - XSS: skrip di halaman tetap bisa memanggil WebCrypto dan menebak password.
 * - Brute force offline: hash bisa diambil lalu ditebak tanpa batas.
 * - Sesi login masih bisa diforge dari DevTools karena tidak ada token server.
 */

// OWASP Password Storage Cheat Sheet: PBKDF2-HMAC-SHA512 minimal 210.000 iterasi.
const ALGORITHM = 'PBKDF2-SHA512'
const ITERATIONS = 210_000
const SALT_BYTES = 16
const HASH_BYTES = 32

/** Batas atas iterasi saat membaca record, agar record yang dimanipulasi tidak membuat browser hang. */
const MAX_ITERATIONS = 2_000_000

export const PASSWORD_ALGORITHM = ALGORITHM
export const PASSWORD_ITERATIONS = ITERATIONS

/** Record hasil hashing. Bentuk inilah yang boleh disimpan di localStorage. */
export const isHashRecord = (value) =>
  Boolean(
    value &&
    typeof value === 'object' &&
    value.algo === ALGORITHM &&
    Number.isInteger(value.iterations) &&
    typeof value.salt === 'string' &&
    typeof value.hash === 'string',
  )

/** Record lama (string plaintext) atau record dengan parameter usang perlu di-hash ulang. */
export const needsRehash = (value) =>
  !isHashRecord(value) || value.algo !== ALGORITHM || value.iterations < ITERATIONS

const getCrypto = () => {
  const cryptoObj = globalThis.crypto
  if (!cryptoObj?.subtle || typeof cryptoObj.getRandomValues !== 'function') {
    const error = new Error('WebCrypto tidak tersedia di lingkungan ini.')
    error.code = 'CRYPTO_UNAVAILABLE'
    throw error
  }
  return cryptoObj
}

const toBase64Url = (bytes) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Perbandingan waktu-konstan: selalu memeriksa semua byte, tidak berhenti di byte pertama yang beda. */
const safeEqual = (a, b) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i]
  return diff === 0
}

const deriveBits = async (password, salt, iterations) => {
  const cryptoObj = getCrypto()
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await cryptoObj.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8,
  )
  return new Uint8Array(bits)
}

/**
 * Hash password baru menjadi record siap simpan.
 * Salt dibuat acak per akun, sehingga dua akun dengan password sama menghasilkan hash berbeda.
 */
export async function hashPassword(password) {
  const cryptoObj = getCrypto()
  const salt = cryptoObj.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await deriveBits(String(password), salt, ITERATIONS)
  return {
    algo: ALGORITHM,
    iterations: ITERATIONS,
    salt: toBase64Url(salt),
    hash: toBase64Url(hash),
  }
}

/**
 * Verifikasi password terhadap record tersimpan.
 * Mendukung record lama berupa string plaintext supaya akun existing tetap bisa login;
 * pemanggil bertanggung jawab meng-upgrade record tersebut (lihat `needsRehash`).
 */
export async function verifyPassword(password, stored) {
  if (typeof stored === 'string') return stored === String(password)
  if (!isHashRecord(stored)) return false
  if (stored.iterations < 1 || stored.iterations > MAX_ITERATIONS) return false

  let salt
  let expected
  try {
    salt = fromBase64Url(stored.salt)
    expected = fromBase64Url(stored.hash)
  } catch {
    return false
  }
  if (expected.length !== HASH_BYTES) return false

  const actual = await deriveBits(String(password), salt, stored.iterations)
  return safeEqual(actual, expected)
}

/**
 * Record decoy statis untuk menyetarakan waktu login.
 *
 * Dipakai saat email tidak terdaftar: verifikasi tetap dijalankan sekali dengan
 * record ini supaya biayanya sama dengan akun asli (mencegah enumerasi akun
 * lewat timing) tanpa perlu menghitung hash tambahan saat aplikasi dimuat.
 *
 * Salt/hash di bawah dihasilkan dari ALGORITHM/ITERATIONS saat ini. Kalau
 * parameternya diubah, record ini harus di-generate ulang — ada test yang
 * menjaga agar nilainya tidak basi.
 */
const DECOY_RECORD = {
  algo: 'PBKDF2-SHA512',
  iterations: 210_000,
  salt: 'P6maBJJbKtr8xfUtZb-2pw',
  hash: 'Vx5VjJ56uaRPGARx45yM16u99F354cBq-LCTIaDcKEA',
}

/** Parameter record decoy, diekspos hanya untuk assertion test. */
export const DECOY_PARAMS = { algo: DECOY_RECORD.algo, iterations: DECOY_RECORD.iterations }

/** Verifikasi terhadap record decoy. Hasilnya selalu diabaikan pemanggil. */
export const verifyAgainstDecoy = (password) => verifyPassword(password, DECOY_RECORD)

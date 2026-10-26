# Keamanan WismaKu

WismaKu memakai **Supabase Auth** untuk autentikasi dan **Row Level Security (RLS)** untuk
isolasi data per pengguna. Dokumen ini menjelaskan apa yang sudah dilindungi, apa yang
belum, dan batas antara "demo yang lebih aman" dengan "sistem yang siap produksi".

## Model ancaman

| Ancaman                                              | Status                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- |
| Orang lain membuka DevTools di perangkat yang sama   | 🟡 Sesi (JWT) tersimpan di localStorage                 |
| Ekstensi browser / skrip yang membaca `localStorage` | 🟡 JWT bisa dicuri → akses sementara                    |
| Password disimpan di klien                           | ✅ Tidak (di-hash Argon2/bcrypt di server)              |
| Brute force lewat UI/console                         | ✅ Dibatasi Supabase (rate limit server)                |
| Brute force offline terhadap hash yang dicuri        | ✅ Tidak berlaku (hash tidak ada di klien)              |
| XSS yang menjalankan kode di halaman                 | ❌ Tetap bisa mencuri JWT dari localStorage             |
| Pemalsuan sesi login dari DevTools                   | 🟡 JWT bisa diforge, tapi signature diverifikasi server |
| Login Google/Facebook                                | ❌ Masih simulasi (belum OAuth sungguhan)               |

## Yang sudah diterapkan

### 1. Autentikasi server-side (Supabase Auth)

- Password di-hash dengan **Argon2** (default Supabase) di server. Klien tidak pernah
  menyimpan, membaca, atau membandingkan password.
- `src/services/password.js` (PBKDF2 lokal) **dihapus** — tidak lagi diperlukan.
- Pendaftaran/login memanggil `supabase.auth.signUp` / `signInWithPassword`.
- Sesi dikelola Supabase client (JWT + refresh token), disimpan di localStorage
  secara otomatis oleh client (bukan oleh kode aplikasi).
- `getActiveUser()` mengambil user dari `supabase.auth.getUser()` (verifikasi
  signature JWT ke server) lalu profil dari tabel `profiles`.

### 2. Row Level Security (RLS)

Semua tabel di schema `public` mengaktifkan RLS. Kebijakan per tabel:

- `cities`, `hotels`, `coupons`, `reviews`: baca publik (anon).
- `profiles`, `members`, `favorites`, `bookings`, `partners`: baca/tulis hanya
  milik sendiri (`auth.uid() = user_id` / `auth.uid() = id`).

Akibatnya, meskipun anon key diekspos di bundle frontend, pengguna tidak bisa
membaca atau mengubah data pengguna lain — server yang menegakkan batas ini.

### 3. Auto-create profil

Trigger `on_auth_user_created` membuat baris di `profiles` setiap kali user baru
terdaftar di `auth.users`, memakai `raw_user_meta_data->>'name'` atau bagian
sebelum `@` dari email. Aplikasi tidak perlu insert profil manual.

### 4. Validasi kredensial di klien

- Email dinormalisasi (`trim` + lowercase) di `UserPayloadSchema`/`LoginPayloadSchema`.
- Password baru: minimal 8 karakter + huruf & angka (validasi klien, bukan keamanan).
- Pesan error generik ("Email atau password salah.") — tidak membedakan "email tidak
  ada" vs "password salah" (mencegah enumerasi akun).

### 5. Identitas provider (Google/Facebook) — simulasi

Login Google/Facebook **belum** memakai OAuth sungguhan. Tombol ditampilkan tapi
disabled dengan tooltip "Segera hadir". Fungsi `loginGoogle`/`loginFacebook`
melempar `OAUTH_NOT_CONFIGURED`. OAuth akan ditambahkan di PR terpisah.

## Yang belum aman (dan batasannya)

1. **JWT di localStorage.** Supabase menyimpan sesi di `localStorage` secara default.
   Skrip XSS bisa mencuri JWT dan menggunakannya sampai expired (1 jam, dengan
   refresh token). Mitigasi: CSP ketat, sanitasi input, dan (untuk produksi) pindah
   ke httpOnly cookie.
2. **XSS tetap menang.** Hashing tidak relevan lagi, tapi XSS tetap bisa mencuri
   sesi. Ini batas yang tidak bisa ditutup dari sisi klien.
3. **OAuth simulasi.** Tidak ada verifikasi identitas Google/Facebook.
4. **Pembayaran tidak diproses.** Status pesanan hanya berubah di state lokal/DB.
5. **Tidak ada admin role.** `getPartners()` hanya mengembalikan milik sendiri;
   belum ada dashboard admin.

## Kalau ingin naik ke produksi

1. ~~Pindahkan autentikasi ke backend~~ ✅ Sudah (Supabase Auth).
2. ~~Ganti sesi lokal dengan token server~~ 🟡 Masih JWT di localStorage; pertimbangkan
   httpOnly cookie + refresh token untuk produksi.
3. ~~Terapkan rate limit di server~~ ✅ Supabase punya rate limit bawaan.
4. Aktifkan OAuth sungguhan untuk Google/Facebook (konfigurasi provider di dashboard).
5. Tambahkan CSP yang ketat (header `Content-Security-Policy`).
6. Tambahkan audit log untuk aksi sensitif (login, booking, dll.).
7. Pertimbangkan MFA (Supabase Auth mendukung TOTP).

## Melaporkan masalah

Menemukan celah? Buka issue privat/security advisory di
<https://github.com/RakensaDwifa/wismaku-demo/security/advisories/new> atau hubungi
pemilik repo langsung. Mohon jangan mempublikasikan detail eksploitasi sebelum ada
kesempatan untuk memperbaikinya.

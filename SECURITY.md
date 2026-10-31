# Keamanan WismaKu

WismaKu memakai **Supabase Auth** untuk autentikasi dan **Row Level Security (RLS)** untuk
isolasi data per pengguna. Dokumen ini menjelaskan apa yang sudah dilindungi, apa yang
belum, dan batas antara "demo yang lebih aman" dengan "sistem yang siap produksi".

## Model ancaman

| Ancaman                                              | Status                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- |
| Orang lain membuka DevTools di perangkat yang sama   | Kuning: sesi (JWT) tersimpan di localStorage            |
| Ekstensi browser / skrip yang membaca `localStorage` | Kuning: JWT bisa dicuri, akses sementara                |
| Password disimpan di klien                           | Hijau: tidak (di-hash Argon2 di server)                 |
| Brute force lewat UI/console                         | Hijau: dibatasi Supabase (rate limit server)            |
| Brute force offline terhadap hash yang dicuri        | Hijau: tidak berlaku (hash tidak ada di klien)          |
| XSS yang menjalankan kode di halaman                 | Merah: tetap bisa mencuri JWT dari localStorage         |
| Pemalsuan sesi login dari DevTools                   | Kuning: JWT bisa diforge, signature diverifikasi server |
| Login Google/Facebook                                | Hijau: OAuth sungguhan via Supabase Auth                |

## Yang sudah diterapkan

### 1. Autentikasi server-side (Supabase Auth)

- Password di-hash dengan **Argon2** (default Supabase) di server. Klien tidak pernah
  menyimpan, membaca, atau membandingkan password.
- `src/services/password.js` (PBKDF2 lokal) **dihapus** — tidak lagi diperlukan.
- Pendaftaran/login memanggil `supabase.auth.signUp` / `signInWithPassword`.
- Login Google/Facebook memanggil `supabase.auth.signInWithOAuth` (redirect ke provider,
  lalu kembali ke app). Profil auto-create via trigger `handle_new_user`.
- Sesi dikelola Supabase client (JWT + refresh token), disimpan di localStorage
  secara otomatis oleh client (bukan oleh kode aplikasi).
- `getActiveUser()` mengambil user dari `supabase.auth.getUser()` (verifikasi
  signature JWT ke server) lalu profil dari tabel `profiles`.

### 2. Row Level Security (RLS)

Semua tabel di schema `public` mengaktifkan RLS, diperkuat dengan migrasi `0002_security_hardening.sql`:

- `cities`, `hotels`, `reviews`: baca publik (anon); `reviews` dibatasi satu ulasan per `(hotel_id, user_id)`.
- `coupons`: baca publik dibatasi hanya untuk kupon yang aktif dan belum kedaluwarsa (`active = true`).
- `profiles`, `members`, `favorites`, `bookings`, `partners`: baca/tulis hanya
  milik sendiri (`auth.uid() = user_id` / `auth.uid() = id`).
- Trigger `profiles_protect_immutable` mengunci kolom `id`, `email`, `provider`, dan `joined_at` dari modifikasi klien.
- Trigger `bookings_enforce_integrity` menghitung ulang `total_price` di server, mencegah perubahan status pesanan yang sudah dibatalkan (`cancelled`), dan melalui migrasi `0003_midtrans_payment.sql` **mengunci status `confirmed` serta kolom pembayaran (`paid_at`, `payment_method`, `snap_token`, `midtrans_order_id`) agar hanya dapat diubah oleh `service_role` di server**.

Akibatnya, meskipun anon key diekspos di bundle frontend, pengguna tidak bisa
membaca atau mengubah data pengguna lain maupun menandai pesanannya lunas secara sepihak dari DevTools.

### 2b. Pembayaran server-side (Midtrans Snap Sandbox + Supabase Edge Functions)

- Pembuatan transaksi Snap (`midtrans-token`) memverifikasi JWT pemilik pesanan dan memanggil API Midtrans menggunakan `MIDTRANS_SERVER_KEY` yang tersimpan eksklusif di Supabase Edge Function Secrets.
- Konfirmasi pelunasan diverifikasi dua jalur di sisi server: sinkron melalui `GET /v2/{order_id}/status` setelah pop-up selesai, serta asinkron melalui webhook `midtrans-webhook` dengan validasi `SHA-512(order_id + status_code + gross_amount + server_key)` secara _constant-time_.

### 3. Auto-create profil

Trigger `on_auth_user_created` membuat baris di `profiles` setiap kali user baru
terdaftar (email/password maupun OAuth), memakai `raw_user_meta_data` (name/full_name/
given_name) atau bagian sebelum `@` dari email. Avatar URL disimpan dari provider.

### 4. Validasi kredensial di klien

- Email dinormalisasi (`trim` + lowercase) di `UserPayloadSchema`/`LoginPayloadSchema`.
- Password baru: minimal 8 karakter + huruf & angka (validasi klien, bukan keamanan).
- Pesan error generik ("Email atau password salah.") — tidak membedakan "email tidak
  ada" vs "password salah" (mencegah enumerasi akun).

## Yang belum aman (dan batasannya)

1. **JWT di localStorage.** Supabase menyimpan sesi di `localStorage` secara default.
   Skrip XSS bisa mencuri JWT dan menggunakannya sampai expired (1 jam, dengan
   refresh token). Mitigasi: CSP ketat, sanitasi input, dan (untuk produksi) pindah
   ke httpOnly cookie.
2. **XSS tetap menang.** Hashing tidak relevan lagi, tapi XSS tetap bisa mencuri
   sesi. Ini batas yang tidak bisa ditutup dari sisi klien.
3. **Pembayaran berjalan di mode Sandbox.** Transaksi diproses melalui Midtrans Snap Sandbox (uang uji coba, bukan rekening produksi).
4. **Tidak ada admin role.** `getPartners()` hanya mengembalikan milik sendiri;
   belum ada dashboard admin.

## Kalau ingin naik ke produksi

1. ~~Pindahkan autentikasi ke backend~~ Sudah (Supabase Auth).
2. ~~Ganti sesi lokal dengan token server~~ Masih JWT di localStorage; pertimbangkan
   httpOnly cookie + refresh token untuk produksi.
3. ~~Terapkan rate limit di server~~ Supabase punya rate limit bawaan.
4. ~~RLS untuk isolasi data per pengguna~~ Aktif di semua tabel.
5. ~~Aktifkan OAuth sungguhan~~ Sudah (Google + Facebook).
6. ~~Tambahkan CSP yang ketat (header `Content-Security-Policy`)~~ Sudah (`vercel.json` + `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
7. ~~Integrasi payment gateway server-side~~ Sudah di mode Sandbox (Midtrans Snap + Edge Functions); ganti endpoint & key ke Midtrans Production saat go-live serta tambahkan audit log terpusat.
8. Pertimbangkan MFA (Supabase Auth mendukung TOTP).

## Melaporkan masalah

Menemukan celah? Buka issue privat/security advisory di
<https://github.com/RakensaDwifa/wismaku-demo/security/advisories/new> atau hubungi
pemilik repo langsung. Mohon jangan mempublikasikan detail eksploitasi sebelum ada
kesempatan untuk memperbaikinya.

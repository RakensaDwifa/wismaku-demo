# Keamanan WismaKu

WismaKu adalah **prototipe demo tanpa backend**. Dokumen ini menjelaskan apa yang sudah
dilindungi, apa yang belum, dan di mana batas antara "demo yang lebih aman" dan
"sistem yang siap produksi".

## Model ancaman

Aplikasi berjalan sepenuhnya di browser. Semua data akun disimpan di `localStorage`,
sehingga tidak ada server yang bisa menegakkan aturan. Karena itu, keamanan di sini
berfokus pada ancaman yang paling realistis untuk demo:

| Ancaman                                              | Status                               |
| ---------------------------------------------------- | ------------------------------------ |
| Orang lain membuka DevTools di perangkat yang sama   | ✅ Ditutup (password ter-hash)       |
| Ekstensi browser / skrip yang membaca `localStorage` | ✅ Ditutup untuk password            |
| Password sama dipakai ulang lalu bocor ke situs lain | ✅ Ditutup (hash, bukan plaintext)   |
| Brute force lewat UI/console                         | 🟡 Dibatasi (5 percobaan / 60 detik) |
| Brute force offline terhadap hash yang dicuri        | ❌ Tidak bisa ditutup tanpa backend  |
| XSS yang menjalankan kode di halaman                 | ❌ Tidak bisa ditutup tanpa backend  |
| Pemalsuan sesi login dari DevTools                   | ❌ Tidak bisa ditutup tanpa backend  |

## Yang sudah diterapkan

### 1. Hashing password (PBKDF2-HMAC-SHA512)

`src/services/password.js`

- Algoritma: PBKDF2-HMAC-SHA512, **210.000 iterasi** (sesuai rekomendasi OWASP Password
  Storage Cheat Sheet untuk SHA-512), output 256 bit.
- **Salt acak 16 byte per akun** dari `crypto.getRandomValues`, bukan salt global.
- Perbandingan hash memakai **constant-time compare** (tidak berhenti di byte pertama
  yang berbeda) untuk mengurangi kebocoran lewat timing.
- Record yang tersimpan berbentuk
  `{ algo, iterations, salt, hash }` dengan encoding base64url.
- Record yang dimanipulasi tetap ditolak: algoritma tak dikenal, hash dengan panjang
  salah, atau jumlah iterasi di luar batas wajar (`> 2.000.000`) tidak akan diverifikasi.
- Bila `crypto.subtle` tidak tersedia (mis. halaman di-serve lewat HTTP non-localhost),
  pendaftaran/login **gagal dengan pesan jelas** — tidak pernah jatuh kembali ke plaintext.

### 2. Password tidak pernah keluar dari service

- `registerUser` mengembalikan objek publik (`id`, `name`, `email`, `joinedAt`) tanpa
  `passwordHash`.
- `localStorage` hanya berisi `passwordHash`; field `password` tidak pernah ditulis lagi.

### 3. Migrasi transparan akun lama

Akun yang dibuat sebelum perbaikan masih menyimpan `password` plaintext. Saat login
pertama yang **berhasil**, record tersebut otomatis ditulis ulang sebagai hash dan field
plaintext dihapus (`upgradePasswordIfNeeded` di `src/services/member.js`). Tidak ada
password yang hilang dan pengguna tidak perlu mendaftar ulang.

### 4. Aturan & validasi kredensial

- Email dinormalisasi (`trim` + lowercase) di schema maupun service, sehingga
  `Budi@Email.com` dan `budi@email.com` dianggap akun yang sama.
- Pendaftaran menolak email duplikat (`EMAIL_TAKEN`) — mencegah dua akun dengan email
  yang sama dan login yang tidak deterministik.
- Password baru: minimal 8 karakter serta memuat huruf dan angka (`UserPayloadSchema`).
- Login **tidak** memaksa 8 karakter, supaya akun lama dengan password lebih pendek
  tetap bisa masuk (`LoginPayloadSchema`).

### 5. Pembatasan percobaan login

- 5 kegagalan berturut-turut untuk satu email → dikunci **60 detik**
  (`MAX_LOGIN_ATTEMPTS`, `LOGIN_LOCK_MS`).
- Catatan percobaan dipangkas otomatis setelah 24 jam agar `localStorage` tidak membengkak.
- Email yang tidak terdaftar tetap menjalankan satu verifikasi hash (dummy) supaya waktu
  responsnya setara dengan email yang ada — mengurangi enumerasi akun lewat timing.

### 6. Pesan error tidak membocorkan akun

- Kredensial salah selalu menghasilkan pesan generik "Email atau password salah."
  (tidak membedakan "email tidak ada" vs "password salah").
- Kode error dari service (`EMAIL_TAKEN`, `ACCOUNT_LOCKED`,
  `CRYPTO_UNAVAILABLE`, `INVALID_CREDENTIALS`) dipetakan ke pesan i18n di `AuthModal`,
  sehingga UI tetap dua bahasa tanpa string hardcoded.

## Yang belum aman (dan tidak bisa diperbaiki di sisi klien)

1. **Tidak ada backend.** Siapa pun yang menguasai perangkat bisa mengubah
   `localStorage` secara langsung: menghapus data, mengubah profil, atau memalsukan sesi
   dengan menulis `wismaku_active_user`.
2. **Hash bisa di-brute-force offline.** Kalau penyerang sudah bisa membaca
   `localStorage`, ia bisa menebak password tanpa batas waktu. PBKDF2 hanya memperlambat,
   bukan mencegah. Password lemah tetap lemah.
3. **XSS tetap menang.** Skrip yang berjalan di halaman bisa memanggil WebCrypto,
   membaca input form, atau mencuri sesi. Hashing tidak menolong di sini.
4. **Login Google/Facebook hanyalah simulasi.** Tidak ada OAuth, tidak ada verifikasi
   identitas, dan tidak ada token.
5. **Pembayaran tidak diproses.** Status pesanan hanya berubah di state lokal.
6. **Rate limit disimpan di klien.** Menghapus `wismaku_login_attempts` dari DevTools
   akan mereset hitungan percobaan. Ini hanya meredam brute force santai, bukan penyerang
   yang serius. Pencatatan dibatasi 50 email terakhir agar tidak membengkakkan
   `localStorage`, dengan entri yang sedang terkunci diprioritaskan.
7. **Identitas Google/Facebook terpisah dari akun email.** Login provider hanya menyimpan
   profil di kunci sendiri (`wismaku_google_profile` / `wismaku_facebook_profile`) tanpa
   verifikasi apa pun. Satu alamat email bisa dipakai di akun email sekaligus profil
   provider, masing-masing dengan jalur login sendiri.

## Kalau ingin naik ke produksi

Urutan yang disarankan:

1. Pindahkan autentikasi ke backend (mis. Supabase Auth atau API sendiri) dan gunakan
   Argon2id/bcrypt di server, bukan PBKDF2 di browser.
2. Ganti sesi lokal dengan token yang ditandatangani server (HTTP-only cookie atau JWT
   berumur pendek) beserta refresh token.
3. Terapkan rate limit dan audit log di server, bukan di klien.
4. Aktifkan OAuth sungguhan untuk Google/Facebook.
5. Tambahkan CSP yang ketat untuk menekan risiko XSS.

## Melaporkan masalah

Menemukan celah? Buka issue privat/security advisory di
<https://github.com/RakensaDwifa/wismaku-demo/security/advisories/new> atau hubungi
pemilik repo langsung. Mohon jangan mempublikasikan detail eksploitasi sebelum ada
kesempatan untuk memperbaikinya.

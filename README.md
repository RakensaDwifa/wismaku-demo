# WismaKu — Website Prototype Penginapan ala RedDoorz

[![CI](https://github.com/RakensaDwifa/wismaku-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/RakensaDwifa/wismaku-demo/actions/workflows/ci.yml)

Website demo tiruan pemesanan penginapan (OTA) dengan tampilan dan alur mirip RedDoorz. Dibangun sebagai proyek pembelajaran frontend: **React + Vite**, arsitektur siap-backend, dan mode mock untuk demo tanpa server.

![Screenshot beranda](screenshots/home.png)

## ⚠️ Catatan Mode Demo

Aplikasi ini adalah **prototipe/demo**, bukan sistem produksi. Yang perlu diketahui sebelum memakainya:

- **Tidak ada backend.** Semua hotel, kota, promo, dan ulasan berasal dari `src/data/`. Data pengguna, favorit, dan pemesanan disimpan di `localStorage` browser.
- **Password disimpan sebagai hash.** Pada mode mock, password di-hash dengan PBKDF2-HMAC-SHA512 + salt acak per akun lewat WebCrypto (lihat `src/services/password.js`). Password asli tidak pernah ditulis ke `localStorage`. Meski begitu, ini **bukan** auth produksi — lihat [SECURITY.md](SECURITY.md).
- **Login Google/Facebook hanya simulasi.** Tidak ada OAuth sama sekali; akun dibuat otomatis di perangkat ini (tombolnya diberi label "Demo").
- **Pembayaran tidak diproses.** Tidak ada transaksi nyata; status pesanan hanya berubah state lokal.
- **Untuk-mode-API sudah disiapkan.** Ubah `VITE_USE_MOCK=false` untuk menghubungkan service (`src/services/*`) ke API backend sungguhan — setiap service sudah punya cabang `request()`.

## Fitur

- Pencarian penginapan: destinasi, tanggal (date range picker), kamar, tamu
- Filter & sortir hasil: amenities, rentang harga, rating, harga/rating
- Halaman detail hotel: galeri foto + lightbox, tipe kamar, ulasan tamu, kebijakan
- Pemesanan dengan kalkulasi harga: kupon diskon, diskon member 10%
- Kupon validasi (misl. `WISMA20`), diskon member WismaClub
- Halaman pemesanan (riwayat + pembatalan) dan halaman favorit
- Pendaftaran member WismaClub & partner penginapan (modal + validasi)
- Mode **mock** (localStorage) atau **API sungguhan** cukup ganti satu env

## Teknologi

| Lapisan  | Pilihan                                   |
| -------- | ----------------------------------------- |
| UI       | React 18, React Router 7, Vite 7          |
| Tanggal  | date-fns, react-day-picker                |
| Validasi | Zod                                       |
| Gaya     | Tailwind CSS v4 (design tokens, @utility) |
| Kualitas | ESLint 10, Prettier 3                     |
| Test     | Vitest 4, Testing Library, jsdom          |

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Mode mock aktif secara default (data lokal + localStorage).

### Konfigurasi lingkungan (`/.env`)

```ini
# true = pakai data lokal (src/data + localStorage), false = panggil API backend
VITE_USE_MOCK=true

# Base URL API backend (kosongkan jika VITE_USE_MOCK=true)
VITE_API_URL=
```

Arsitektur service (`src/services/*`) sudah siap dihubungkan ke API: setiap fungsi
memiliki cabang `request()` untuk mode non-mock.

## Arsitektur

Alur data mengikuti dua lapisan: UI memanggil `hook`, `hook` memanggil `service`,
dan `service` memilih antara data mock lokal atau `request()` ke API backend.

| Lapisan  | Tanggung jawab                       | Lokasi                          |
| -------- | ------------------------------------ | ------------------------------- |
| Pages/UI | Tampilan & interaksi pengguna        | `src/components/`, `src/pages/` |
| Hooks    | Logika state + pemanggilan service   | `src/hooks/`                    |
| Services | Akses data (mock / API) + validasi   | `src/services/`                 |
| Schemas  | Kontrak payload dengan Zod           | `src/schemas/`                  |
| Utils    | Fungsi bantu (format, filter, image) | `src/utils/`                    |
| Data     | Mock data untuk mode demo            | `src/data/`                     |

Setiap service mengekspos fungsi dengan cabang `if (USE_MOCK)` yang membaca/tulis
`localStorage`, dan cabang `request()` yang memanggil API backend melalui `fetch`.

## Struktur Proyek

```
src/
  components/   # Komponen UI (Header, Hero, HotelCard, Modal, ...)
  pages/        # HomePage, HotelDetailPage, BookingsPage, FavoritesPage
  hooks/        # useCatalog (data fetching), useFocusTrap, usePageMeta
  services/     # hotel, booking, favorite, member, password, coupon, api
  data/         # Data mock (hotels, cities, coupons)
  schemas/      # Validasi Zod kontrak payload
  utils/        # searchParams, filtering, format, image
  styles/       # tailwind.css (tokens, @utility btn*, CSS datepicker & slider)
```

## Build & Deploy

```bash
npm run build      # output di dist/
npm run preview    # pratinjau build lokal
npm run lint       # ESLint
npm run test       # Vitest (unit test service/util + component test jsdom)
npm run format     # Prettier
```

CI GitHub Actions (`.github/workflows/ci.yml`) berjalan otomatis pada setiap push/PR ke `main`,
dengan urutan gerbang: `format:check` → `lint` → `test` → `build`.

Deploy produksi ditangani [Vercel](https://vercel.com) lewat integrasi GitHub: push ke `main`
lalu import repo (preset Vite otomatis: build `npm run build`, output `dist/`).
`vercel.json` berisi rewrite agar deep link SPA berfungsi.

## Keamanan

Autentikasi mode mock sudah diperbaiki: password di-hash (PBKDF2-HMAC-SHA512, salt acak per akun),
email duplikat ditolak, dan login dibatasi 5 percobaan per 60 detik. Ringkasan lengkap beserta
batasan yang masih ada ada di [SECURITY.md](SECURITY.md).

## Lisensi

[MIT](LICENSE) © 2026 RakensaDwifa.

## Demo

Tersedia setelah deployment pertama berjalan: `https://wismaku-demo.vercel.app/`

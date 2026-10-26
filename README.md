# WismaKu — Website Prototype Penginapan ala RedDoorz

[![CI](https://github.com/RakensaDwifa/wismaku-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/RakensaDwifa/wismaku-demo/actions/workflows/ci.yml)

Website demo tiruan pemesanan penginapan (OTA) dengan tampilan dan alur mirip RedDoorz. Dibangun sebagai proyek pembelajaran frontend: **React + Vite**, dengan backend **Supabase** (Auth + Postgres + RLS).

![Screenshot beranda](screenshots/home.png)

## ⚠️ Catatan Mode Demo

Aplikasi ini adalah **prototipe/demo**, bukan sistem produksi. Yang perlu diketahui sebelum memakainya:

- **Backend Supabase.** Hotel, kota, kupon, dan ulasan berasal dari Supabase. Data pengguna (favorit, pemesanan, akun) disimpan di Postgres dengan Row Level Security — setiap pengguna hanya bisa mengakses datanya sendiri.
- **Password di-hash di server.** Autentikasi memakai Supabase Auth (Argon2). Password tidak pernah disimpan di klien.
- **Login Google/Facebook belum aktif.** Tombol ditampilkan tapi disabled (OAuth akan ditambahkan nanti). Hanya email/password yang berfungsi.
- **Pembayaran tidak diproses.** Tidak ada transaksi nyata; status pesanan hanya berubah state lokal/DB.
- **Mode mock sudah dihapus.** Aplikasi selalu memakai Supabase; butuh koneksi internet dan env vars yang benar.

## Fitur

- Pencarian penginapan: destinasi, tanggal (date range picker), kamar, tamu
- Filter & sortir hasil: amenities, rentang harga, rating, harga/rating
- Halaman detail hotel: galeri foto + lightbox, tipe kamar, ulasan tamu, kebijakan
- Pemesanan dengan kalkulasi harga: kupon diskon, diskon member 10%
- Kupon validasi (misl. `WISMA20`), diskon member WismaClub
- Halaman pemesanan (riwayat + pembatalan) dan halaman favorit
- Pendaftaran member WismaClub & partner penginapan (modal + validasi)
- Backend Supabase: Auth (email/password), Postgres, RLS per pengguna

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

Buka `http://localhost:5173`.

### Konfigurasi lingkungan (`/.env`)

Salin `.env.example` ke `.env` lalu isi:

```ini
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Variabel di atas wajib. Tanpa keduanya, client Supabase tidak terbentuk dan
aplikasi tidak bisa mengambil data.

### Setup database (sekali, untuk dev baru)

1. Install Supabase CLI: `npm i -g supabase` (butuh Docker untuk `supabase start`).
2. `supabase start` — menjalankan stack lokal (Postgres + Auth + Studio).
3. `npm run seed` — mengisi katalog dari skrip `scripts/seed.mjs` (butuh `SUPABASE_URL` +
   `SUPABASE_SERVICE_ROLE_KEY` di env shell).
4. Atau pakai project remote: set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
   ke project Supabase kamu.

## Arsitektur

Alur data mengikuti tiga lapisan: UI memanggil `hook`, `hook` memanggil `service`,
dan `service` memanggil Supabase (Postgres + Auth) lewat `src/lib/supabase.js`.

| Lapisan  | Tanggung jawab                       | Lokasi                          |
| -------- | ------------------------------------ | ------------------------------- |
| Pages/UI | Tampilan & interaksi pengguna        | `src/components/`, `src/pages/` |
| Hooks    | Logika state + pemanggilan service   | `src/hooks/`                    |
| Services | Akses data (Supabase) + validasi     | `src/services/`                 |
| Schemas  | Kontrak payload dengan Zod           | `src/schemas/`                  |
| Utils    | Fungsi bantu (format, filter, image) | `src/utils/`                    |
| Lib      | Client Supabase singleton            | `src/lib/`                      |

Setiap service memanggil Supabase client; Row Level Security di server yang
menegakkan batas akses per pengguna. Tidak ada lagi cabang `if (USE_MOCK)`.

## Struktur Proyek

```
src/
  components/   # Komponen UI (Header, Hero, HotelCard, Modal, ...)
  pages/        # HomePage, HotelDetailPage, BookingsPage, FavoritesPage
  hooks/        # useCatalog (data fetching), useFocusTrap, usePageMeta
  services/     # hotel, booking, favorite, member, coupon, review
  lib/          # Client Supabase singleton
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

Autentikasi memakai Supabase Auth (Argon2 di server) + RLS per pengguna. Ringkasan
lengkap beserta batasan yang masih ada tercantum di [SECURITY.md](SECURITY.md).

## Lisensi

[MIT](LICENSE) © 2026 RakensaDwifa.

## Demo

Tersedia setelah deployment pertama berjalan: `https://wismaku-demo.vercel.app/`

# Catatan Migrasi Supabase — WismaKu

Project remote: `wxychhupdrwflltvabcs` (`https://wxychhupdrwflltvabcs.supabase.co`).

## Status penerapan

Migrasi `0001`–`0019` **sudah diterapkan** pada database produksi.

- `0009`–`0019` semula dijalankan manual lewat SQL Editor, sehingga tidak tercatat di
  `supabase_migrations.schema_migrations`. Pada 2026-11-17 riwayatnya direkonsiliasi
  dengan `version` = prefix nama file (`0009` … `0019`) agar `supabase db push`
  tidak menjalankannya ulang.
- `0001`, `0002`, dan `0005` tercatat dengan `version` berupa timestamp (warisan
  penerapan awal): `security_hardening`, `reviews_sync_and_verified`, dan
  `0003_midtrans_payment` untuk file `0003`.

## Hal yang perlu diperhatikan

1. **Jangan `db push` tanpa memeriksa riwayat.** Sebagian besar migrasi memakai
   `if not exists`, tetapi beberapa `alter table` lama tidak idempoten.
2. **`0019` bergantung pada `0012`.** Fungsi `enforce_booking_integrity()` versi
   `0019` sengaja mempertahankan aturan RBAC `0012` (kunci `payout_id`,
   `is_admin()`/`is_superadmin()`, aturan transisi status). Jangan menyederhanakan
   fungsi ini tanpa memindahkan aturan tersebut.
3. **`0014_partner_kyc.sql` tidak membuat tabel `partner_kyc`.** Kolom KYC berada
   langsung di tabel `partners` (`kyc_status`, `id_card_number`, `nib_or_npwp`,
   `id_card_url`, `business_doc_url`, `kyc_rejection_reason`, `kyc_submitted_at`,
   `kyc_reviewed_at`) ditambah bucket storage `partner-documents`.
4. **Weekend surcharge** memakai konvensi Jumat & Sabtu malam
   (`extract(dow) in (5, 6)` di SQL, `getDay() === 5 || 6` di JS).
   Kedua sisi harus diubah bersamaan bila definisi akhir pekan berubah.

## Verifikasi cepat

```sql
-- Riwayat 0009–0019 harus lengkap
select version, name from supabase_migrations.schema_migrations
where version between '0009' and '0019' order by version;

-- Fungsi & kolom pendukung
select public.count_weekend_nights('2026-11-20'::date, 2); -- 2 (Jumat + Sabtu)

select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'bookings'
  and column_name in ('original_check_in','original_check_out','reschedule_count',
                      'rescheduled_at','weekend_surcharge_percent');
```

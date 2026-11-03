-- Tambahkan kolom nomor telepon ke public.profiles
alter table public.profiles add column if not exists phone text;

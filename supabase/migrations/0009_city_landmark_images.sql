-- ============================================================================
-- 0009_city_landmark_images.sql
-- Perbarui gambar kota favorit dengan monumen/bangunan terkenal otentik.
-- ============================================================================

update public.cities
set image = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Monumen_Nasional%2C_Jakarta%2C_Indonesia.jpg/960px-Monumen_Nasional%2C_Jakarta%2C_Indonesia.jpg'
where name = 'Jakarta';

update public.cities
set image = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Gedung_Sate_Oktober_2024_-_Rahmatdenas.jpg/960px-Gedung_Sate_Oktober_2024_-_Rahmatdenas.jpg'
where name = 'Bandung';

update public.cities
set image = 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Taman_suroboyo.jpg'
where name = 'Surabaya';

update public.cities
set image = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Jogja_-_Tugu_Monument_%282025%29_-_img_06.jpg/960px-Jogja_-_Tugu_Monument_%282025%29_-_img_06.jpg'
where name = 'Yogyakarta';

update public.cities
set image = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Pura_Ulun_Danu_Bratan%2C_2022.jpg/960px-Pura_Ulun_Danu_Bratan%2C_2022.jpg'
where name = 'Bali';

update public.cities
set image = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/Tugu_Malang.jpg/960px-Tugu_Malang.jpg'
where name = 'Malang';

update public.cities
set image = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Istana_Maimoon.jpg/960px-Istana_Maimoon.jpg'
where name = 'Medan';

update public.cities
set image = 'https://upload.wikimedia.org/wikipedia/commons/b/be/Tugukujang.jpg'
where name = 'Bogor';

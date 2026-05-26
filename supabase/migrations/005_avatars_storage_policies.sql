-- Phase 15: Storage policies untuk bucket avatars
-- Jalankan setelah bucket 'avatars' dibuat di Supabase Dashboard.

-- Drop dulu kalau sudah ada
drop policy if exists "Users can read own avatars" on storage.objects;
drop policy if exists "Users can upload own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;
drop policy if exists "Public can read avatars" on storage.objects;

-- Avatar bisa dibaca publik (untuk ditampilkan di UI)
create policy "Public can read avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- Hanya user yang bisa upload ke folder miliknya sendiri
create policy "Users can upload own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Update (upsert)
create policy "Users can update own avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete
create policy "Users can delete own avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Thumbnail juga perlu bisa dibaca publik (untuk ditampilkan di dashboard)
drop policy if exists "Public can read thumbnails" on storage.objects;

create policy "Public can read thumbnails"
on storage.objects for select
to public
using (bucket_id = 'thumbnails');

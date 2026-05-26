-- Phase 3: Storage policies (run after creating buckets)
--
-- Create buckets in Supabase Dashboard:
-- - assets
-- - thumbnails
--
-- Then run this SQL.

-- Allow authenticated users to manage their own files
create policy "Users can read own assets"
on storage.objects for select
to authenticated
using (
  bucket_id in ('assets', 'thumbnails')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('assets', 'thumbnails')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own assets"
on storage.objects for update
to authenticated
using (
  bucket_id in ('assets', 'thumbnails')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own assets"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('assets', 'thumbnails')
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- =============================================================================
-- Storage buckets and policies for Madinah Dawah Graduates
-- =============================================================================
-- PREREQUISITE: visit the Storage page in the Supabase dashboard at least once
-- so the storage schema is initialized, then run this in the SQL Editor.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('graduate-photos', 'graduate-photos', true,  2 * 1024 * 1024,
    array['image/jpeg','image/png','image/webp']),
  ('report-media',    'report-media',    false, 50 * 1024 * 1024,
    array['image/jpeg','image/png','image/webp',
          'video/mp4','video/webm','video/quicktime',
          'audio/mpeg','audio/mp4','audio/webm','audio/ogg'])
on conflict (id) do nothing;

-- graduate-photos: anyone can read, admin can write
create policy graduate_photos_read on storage.objects
  for select using (bucket_id = 'graduate-photos');
create policy graduate_photos_admin_write on storage.objects
  for all using (bucket_id = 'graduate-photos' and is_admin())
  with check (bucket_id = 'graduate-photos' and is_admin());

-- report-media: admin all; graduate writes under their own graduate-id folder;
--               sponsor of that graduate can read
create policy report_media_admin_all on storage.objects
  for all using (bucket_id = 'report-media' and is_admin())
  with check (bucket_id = 'report-media' and is_admin());

create policy report_media_graduate_write on storage.objects
  for insert with check (
    bucket_id = 'report-media'
    and (storage.foldername(name))[1] = current_graduate_id()::text
  );

create policy report_media_graduate_read on storage.objects
  for select using (
    bucket_id = 'report-media'
    and (storage.foldername(name))[1] = current_graduate_id()::text
  );

create policy report_media_sponsor_read on storage.objects
  for select using (
    bucket_id = 'report-media'
    and sponsor_of(((storage.foldername(name))[1])::uuid)
  );

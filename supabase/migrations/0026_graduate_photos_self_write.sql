-- Let graduates upload their own profile photo from /welcome and /profile.
-- Existing graduate_photos_admin_write policy stays (admin can still upload
-- and manage all photos). Read is already public via graduate_photos_read.
--
-- Scoped to insert only. The codebase generates a fresh random path for each
-- upload (`uploads/<uuid>.<ext>` in src/lib/api.js → uploadGraduatePhoto), so
-- graduates do not need update or delete permission — old photos orphan and
-- can be cleaned up by admin if needed.

drop policy if exists graduate_photos_graduate_insert on storage.objects;
create policy graduate_photos_graduate_insert on storage.objects
  for insert
  with check (
    bucket_id = 'graduate-photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'graduate'
    )
  );

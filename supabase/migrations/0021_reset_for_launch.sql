-- =============================================================================
-- Reset for pilot launch — wipes ALL operational data so the first real
-- graduate + sponsor pair can be onboarded into a clean system.
--
-- KEEPS:
--   - Schema, RLS, functions, indexes (untouched)
--   - Storage buckets (objects cleared manually — see bottom)
--   - auth.users (cleared manually in Supabase Dashboard → Auth → Users)
--   - The admin profile row (so is_admin() keeps working after reset)
--
-- DELETES:
--   - All report_media, activities, reports, graduate_bonus_awards
--   - All sponsorships, sponsors, graduates
--   - All non-admin profiles (prevents orphans tied to old auth users)
--
-- Idempotent. Safe to re-run (second run = no-op, everything already empty).
--
-- NOTE on seed migrations (0003, 0004, 0014, 0015, 0017, 0018, 0019):
-- These populated demo data on initial setup. If you ever bootstrap a FRESH
-- Supabase project, run 0001→0013, 0016, 0020, 0021 and skip the seed ones.
-- On the current live project they've already been applied and will not
-- re-run — this migration just wipes their data.
-- =============================================================================

begin;

-- 1. Wipe all content + relationship tables in FK-safe order.
--    TRUNCATE ... CASCADE inside a single statement handles dependents cleanly.
truncate table
  graduate_bonus_awards,
  report_media,
  activities,
  reports,
  sponsorships,
  sponsors,
  graduates
restart identity cascade;

-- 2. Remove non-admin profile rows so we don't start the pilot with orphan
--    graduate/sponsor profiles tied to auth users we're about to delete.
delete from profiles where role <> 'admin';

-- 3. Verify final state (inspect the result in the SQL editor output).
select 'graduates' as table_name, count(*) as rows from graduates
union all select 'sponsors',              count(*) from sponsors
union all select 'sponsorships',          count(*) from sponsorships
union all select 'reports',               count(*) from reports
union all select 'activities',            count(*) from activities
union all select 'report_media',          count(*) from report_media
union all select 'graduate_bonus_awards', count(*) from graduate_bonus_awards
union all select 'profiles (should be admin only)', count(*) from profiles
union all select 'auth.users (manual cleanup)',     count(*) from auth.users;

commit;

-- =============================================================================
-- MANUAL STEPS AFTER RUNNING THIS MIGRATION
-- =============================================================================
-- a) Supabase Dashboard → Auth → Users
--    Delete every non-admin auth user (old demo accounts).
--    Keep only the admin login(s) you use to manage the system.
--
-- b) Supabase Dashboard → Storage → report-media
--    Select all objects → Delete. (Bucket + its RLS policies stay.)
--    Or SQL (service role):
--      delete from storage.objects where bucket_id = 'report-media';
--
-- c) Supabase Dashboard → Storage → graduate-photos
--    Delete every demo photo. These are public, so they'd otherwise still
--    be reachable via their old URLs.
--      delete from storage.objects where bucket_id = 'graduate-photos';
--
-- After (a)–(c) the system is at zero data and ready for the first real
-- graduate + sponsor invite.
-- =============================================================================

-- =============================================================================
-- Pre-handover cleanup — keeps the 3 test logins (admin, sponsor, graduate)
-- so the founder + admin team can test each role directly. Strips all
-- reports/media/sponsorships so the app is in a clean "ready to use" state.
--
-- Safe to run once. Idempotent (re-runs produce the same clean state).
--
-- WHAT IS KEPT:
--   - auth.users: admin@mdg.test, sponsor@mdg.test, graduate@mdg.test
--   - Their profile rows (with roles admin / sponsor / graduate)
--   - Musa Mohsin's graduate record (still linked to graduate@mdg.test)
--   - Abdullah's sponsor record (still linked to sponsor@mdg.test)
--
-- WHAT IS DELETED:
--   - All reports, activities, and report_media rows
--   - All sponsorships (active + past history)
-- =============================================================================

-- 1. Strip all report media (storage objects cleaned separately — see bottom)
delete from report_media;

-- 2. Strip all activities (cascade from reports would also do this; explicit is clearer)
delete from activities;

-- 3. Strip all reports
delete from reports;

-- 4. Strip all sponsorships
delete from sponsorships;

-- 5. Remove any graduates other than Musa (optional — comment out to keep any you added)
delete from graduates where slug <> 'musa-mohsin';

-- 6. Remove any extra sponsors beyond the test sponsor@mdg.test account
delete from sponsors
where profile_id is null
   or profile_id not in (
      select id from auth.users where email = 'sponsor@mdg.test'
   );

-- 7. Verify the final state
select 'graduates' as table_name, count(*) from graduates
union all select 'sponsors', count(*) from sponsors
union all select 'sponsorships', count(*) from sponsorships
union all select 'reports', count(*) from reports
union all select 'activities', count(*) from activities
union all select 'report_media', count(*) from report_media
union all select 'profiles (logins)', count(*) from profiles
union all select 'auth users', count(*) from auth.users;

-- Expected result:
--   graduates: 1 (Musa only)
--   sponsors: 1 (Abdullah test sponsor)
--   sponsorships: 0
--   reports: 0
--   activities: 0
--   report_media: 0
--   profiles: 3 (admin, sponsor, graduate test accounts)
--   auth users: 3

-- =============================================================================
-- STORAGE CLEANUP (run separately in the Supabase dashboard)
-- =============================================================================
-- Go to Storage in the Supabase dashboard, then:
--   - report-media bucket → select all → Delete (removes old photos/videos/voice notes)
--   - graduate-photos bucket → remove only the test photos you uploaded;
--     keep Musa's official photo if you used a real one
--
-- Or via SQL (requires service_role key from Supabase settings — run carefully):
--   delete from storage.objects where bucket_id = 'report-media';

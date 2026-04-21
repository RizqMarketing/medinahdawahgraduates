-- =============================================================================
-- Seed 15 additional demo sponsors so each active graduate has a unique
-- dedicated sponsor (mirrors the founder's 1-to-1 $290/month model).
--
-- After this:
--   * 16 of the 17 demo graduates have an active sponsorship
--   * Salim Kiwanuka stays status='seeking' (no sponsor yet — to show
--     that UI state)
--   * Dawud Kanteh is still linked to the test sponsor 'Abdullah' so
--     the sponsor@mdg.test login still works as the owner of a real
--     sponsorship
--
-- Sponsors are realistic European/UK-based Muslim names (where most
-- real sponsors come from). Marked with "demo-" slug-style metadata in
-- phone prefix so cleanup is trivial before public launch.
--
-- Safe to re-run — deletes sponsorships + non-test sponsors first.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Clear existing sponsorships and demo sponsors (KEEP the test sponsor
--    row linked to sponsor@mdg.test so the test login still resolves)
-- -----------------------------------------------------------------------------
delete from sponsorships;
delete from sponsors
  where profile_id is null
     or profile_id not in (select id from auth.users where email = 'sponsor@mdg.test');

-- -----------------------------------------------------------------------------
-- 2. Insert 15 new demo sponsors
-- -----------------------------------------------------------------------------
insert into sponsors (full_name, country, phone) values
  ('Omar van der Berg',      'Netherlands',    '+31 6 11112221'),
  ('Yusuf Ahmad',            'United Kingdom', '+44 7911 223301'),
  ('Abdulrahman Bakker',     'Netherlands',    '+31 6 11112222'),
  ('Ismail Durmaz',          'Germany',        '+49 151 22334401'),
  ('Mohammed Kaya',          'Germany',        '+49 151 22334402'),
  ('Ahmed el-Masri',         'Netherlands',    '+31 6 11112223'),
  ('Ibrahim Yilmaz',         'Belgium',        '+32 471 223301'),
  ('Salahuddin Khan',        'United Kingdom', '+44 7911 223302'),
  ('Khalid Mansouri',        'Netherlands',    '+31 6 11112224'),
  ('Tariq Abdullah',         'United Kingdom', '+44 7911 223303'),
  ('Hamza Saleh',            'Netherlands',    '+31 6 11112225'),
  ('Mustafa Hussain',        'United Kingdom', '+44 7911 223304'),
  ('Reda Benyounes',         'France',         '+33 6 12345601'),
  ('Hassan al-Deen',         'Germany',        '+49 151 22334403'),
  ('Ismail Maatougui',       'Netherlands',    '+31 6 11112226');

-- -----------------------------------------------------------------------------
-- 3. Link each demo graduate (except Salim — he stays seeking) to a unique
--    sponsor. Dawud keeps the test sponsor (Abdullah) so the sponsor
--    login flow still owns a live sponsorship.
-- -----------------------------------------------------------------------------
do $$
declare
  test_sponsor_id uuid := (
    select s.id from sponsors s
    join auth.users u on u.id = s.profile_id
    where u.email = 'sponsor@mdg.test'
  );
begin
  -- Test sponsor → Dawud Kanteh
  insert into sponsorships (graduate_id, sponsor_id, monthly_amount_usd, started_on, status)
  values (
    (select id from graduates where slug = 'demo-dawud-kanteh'),
    test_sponsor_id,
    290,
    (current_date - interval '4 months')::date,
    'active'
  );

  -- The other 15 sponsorships — each demo sponsor → unique graduate
  insert into sponsorships (graduate_id, sponsor_id, monthly_amount_usd, started_on, status)
  select
    g.id,
    s.id,
    290,
    (current_date - interval '1 month' * ((random() * 6)::int + 1))::date,
    'active'
  from (
    -- Pair graduates with sponsors by position. Skip Salim (seeking) and
    -- Dawud (already linked to test sponsor above).
    select g.id, row_number() over (order by g.created_at) as rn
    from graduates g
    where g.slug like 'demo-%'
      and g.slug not in ('demo-salim-kiwanuka', 'demo-dawud-kanteh')
  ) g
  join (
    select s.id, row_number() over (order by s.created_at) as rn
    from sponsors s
    where s.id <> test_sponsor_id
  ) s on s.rn = g.rn;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Sanity check
-- -----------------------------------------------------------------------------
select
  'sponsors'     as thing, count(*)::text as n from sponsors
union all select 'sponsorships (active)', count(*)::text from sponsorships where status = 'active'
union all select 'graduates (active)',    count(*)::text from graduates where status = 'active'
union all select 'graduates (seeking)',   count(*)::text from graduates where status = 'seeking';

-- =============================================================================
-- Demo seed — wipes all graduate/sponsor/report data (KEEPS the 3 test logins)
-- and seeds 17 demo graduates with varied reports across the current month.
-- Built so the founder's team can tour every dashboard feature:
--   * 132-hour leaderboard — some hit the target, some don't
--   * Low teaching ratio alert — one graduate simulates the mosque-construction case
--   * Silent graduates modal — one graduate submitted no reports
--   * Umrah teaching category — one graduate led an Umrah group this month
-- -----------------------------------------------------------------------------
-- ⚠ DEMO DATA — delete before sharing publicly. Replace with real graduates
-- from the founder's Telegram channel before handover.
-- -----------------------------------------------------------------------------
-- Pre-requisites:
--   * Migrations 0001–0013 must be applied (0013 adds the `category` column)
--   * auth.users must contain admin@mdg.test / sponsor@mdg.test / graduate@mdg.test
-- Safe to re-run (fully idempotent — wipes first, then re-seeds).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Wipe everything except auth users + their profile rows
-- -----------------------------------------------------------------------------
delete from report_media;
delete from activities;
delete from reports;
delete from sponsorships;
delete from graduates;
delete from sponsors;

-- -----------------------------------------------------------------------------
-- 2. Seed 17 demo graduates
--    slug prefix "demo-" makes it trivial to clean up later:
--        delete from graduates where slug like 'demo-%';
-- -----------------------------------------------------------------------------
insert into graduates
  (slug, full_name, country, university, graduation_year, graduation_month,
   duration_years, gpa, focus_areas, story, teaching_location, status, target_hours_monthly)
values
  ('demo-ibrahim-kamara', 'Ibrahim Kamara', 'Sierra Leone', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.82, '{"Quran","Tajweed"}',
    'Demo profile — replace with real graduate before public launch. Teaches Quran and Tajweed in Freetown.',
    'Freetown', 'active', 132),

  ('demo-yusuf-sesay', 'Yusuf Sesay', 'Sierra Leone', 'Islamic University of Madinah',
    2023, 5, 5.0, 4.65, '{"Fiqh","Aqeedah"}',
    'Demo profile — replace with real graduate. Weekly halaqah and community teaching.',
    'Bo', 'active', 132),

  ('demo-abdullah-konate', 'Abdullah Konate', 'Guinea', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.70, '{"Fiqh","Tafsir"}',
    'Demo profile — replace with real graduate. Daily dars and Friday khutbah.',
    'Conakry', 'active', 132),

  ('demo-musa-bangura', 'Musa Bangura', 'Gambia', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.55, '{"Tawheed","Hadith"}',
    'Demo profile — replace with real graduate. Tawheed lessons for new students.',
    'Banjul', 'active', 132),

  ('demo-isa-jallow', 'Isa Jallow', 'Gambia', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.88, '{"Quran","Tafsir","Aqeedah"}',
    'Demo profile — replace with real graduate. This profile is linked to the test graduate login.',
    'Serekunda', 'active', 132),

  ('demo-bilal-mwangi', 'Bilal Mwangi', 'Kenya', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.60, '{"Quran","Tajweed"}',
    'Demo profile — replace with real graduate. Tajweed instructor in a local masjid.',
    'Mombasa', 'active', 132),

  ('demo-umar-diallo', 'Umar Diallo', 'Mali', 'Islamic University of Madinah',
    2022, 6, 5.0, 4.45, '{"Fiqh"}',
    'Demo profile — replace with real graduate. Fiqh madrasa and Friday community role.',
    'Bamako', 'active', 132),

  ('demo-hassan-traore', 'Hassan Traore', 'Burkina Faso', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.78, '{"Aqeedah","Dawah"}',
    'Demo profile — replace with real graduate. Aqeedah classes and village outreach.',
    'Bobo-Dioulasso', 'active', 132),

  ('demo-idris-sow', 'Idris Sow', 'Senegal', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.30, '{"Tafsir"}',
    'Demo profile — replace with real graduate. Weekly tafsir class.',
    'Dakar', 'active', 132),

  ('demo-ali-ouedraogo', 'Ali Ouedraogo', 'Ivory Coast', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.50, '{"Quran","Fiqh"}',
    'Demo profile — replace with real graduate. Children''s Quran school.',
    'Abidjan', 'active', 132),

  ('demo-khalid-ntare', 'Khalid Ntare', 'Uganda', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.40, '{"Aqeedah","Tafsir"}',
    'Demo profile — replace with real graduate. Weekly lectures in English and Luganda.',
    'Kampala', 'active', 132),

  ('demo-uthman-mbaye', 'Uthman Mbaye', 'Senegal', 'Islamic University of Madinah',
    2022, 6, 5.0, 4.72, '{"Fiqh","Hadith"}',
    'Demo profile — replace with real graduate. Hadith lessons and imamship.',
    'Thies', 'active', 132),

  ('demo-zaid-diop', 'Zaid Diop', 'Senegal', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.58, '{"Quran"}',
    'Demo profile — replace with real graduate. Memorisation circles for youth.',
    'Saint-Louis', 'active', 132),

  ('demo-salim-kiwanuka', 'Salim Kiwanuka', 'Uganda', 'Islamic University of Madinah',
    2025, 2, 5.5, 4.65, '{"Tajweed","Tafsir"}',
    'Demo profile — replace with real graduate. Just returned from Madinah, still getting established.',
    'Jinja', 'seeking', 132),

  ('demo-dawud-kanteh', 'Dawud Kanteh', 'Gambia', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.85, '{"Fiqh","Aqeedah","Dawah"}',
    'Demo profile — replace with real graduate. This profile is linked to the test sponsor login.',
    'Brikama', 'active', 132),

  ('demo-harun-sisay', 'Harun Sisay', 'Sierra Leone', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.40, '{"Fiqh"}',
    'Demo profile — replace with real graduate. Spends most of his time supervising a new masjid build — good example of the low-teaching-ratio alert.',
    'Kenema', 'active', 132),

  ('demo-sulayman-njie', 'Sulayman Njie', 'Gambia', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.50, '{"Quran"}',
    'Demo profile — replace with real graduate. No reports yet this month — demonstrates the silent-graduate alert.',
    'Farafenni', 'active', 132);

-- -----------------------------------------------------------------------------
-- 3. Re-link test logins to demo graduates/sponsors
-- -----------------------------------------------------------------------------
update graduates
set profile_id = (select id from auth.users where email = 'graduate@mdg.test')
where slug = 'demo-isa-jallow';

insert into sponsors (profile_id, full_name, country, phone)
select id, 'Abdullah (test sponsor)', 'Netherlands', '+31 6 12345678'
from auth.users where email = 'sponsor@mdg.test'
on conflict (profile_id) do update
  set full_name = excluded.full_name,
      country   = excluded.country,
      phone     = excluded.phone;

insert into sponsorships (graduate_id, sponsor_id, monthly_amount_usd, started_on, status)
select
  (select id from graduates where slug = 'demo-dawud-kanteh'),
  (select s.id from sponsors s
     join auth.users u on u.id = s.profile_id
    where u.email = 'sponsor@mdg.test'),
  290,
  (current_date - interval '4 months')::date,
  'active';

-- -----------------------------------------------------------------------------
-- 4. Generate varied daily reports for each graduate in the current month.
--    Tiers (encoded by slug):
--      high_performer — ~22 active days, ~6 hrs/day, mostly teaching      → ≥132
--      mid_performer  — ~16 active days, ~5 hrs/day                       → ~80
--      low_performer  — ~9  active days, ~4 hrs/day                       → ~35
--      low_ratio      — ~18 active days, mostly 'other' (construction)    → alert
--      silent         — 0 reports                                         → silent
--      seeking        — 0 reports                                         → silent (but status='seeking')
-- -----------------------------------------------------------------------------
do $$
declare
  g record;
  tier text;
  d date;
  report_id uuid;
  first_of_month date := date_trunc('month', current_date)::date;
  days_so_far int := (current_date - first_of_month)::int + 1;
  pos int;
  hrs numeric;
  cat text;
  act_type text;
  students int;
  loc text;
  should_report boolean;
begin
  for g in select id, slug, full_name, teaching_location from graduates where slug like 'demo-%' loop

    -- Map slug → tier
    tier := case g.slug
      when 'demo-ibrahim-kamara'  then 'high'
      when 'demo-abdullah-konate' then 'high'
      when 'demo-isa-jallow'      then 'high'
      when 'demo-bilal-mwangi'    then 'high'
      when 'demo-hassan-traore'   then 'high'
      when 'demo-uthman-mbaye'    then 'high'
      when 'demo-dawud-kanteh'    then 'high'
      when 'demo-yusuf-sesay'     then 'mid'
      when 'demo-musa-bangura'    then 'mid'
      when 'demo-umar-diallo'     then 'mid'
      when 'demo-ali-ouedraogo'   then 'mid'
      when 'demo-khalid-ntare'    then 'mid'
      when 'demo-zaid-diop'       then 'mid'
      when 'demo-idris-sow'       then 'low'
      when 'demo-salim-kiwanuka'  then 'silent'
      when 'demo-harun-sisay'     then 'low_ratio'
      when 'demo-sulayman-njie'   then 'silent'
    end;

    -- Silent tiers produce no reports
    continue when tier = 'silent';

    -- Loop through days of the current month up to today
    for day_offset in 0 .. days_so_far - 1 loop
      d := first_of_month + day_offset;

      -- Decide whether to report that day based on tier density
      should_report := case tier
        when 'high'      then random() < 0.78
        when 'mid'       then random() < 0.55
        when 'low'       then random() < 0.32
        when 'low_ratio' then random() < 0.64
      end;
      continue when not should_report;

      insert into reports (graduate_id, report_date, location, overall_text, status, submitted_at)
      values (
        g.id, d, g.teaching_location,
        'Demo report entry — alhamdulillah, another day of teaching by Allah''s tawfeeq.',
        'submitted', (d + interval '19 hours')
      ) returning id into report_id;

      pos := 0;

      -- Tier-specific activity patterns
      if tier = 'high' then
        -- Two teaching sessions + occasional dawah
        hrs := 2.5 + (random() * 1.5);
        insert into activities (report_id, activity_type, category, hours, students_count, location, position, notes)
        values (report_id, 'Tajweed lesson', 'teaching', hrs, 12 + (random() * 18)::int, g.teaching_location, pos, 'Morning halaqah');
        pos := pos + 1;

        hrs := 2.0 + (random() * 1.5);
        insert into activities (report_id, activity_type, category, hours, students_count, location, position, notes)
        values (report_id, 'Fiqh class', 'teaching', hrs, 15 + (random() * 15)::int, g.teaching_location, pos, 'Afternoon dars');
        pos := pos + 1;

        if random() < 0.3 then
          insert into activities (report_id, activity_type, category, hours, students_count, location, position)
          values (report_id, 'Village visit', 'dawah', 1.5, 25, 'Nearby village', pos);
        end if;

      elsif tier = 'mid' then
        hrs := 2.5 + (random() * 1.0);
        insert into activities (report_id, activity_type, category, hours, students_count, location, position)
        values (report_id, 'Quran memorisation', 'teaching', hrs, 8 + (random() * 10)::int, g.teaching_location, pos);
        pos := pos + 1;

        if random() < 0.4 then
          hrs := 1.5 + (random() * 1.0);
          insert into activities (report_id, activity_type, category, hours, students_count, location, position)
          values (report_id, 'One-on-one teaching', 'teaching', hrs, 1, g.teaching_location, pos);
          pos := pos + 1;
        end if;

        if random() < 0.25 then
          insert into activities (report_id, activity_type, category, hours, students_count, location, position)
          values (report_id, 'Community lecture', 'dawah', 1.5, 30 + (random() * 30)::int, g.teaching_location, pos);
        end if;

      elsif tier = 'low' then
        hrs := 2.0 + (random() * 1.5);
        insert into activities (report_id, activity_type, category, hours, students_count, location, position)
        values (report_id, 'Tajweed lesson', 'teaching', hrs, 6 + (random() * 8)::int, g.teaching_location, pos);

      elsif tier = 'low_ratio' then
        -- Mostly construction supervision (the founder's example)
        hrs := 4.0 + (random() * 2.0);
        insert into activities (
          report_id, activity_type, category, hours, location, position, notes
        ) values (
          report_id, 'Masjid construction supervision', 'other', hrs,
          'Local building site', pos,
          'Overseeing the new masjid build — not aligned with the teaching mandate.'
        );
        pos := pos + 1;

        -- Small teaching component
        if random() < 0.6 then
          insert into activities (report_id, activity_type, category, hours, students_count, location, position)
          values (report_id, 'Tajweed lesson', 'teaching', 0.5, 6, g.teaching_location, pos);
        end if;
      end if;

    end loop;  -- end day loop

    -- Give one or two "high" graduates an Umrah-teaching entry to showcase that category
    if g.slug in ('demo-uthman-mbaye', 'demo-dawud-kanteh') then
      -- Mid-month, led a group
      d := first_of_month + 14;
      -- Delete any existing report on this day so we can insert cleanly
      delete from reports where graduate_id = g.id and report_date = d;

      insert into reports (graduate_id, report_date, location, overall_text, status, submitted_at)
      values (
        g.id, d, 'Makkah',
        'Led an Umrah group this week — taught the rites in detail during the trip. Alhamdulillah.',
        'submitted', d + interval '20 hours'
      ) returning id into report_id;

      insert into activities (report_id, activity_type, category, hours, students_count, location, position, notes)
      values (report_id, 'Umrah group teaching', 'umrah_teaching', 5.0, 14, 'Makkah', 0,
              'Taught the rites of Umrah and sunnahs of travel to the group throughout the trip.');
    end if;

  end loop;  -- end graduate loop
end $$;

-- -----------------------------------------------------------------------------
-- 5. Final sanity check — dump a summary so you can eyeball the seed ran
-- -----------------------------------------------------------------------------
select
  'graduates'                          as thing, count(*)::text as n from graduates
union all select 'sponsors',            count(*)::text          from sponsors
union all select 'sponsorships',        count(*)::text          from sponsorships
union all select 'reports',             count(*)::text          from reports
union all select 'activities',          count(*)::text          from activities
union all select 'teaching activities', count(*)::text          from activities where category = 'teaching'
union all select 'dawah activities',    count(*)::text          from activities where category = 'dawah'
union all select 'umrah-teaching',      count(*)::text          from activities where category = 'umrah_teaching'
union all select 'other (not counted)', count(*)::text          from activities where category = 'other';

-- =============================================================================
-- Arabic demo seed — wipes all graduate/sponsor/report data (KEEPS the 3 test
-- logins) and reseeds with Arabic stories + activity types + report text.
--
-- Replaces 0014 + 0015 for a realistic preview: the founder's real graduates
-- from IUM West/East Africa will type in Arabic, so the demo should too.
-- Graduate names stay in Latin transliteration (that's how real names appear
-- on passports and documents). City names stay Latin (universally recognised).
--
-- After running this, the app in EN mode shows English chrome + Arabic user
-- content (exactly how a sponsor will see their graduate's Arabic report).
-- The app in AR mode shows everything in Arabic end-to-end.
--
-- Activity types use Arabic strings that the subjects.js regexes recognise
-- (تجويد / فقه / قرآن / عمرة / زيارة / مجتمع) so the sponsor-dashboard
-- subject breakdown still groups correctly.
--
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
-- 2. Seed 17 demo graduates with Arabic stories
-- -----------------------------------------------------------------------------
insert into graduates
  (slug, full_name, country, university, graduation_year, graduation_month,
   duration_years, gpa, focus_areas, story, teaching_location, status, target_hours_monthly)
values
  ('demo-ibrahim-kamara', 'Ibrahim Kamara', 'Sierra Leone', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.82, '{"القرآن","التجويد"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي قبل الإطلاق. يُعلِّم القرآن والتجويد في فريتاون.',
    'Freetown', 'active', 132),

  ('demo-yusuf-sesay', 'Yusuf Sesay', 'Sierra Leone', 'Islamic University of Madinah',
    2023, 5, 5.0, 4.65, '{"الفقه","العقيدة"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. حلقة أسبوعية وتعليم مجتمعي.',
    'Bo', 'active', 132),

  ('demo-abdullah-konate', 'Abdullah Konate', 'Guinea', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.70, '{"الفقه","التفسير"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. درس يومي وخطبة الجمعة.',
    'Conakry', 'active', 132),

  ('demo-musa-bangura', 'Musa Bangura', 'Gambia', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.55, '{"التوحيد","الحديث"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. دروس توحيد للطلاب الجدد.',
    'Banjul', 'active', 132),

  ('demo-isa-jallow', 'Isa Jallow', 'Gambia', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.88, '{"القرآن","التفسير","العقيدة"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. هذا الملف مربوط بحساب الخريج التجريبي.',
    'Serekunda', 'active', 132),

  ('demo-bilal-mwangi', 'Bilal Mwangi', 'Kenya', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.60, '{"القرآن","التجويد"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. مدرّس تجويد في مسجد محلي.',
    'Mombasa', 'active', 132),

  ('demo-umar-diallo', 'Umar Diallo', 'Mali', 'Islamic University of Madinah',
    2022, 6, 5.0, 4.45, '{"الفقه"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. مدرسة فقه وإمامة الجمعة.',
    'Bamako', 'active', 132),

  ('demo-hassan-traore', 'Hassan Traore', 'Burkina Faso', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.78, '{"العقيدة","الدعوة"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. دروس عقيدة ودعوة في القرى.',
    'Bobo-Dioulasso', 'active', 132),

  ('demo-idris-sow', 'Idris Sow', 'Senegal', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.30, '{"التفسير"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. درس تفسير أسبوعي.',
    'Dakar', 'active', 132),

  ('demo-ali-ouedraogo', 'Ali Ouedraogo', 'Ivory Coast', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.50, '{"القرآن","الفقه"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. مدرسة قرآن للأطفال.',
    'Abidjan', 'active', 132),

  ('demo-khalid-ntare', 'Khalid Ntare', 'Uganda', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.40, '{"العقيدة","التفسير"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. محاضرات أسبوعية بالإنجليزية واللوغاندية.',
    'Kampala', 'active', 132),

  ('demo-uthman-mbaye', 'Uthman Mbaye', 'Senegal', 'Islamic University of Madinah',
    2022, 6, 5.0, 4.72, '{"الفقه","الحديث"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. دروس حديث وإمامة.',
    'Thies', 'active', 132),

  ('demo-zaid-diop', 'Zaid Diop', 'Senegal', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.58, '{"القرآن"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. حلقات تحفيظ للشباب.',
    'Saint-Louis', 'active', 132),

  ('demo-salim-kiwanuka', 'Salim Kiwanuka', 'Uganda', 'Islamic University of Madinah',
    2025, 2, 5.5, 4.65, '{"التجويد","التفسير"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. عاد لتوّه من المدينة، ما زال يؤسس عمله.',
    'Jinja', 'seeking', 132),

  ('demo-dawud-kanteh', 'Dawud Kanteh', 'Gambia', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.85, '{"الفقه","العقيدة","الدعوة"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. هذا الملف مربوط بحساب الكافل التجريبي.',
    'Brikama', 'active', 132),

  ('demo-harun-sisay', 'Harun Sisay', 'Sierra Leone', 'Islamic University of Madinah',
    2023, 6, 5.0, 4.40, '{"الفقه"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. يقضي معظم وقته في الإشراف على بناء مسجد جديد — مثال جيد على تنبيه «نسبة التدريس المنخفضة».',
    'Kenema', 'active', 132),

  ('demo-sulayman-njie', 'Sulayman Njie', 'Gambia', 'Islamic University of Madinah',
    2024, 6, 5.5, 4.50, '{"القرآن"}',
    'ملف تجريبي — يُستبدل بخريج حقيقي. لا توجد تقارير هذا الشهر — لإظهار تنبيه الخريج الصامت.',
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
-- 4. Generate varied daily reports in Arabic for each graduate.
--    Covers current month through today (subsumes what 0014 + 0015 did).
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

    continue when tier = 'silent';

    -- Loop through days of the current month up to today
    for day_offset in 0 .. days_so_far - 1 loop
      d := first_of_month + day_offset;

      should_report := case tier
        when 'high'      then random() < 0.78
        when 'mid'       then random() < 0.55
        when 'low'       then random() < 0.32
        when 'low_ratio' then random() < 0.64
      end;

      -- Today's report is guaranteed for non-silent tiers so the demo
      -- always has fresh activity on day one.
      if d = current_date then should_report := true; end if;

      continue when not should_report;

      insert into reports (graduate_id, report_date, location, overall_text, status, submitted_at)
      values (
        g.id, d, g.teaching_location,
        'تقرير تجريبي — الحمد لله، يومٌ آخر من التعليم بتوفيق الله.',
        'submitted', (d + interval '19 hours')
      ) returning id into report_id;

      pos := 0;

      if tier = 'high' then
        hrs := 2.5 + (random() * 1.5);
        insert into activities (report_id, activity_type, category, hours, students_count, location, position, notes)
        values (report_id, 'درس تجويد', 'teaching', hrs, 12 + (random() * 18)::int, g.teaching_location, pos, 'حلقة صباحية');
        pos := pos + 1;

        hrs := 2.0 + (random() * 1.5);
        insert into activities (report_id, activity_type, category, hours, students_count, location, position, notes)
        values (report_id, 'درس فقه', 'teaching', hrs, 15 + (random() * 15)::int, g.teaching_location, pos, 'درس بعد العصر');
        pos := pos + 1;

        if random() < 0.3 then
          insert into activities (report_id, activity_type, category, hours, students_count, location, position)
          values (report_id, 'زيارة قرية', 'dawah', 1.5, 25, 'قرية مجاورة', pos);
        end if;

      elsif tier = 'mid' then
        hrs := 2.5 + (random() * 1.0);
        insert into activities (report_id, activity_type, category, hours, students_count, location, position)
        values (report_id, 'تحفيظ قرآن', 'teaching', hrs, 8 + (random() * 10)::int, g.teaching_location, pos);
        pos := pos + 1;

        if random() < 0.4 then
          hrs := 1.5 + (random() * 1.0);
          insert into activities (report_id, activity_type, category, hours, students_count, location, position)
          values (report_id, 'تعليم فردي', 'teaching', hrs, 1, g.teaching_location, pos);
          pos := pos + 1;
        end if;

        if random() < 0.25 then
          insert into activities (report_id, activity_type, category, hours, students_count, location, position)
          values (report_id, 'محاضرة مجتمعية', 'dawah', 1.5, 30 + (random() * 30)::int, g.teaching_location, pos);
        end if;

      elsif tier = 'low' then
        hrs := 2.0 + (random() * 1.5);
        insert into activities (report_id, activity_type, category, hours, students_count, location, position)
        values (report_id, 'درس تجويد', 'teaching', hrs, 6 + (random() * 8)::int, g.teaching_location, pos);

      elsif tier = 'low_ratio' then
        hrs := 4.0 + (random() * 2.0);
        insert into activities (
          report_id, activity_type, category, hours, location, position, notes
        ) values (
          report_id, 'الإشراف على بناء المسجد', 'other', hrs,
          'موقع البناء', pos,
          'الإشراف على بناء المسجد الجديد — لا ينسجم مع مهمة التعليم.'
        );
        pos := pos + 1;

        if random() < 0.6 then
          insert into activities (report_id, activity_type, category, hours, students_count, location, position)
          values (report_id, 'درس تجويد', 'teaching', 0.5, 6, g.teaching_location, pos);
        end if;
      end if;

    end loop;

    -- Give one or two "high" graduates an Umrah-teaching entry to showcase that category
    if g.slug in ('demo-uthman-mbaye', 'demo-dawud-kanteh') then
      d := first_of_month + 14;
      delete from reports where graduate_id = g.id and report_date = d;

      insert into reports (graduate_id, report_date, location, overall_text, status, submitted_at)
      values (
        g.id, d, 'Makkah',
        'قُدت مجموعة عمرة هذا الأسبوع — علّمتهم المناسك بالتفصيل خلال الرحلة. الحمد لله.',
        'submitted', d + interval '20 hours'
      ) returning id into report_id;

      insert into activities (report_id, activity_type, category, hours, students_count, location, position, notes)
      values (report_id, 'تعليم في العمرة', 'umrah_teaching', 5.0, 14, 'Makkah', 0,
              'علّمتُ المجموعة مناسك العمرة وسنن السفر طوال الرحلة.');
    end if;

  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Sanity check
-- -----------------------------------------------------------------------------
select
  'graduates'                          as thing, count(*)::text as n from graduates
union all select 'sponsors',            count(*)::text          from sponsors
union all select 'sponsorships',        count(*)::text          from sponsorships
union all select 'reports',             count(*)::text          from reports
union all select 'reports today',       count(*)::text          from reports where report_date = current_date
union all select 'activities',          count(*)::text          from activities
union all select 'teaching activities', count(*)::text          from activities where category = 'teaching'
union all select 'dawah activities',    count(*)::text          from activities where category = 'dawah'
union all select 'umrah-teaching',      count(*)::text          from activities where category = 'umrah_teaching'
union all select 'other (not counted)', count(*)::text          from activities where category = 'other';

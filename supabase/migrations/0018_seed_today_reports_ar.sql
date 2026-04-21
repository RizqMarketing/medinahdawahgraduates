-- =============================================================================
-- Top up demo reports for TODAY (current_date), Arabic version.
--
-- 0017 generated reports through the date it was run. Now we've rolled into
-- a new day and today is empty. This migration adds a report for each
-- non-silent demo graduate for today, matching the same tier pattern as
-- 0017 with Arabic activity types + overall_text.
--
-- Safe to re-run: skips graduates who already have a report for today.
-- =============================================================================

do $$
declare
  g record;
  tier text;
  report_id uuid;
  pos int;
  hrs numeric;
  has_report boolean;
begin
  for g in select id, slug, full_name, teaching_location from graduates where slug like 'demo-%' loop

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

    -- Skip if already reported today
    select exists (
      select 1 from reports
      where graduate_id = g.id and report_date = current_date
    ) into has_report;
    continue when has_report;

    insert into reports (graduate_id, report_date, location, overall_text, status, submitted_at)
    values (
      g.id, current_date, g.teaching_location,
      'تقرير تجريبي — الحمد لله، يومٌ آخر من التعليم بتوفيق الله.',
      'submitted', (current_date + interval '19 hours')
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
end $$;

-- Sanity check
select
  count(*) filter (where r.report_date = current_date) as reports_today,
  count(distinct r.graduate_id) filter (where r.report_date = current_date) as graduates_reported_today
from reports r
join graduates g on g.id = r.graduate_id
where g.slug like 'demo-%';

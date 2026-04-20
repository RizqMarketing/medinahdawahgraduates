-- =============================================================================
-- Top up the demo seed with reports for TODAY (current_date), so the founder's
-- team sees fresh activity the day they open the app for the first time.
--
-- Unlike 0014, this migration is additive — it does not wipe existing data.
-- Reports are only inserted for demo graduates who don't already have one
-- for today, following the same tier pattern as 0014.
--
-- Safe to re-run: `on conflict do nothing` on the (graduate_id, report_date)
-- pair via an existence check means double-running won't create duplicates.
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

    -- Same tier mapping as 0014
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

    -- Silent tiers stay silent
    continue when tier = 'silent';

    -- Skip if this graduate already has a report for today
    select exists (
      select 1 from reports
      where graduate_id = g.id and report_date = current_date
    ) into has_report;
    continue when has_report;

    insert into reports (graduate_id, report_date, location, overall_text, status, submitted_at)
    values (
      g.id, current_date, g.teaching_location,
      'Demo report entry — alhamdulillah, another day of teaching by Allah''s tawfeeq.',
      'submitted', (current_date + interval '19 hours')
    ) returning id into report_id;

    pos := 0;

    if tier = 'high' then
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
      hrs := 4.0 + (random() * 2.0);
      insert into activities (
        report_id, activity_type, category, hours, location, position, notes
      ) values (
        report_id, 'Masjid construction supervision', 'other', hrs,
        'Local building site', pos,
        'Overseeing the new masjid build — not aligned with the teaching mandate.'
      );
      pos := pos + 1;

      if random() < 0.6 then
        insert into activities (report_id, activity_type, category, hours, students_count, location, position)
        values (report_id, 'Tajweed lesson', 'teaching', 0.5, 6, g.teaching_location, pos);
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

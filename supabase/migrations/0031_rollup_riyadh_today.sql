-- =============================================================================
-- Fix: "Reported today" stat included yesterday's reports just after midnight
-- in Riyadh.
--
-- Symptom: at the rollover from April 30 → May 1 (Riyadh time), the admin
-- dashboard's monthly view showed "2 reported today" with 0 hours for the
-- new month — but no graduate had filed a May 1 report yet.
--
-- Root cause: the `today` CTE inside `admin_graduate_rollup` and
-- `admin_graduate_rollup_range` used `current_date`, which Postgres evaluates
-- in UTC. From Riyadh's perspective (UTC+3), midnight local time is still
-- 21:00 UTC the previous day — so reports with `report_date = '2026-04-30'`
-- still matched `current_date` for the first three hours of May 1 Riyadh time,
-- and the dashboard counted them as "today's" reports.
--
-- Fix: replace `current_date` with `(now() at time zone 'Asia/Riyadh')::date`
-- in both rollup functions. Asia/Riyadh is the canonical operational timezone
-- (matches the existing plan-late cutoff in 0022 and the founder's location).
--
-- Function signatures and return shapes are unchanged; this is a behavior
-- patch only, no frontend changes required.
-- =============================================================================

drop function if exists admin_graduate_rollup(date);

create or replace function admin_graduate_rollup(target_month date default null)
returns table (
  graduate_id       uuid,
  hours_this_month  numeric,
  counted_hours     numeric,
  teaching_hours    numeric,
  reported_today    boolean,
  active_days       int,
  students_reached  int,
  reports_count     int,
  total_points      numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select coalesce(target_month, date_trunc('month', current_date)::date) as start_date
  ),
  bounds as (
    select start_date, (start_date + interval '1 month')::date as end_date
    from target
  ),
  graduate_stats as (
    select
      r.graduate_id,
      coalesce(sum(a.hours), 0)::numeric  as hours_this_month,
      coalesce(sum(a.hours) filter (
        where a.category in ('teaching', 'dawah', 'umrah_teaching')
      ), 0)::numeric as counted_hours,
      coalesce(sum(a.hours) filter (
        where a.category = 'teaching'
      ), 0)::numeric as teaching_hours,
      coalesce(sum(a.students_count), 0)::int as students_reached,
      count(distinct r.report_date)::int as active_days,
      count(distinct r.id) filter (where r.status = 'submitted')::int as reports_count
    from reports r
    left join activities a on a.report_id = r.id
    cross join bounds b
    where r.report_date >= b.start_date and r.report_date < b.end_date
    group by r.graduate_id
  ),
  today as (
    select distinct r.graduate_id
    from reports r
    where r.report_date = (now() at time zone 'Asia/Riyadh')::date
      and r.status = 'submitted'
  )
  select
    g.id as graduate_id,
    coalesce(gs.hours_this_month, 0) as hours_this_month,
    coalesce(gs.counted_hours, 0)    as counted_hours,
    coalesce(gs.teaching_hours, 0)   as teaching_hours,
    (t.graduate_id is not null) as reported_today,
    coalesce(gs.active_days, 0) as active_days,
    coalesce(gs.students_reached, 0) as students_reached,
    coalesce(gs.reports_count, 0) as reports_count,
    coalesce((
      select total_points from graduate_points_breakdown(
        g.id,
        (select start_date from bounds),
        (select end_date from bounds)
      )
    ), 0)::numeric as total_points
  from graduates g
  left join graduate_stats gs on gs.graduate_id = g.id
  left join today t on t.graduate_id = g.id
$$;

revoke all on function admin_graduate_rollup(date) from public;
grant execute on function admin_graduate_rollup(date) to authenticated;

drop function if exists admin_graduate_rollup_range(date, date);

create or replace function admin_graduate_rollup_range(
  range_start date,
  range_end   date
)
returns table (
  graduate_id       uuid,
  hours_this_month  numeric,
  counted_hours     numeric,
  teaching_hours    numeric,
  reported_today    boolean,
  active_days       int,
  students_reached  int,
  reports_count     int,
  total_points      numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with graduate_stats as (
    select
      r.graduate_id,
      coalesce(sum(a.hours), 0)::numeric  as hours_this_month,
      coalesce(sum(a.hours) filter (
        where a.category in ('teaching', 'dawah', 'umrah_teaching')
      ), 0)::numeric as counted_hours,
      coalesce(sum(a.hours) filter (
        where a.category = 'teaching'
      ), 0)::numeric as teaching_hours,
      coalesce(sum(a.students_count), 0)::int as students_reached,
      count(distinct r.report_date)::int as active_days,
      count(distinct r.id) filter (where r.status = 'submitted')::int as reports_count
    from reports r
    left join activities a on a.report_id = r.id
    where r.report_date >= range_start and r.report_date < range_end
    group by r.graduate_id
  ),
  today as (
    select distinct r.graduate_id
    from reports r
    where r.report_date = (now() at time zone 'Asia/Riyadh')::date
      and r.status = 'submitted'
  )
  select
    g.id as graduate_id,
    coalesce(gs.hours_this_month, 0) as hours_this_month,
    coalesce(gs.counted_hours, 0)    as counted_hours,
    coalesce(gs.teaching_hours, 0)   as teaching_hours,
    (t.graduate_id is not null) as reported_today,
    coalesce(gs.active_days, 0) as active_days,
    coalesce(gs.students_reached, 0) as students_reached,
    coalesce(gs.reports_count, 0) as reports_count,
    coalesce((
      select total_points from graduate_points_breakdown(g.id, range_start, range_end)
    ), 0)::numeric as total_points
  from graduates g
  left join graduate_stats gs on gs.graduate_id = g.id
  left join today t on t.graduate_id = g.id
$$;

revoke all on function admin_graduate_rollup_range(date, date) from public;
grant execute on function admin_graduate_rollup_range(date, date) to authenticated;

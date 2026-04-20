-- =============================================================================
-- Add admin_graduate_rollup_range(range_start, range_end) — a date-range
-- equivalent of admin_graduate_rollup so the admin dashboard can show data
-- for any arbitrary range (single day, last week, custom range, etc.).
--
-- end date is EXCLUSIVE — pass (2026-04-20, 2026-04-21) to get a single day,
-- or (2026-04-01, 2026-05-01) to match the existing month-based rollup.
-- =============================================================================

drop function if exists admin_graduate_rollup_range(date, date);

create or replace function admin_graduate_rollup_range(
  range_start date,
  range_end   date
)
returns table (
  graduate_id       uuid,
  hours_this_month  numeric,   -- kept name for FE compat; means "hours in range"
  counted_hours     numeric,
  teaching_hours    numeric,
  reported_today    boolean,   -- true if graduate reported today (irrespective of range)
  active_days       int,
  students_reached  int,
  reports_count     int
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
    where r.report_date = current_date and r.status = 'submitted'
  )
  select
    g.id as graduate_id,
    coalesce(gs.hours_this_month, 0) as hours_this_month,
    coalesce(gs.counted_hours, 0)    as counted_hours,
    coalesce(gs.teaching_hours, 0)   as teaching_hours,
    (t.graduate_id is not null) as reported_today,
    coalesce(gs.active_days, 0) as active_days,
    coalesce(gs.students_reached, 0) as students_reached,
    coalesce(gs.reports_count, 0) as reports_count
  from graduates g
  left join graduate_stats gs on gs.graduate_id = g.id
  left join today t on t.graduate_id = g.id
$$;

revoke all on function admin_graduate_rollup_range(date, date) from public;
grant execute on function admin_graduate_rollup_range(date, date) to authenticated;

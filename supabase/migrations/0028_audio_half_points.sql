-- =============================================================================
-- Audio = +0.5, video = +1 in the mandatory daily-proof slot.
--
-- Founder's ruling (WhatsApp 2026-04-29):
--   "1. Audio points +0.5, video +1
--    2. Yes audio is available to every graduate but not explicitly stated,
--       I will let the specific graduates know they can submit audio."
--
-- Two changes vs migration 0020:
--   1. Mandatory daily proof — split scoring by media kind:
--        video_exempt          → +1   (auto-credit on report)
--        mandatory_intro video → +1
--        any voice on the day  → +0.5  (was: only counted if
--                                      voice_fallback_approved=true)
--      The voice_fallback_approved column is left in place — admin UI still
--      toggles it, but it no longer gates scoring. May be repurposed later;
--      removing it now is out-of-scope per the minimal-scope rule.
--
--   2. Numeric return types. mandatory_video_points and total_points are no
--      longer integer (now numeric). admin_graduate_rollup{,_range}.total_points
--      bumped to numeric to match.
-- =============================================================================

-- 1) Replace the breakdown function. Drop first because the return signature
-- changes (int → numeric on mandatory_video_points and total_points).
drop function if exists graduate_points_breakdown(uuid, date, date);

create or replace function graduate_points_breakdown(
  g_id        uuid,
  range_start date,
  range_end   date
)
returns table (
  daily_report_points    int,
  mandatory_video_points numeric,
  optional_video_points  int,
  hours_bonus            int,
  manual_bonus_total     int,
  total_points           numeric,
  hours_in_range         numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with grad as (
    select video_exempt
    from graduates where id = g_id
  ),
  day_media as (
    select
      r.report_date,
      bool_or(m.proof_type = 'mandatory_intro') as has_mandatory,
      bool_or(m.proof_type = 'students_video') as has_students,
      bool_or(m.kind = 'voice')                as has_voice
    from reports r
    left join report_media m on m.report_id = r.id
    where r.graduate_id = g_id
      and r.status = 'submitted'
      and r.report_date >= range_start and r.report_date < range_end
    group by r.report_date
  ),
  per_day as (
    select
      1 as daily_pt,
      case
        when (select video_exempt from grad)        then 1.0
        when coalesce(dm.has_mandatory, false)      then 1.0
        when coalesce(dm.has_voice, false)          then 0.5
        else 0
      end::numeric as mandatory_pt,
      case when coalesce(dm.has_students, false) then 1 else 0 end as students_pt
    from day_media dm
  ),
  totals as (
    select
      coalesce(sum(daily_pt), 0)::int       as daily_report_points,
      coalesce(sum(mandatory_pt), 0)::numeric as mandatory_video_points,
      coalesce(sum(students_pt), 0)::int    as optional_video_points
    from per_day
  ),
  hrs as (
    select coalesce(sum(a.hours), 0)::numeric as total_hrs
    from reports r
    left join activities a on a.report_id = r.id
    where r.graduate_id = g_id
      and r.report_date >= range_start and r.report_date < range_end
      and a.category in ('teaching', 'dawah', 'umrah_teaching')
  ),
  hours_tier as (
    select
      total_hrs,
      case
        when total_hrs > 170 then 5
        when total_hrs > 160 then 4
        when total_hrs > 150 then 3
        when total_hrs > 140 then 2
        when total_hrs > 135 then 1
        else 0
      end as bonus
    from hrs
  ),
  manual as (
    select coalesce(sum(points), 0)::int as total
    from graduate_bonus_awards
    where graduate_id = g_id
      and month_start >= range_start
      and month_start <  range_end
  )
  select
    t.daily_report_points,
    t.mandatory_video_points,
    t.optional_video_points,
    ht.bonus,
    m.total,
    (t.daily_report_points + t.mandatory_video_points + t.optional_video_points + ht.bonus + m.total)::numeric,
    ht.total_hrs
  from totals t cross join hours_tier ht cross join manual m
$$;

revoke all on function graduate_points_breakdown(uuid, date, date) from public;
grant execute on function graduate_points_breakdown(uuid, date, date) to authenticated;

-- 2) Bump total_points to numeric in the admin rollups.
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

-- =============================================================================
-- Points / grading system.
--
-- Daily points (per submitted report, max +3):
--   +1 daily report (any submitted report)
--   +1 mandatory video, satisfied by ANY of:
--       (a) graduates.video_exempt = true AND a report was filed that day
--       (b) at least one media on that day tagged proof_type = 'mandatory_intro'
--       (c) graduates.voice_fallback_approved = true AND at least one
--           voice-kind media attached that day
--   +1 optional students video — at least one media tagged 'students_video'
--
-- End-of-month hours bonus (highest tier only, NOT stacked):
--   > 170h → +5   > 160h → +4   > 150h → +3   > 140h → +2   > 135h → +1
--
-- Manual bonus: admin-awarded positive integer + required reason, per-month.
-- =============================================================================

-- 1) Graduate compliance flags (admin-controlled; hidden from graduate UI)
alter table graduates
  add column if not exists video_exempt boolean not null default false,
  add column if not exists voice_fallback_approved boolean not null default false;

-- 2) Per-media proof_type tag. Only set by graduate at upload time for videos.
--    NULL = untagged. voice_fallback is implicit (kind='voice' + profile flag).
alter table report_media
  add column if not exists proof_type text
    check (proof_type is null or proof_type in ('mandatory_intro', 'students_video'));

create index if not exists idx_report_media_proof_type
  on report_media(proof_type) where proof_type is not null;

-- 3) Manual bonus awards
create table if not exists graduate_bonus_awards (
  id           uuid primary key default gen_random_uuid(),
  graduate_id  uuid not null references graduates(id) on delete cascade,
  month_start  date not null default date_trunc('month', current_date)::date,
  points       int  not null check (points > 0),
  reason       text not null check (char_length(trim(reason)) > 0),
  awarded_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_graduate_bonus_awards_graduate_month
  on graduate_bonus_awards(graduate_id, month_start desc);

alter table graduate_bonus_awards enable row level security;

create policy graduate_bonus_awards_admin_all on graduate_bonus_awards
  for all using (is_admin()) with check (is_admin());

create policy graduate_bonus_awards_graduate_read on graduate_bonus_awards
  for select using (graduate_id = current_graduate_id());

-- Sponsor visibility omitted on purpose — points are admin + graduate only
-- until the founder approves sponsor visibility.

-- 4) Canonical points breakdown function. Range end is EXCLUSIVE.
create or replace function graduate_points_breakdown(
  g_id        uuid,
  range_start date,
  range_end   date
)
returns table (
  daily_report_points    int,
  mandatory_video_points int,
  optional_video_points  int,
  hours_bonus            int,
  manual_bonus_total     int,
  total_points           int,
  hours_in_range         numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with grad as (
    select video_exempt, voice_fallback_approved
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
        when (select video_exempt from grad) then 1
        when coalesce(dm.has_mandatory, false) then 1
        when (select voice_fallback_approved from grad)
             and coalesce(dm.has_voice, false) then 1
        else 0
      end as mandatory_pt,
      case when coalesce(dm.has_students, false) then 1 else 0 end as students_pt
    from day_media dm
  ),
  totals as (
    select
      coalesce(sum(daily_pt), 0)::int     as daily_report_points,
      coalesce(sum(mandatory_pt), 0)::int as mandatory_video_points,
      coalesce(sum(students_pt), 0)::int  as optional_video_points
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
    t.daily_report_points + t.mandatory_video_points + t.optional_video_points + ht.bonus + m.total,
    ht.total_hrs
  from totals t cross join hours_tier ht cross join manual m
$$;

revoke all on function graduate_points_breakdown(uuid, date, date) from public;
grant execute on function graduate_points_breakdown(uuid, date, date) to authenticated;

-- 5) Extend admin rollup (month) to return total_points
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
  total_points      int
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
    ), 0) as total_points
  from graduates g
  left join graduate_stats gs on gs.graduate_id = g.id
  left join today t on t.graduate_id = g.id
$$;

revoke all on function admin_graduate_rollup(date) from public;
grant execute on function admin_graduate_rollup(date) to authenticated;

-- Same for the arbitrary-range variant
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
  total_points      int
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
    ), 0) as total_points
  from graduates g
  left join graduate_stats gs on gs.graduate_id = g.id
  left join today t on t.graduate_id = g.id
$$;

revoke all on function admin_graduate_rollup_range(date, date) from public;
grant execute on function admin_graduate_rollup_range(date, date) to authenticated;

-- =============================================================================
-- Make admin_graduate_rollup accept an optional target_month date so the admin
-- dashboard can browse past months. Defaults to current month when omitted.
-- =============================================================================

drop function if exists admin_graduate_rollup();
drop function if exists admin_graduate_rollup(date);

create or replace function admin_graduate_rollup(target_month date default null)
returns table (
  graduate_id       uuid,
  hours_this_month  numeric,
  reported_today    boolean,
  active_days       int
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
  hours as (
    select r.graduate_id, coalesce(sum(a.hours), 0)::numeric as hours_this_month
    from reports r
    left join activities a on a.report_id = r.id
    cross join bounds b
    where r.report_date >= b.start_date and r.report_date < b.end_date
    group by r.graduate_id
  ),
  days as (
    select r.graduate_id, count(distinct r.report_date)::int as active_days
    from reports r
    cross join bounds b
    where r.report_date >= b.start_date and r.report_date < b.end_date
      and r.status = 'submitted'
    group by r.graduate_id
  ),
  today as (
    select distinct r.graduate_id
    from reports r
    where r.report_date = current_date and r.status = 'submitted'
  )
  select
    g.id as graduate_id,
    coalesce(h.hours_this_month, 0) as hours_this_month,
    (t.graduate_id is not null) as reported_today,
    coalesce(d.active_days, 0) as active_days
  from graduates g
  left join hours h on h.graduate_id = g.id
  left join days  d on d.graduate_id = g.id
  left join today t on t.graduate_id = g.id
$$;

revoke all on function admin_graduate_rollup(date) from public;
grant execute on function admin_graduate_rollup(date) to authenticated;

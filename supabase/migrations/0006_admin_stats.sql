-- =============================================================================
-- Admin dashboard stats: a single RPC that returns per-graduate monthly hours
-- for the current month, plus whether they reported today. Clean, cached once
-- per page load.
-- =============================================================================

create or replace function admin_graduate_rollup()
returns table (
  graduate_id       uuid,
  hours_this_month  numeric,
  reported_today    boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with this_month as (
    select date_trunc('month', current_date)::date as start_date
  ),
  hours as (
    select r.graduate_id, coalesce(sum(a.hours), 0)::numeric as hours_this_month
    from reports r
    left join activities a on a.report_id = r.id
    cross join this_month tm
    where r.report_date >= tm.start_date
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
    (t.graduate_id is not null) as reported_today
  from graduates g
  left join hours h  on h.graduate_id = g.id
  left join today t  on t.graduate_id = g.id
$$;

revoke all on function admin_graduate_rollup() from public;
grant execute on function admin_graduate_rollup() to authenticated;

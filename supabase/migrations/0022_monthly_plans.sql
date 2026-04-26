-- =============================================================================
-- Monthly plans — graduates submit a plan for the upcoming month by the 25th.
--
-- Flow:
--   * From the 20th onward, the graduate's home shows a banner urging them
--     to submit next month's plan.
--   * Plan is editable until the start of the month it covers (server-enforced).
--   * Late = unsubmitted after the 25th. Flagged for admin only; no point
--     deduction (scoring stays clean).
--   * Visibility: graduate (own) + admin. Sponsors do not see plans.
-- =============================================================================

create table if not exists monthly_plans (
  id                  uuid primary key default gen_random_uuid(),
  graduate_id         uuid not null references graduates(id) on delete cascade,
  -- The month this plan covers. e.g. '2026-05' = plan for May 2026,
  -- typically submitted by 25 April 2026.
  month_id            text not null check (month_id ~ '^\d{4}-\d{2}$'),
  hours_target        int not null default 132 check (hours_target between 0 and 744),
  focus_text          text,
  -- Structured rows: [{ subject, location, hours_per_month }, ...]
  -- hours_per_month per row drives the per-subject plan-vs-actual coverage
  -- on the monthly report. Sum may be < hours_target (rest is unplanned/ad-hoc).
  planned_activities  jsonb not null default '[]'::jsonb,
  status              text not null default 'draft'
                        check (status in ('draft', 'submitted')),
  submitted_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (graduate_id, month_id)
);

create index if not exists idx_monthly_plans_month
  on monthly_plans(month_id);
create index if not exists idx_monthly_plans_graduate_month
  on monthly_plans(graduate_id, month_id);

-- updated_at trigger
create or replace function tg_monthly_plans_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_monthly_plans_updated_at on monthly_plans;
create trigger trg_monthly_plans_updated_at
  before update on monthly_plans
  for each row execute function tg_monthly_plans_set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table monthly_plans enable row level security;

-- Read: admin sees everything; graduate sees own only. Sponsors get no access.
create policy monthly_plans_select on monthly_plans
  for select using (
    is_admin()
    or graduate_id = current_graduate_id()
  );

-- Graduate writes own plan
create policy monthly_plans_graduate_insert on monthly_plans
  for insert with check (graduate_id = current_graduate_id());

create policy monthly_plans_graduate_update on monthly_plans
  for update using (graduate_id = current_graduate_id())
              with check (graduate_id = current_graduate_id());

create policy monthly_plans_graduate_delete on monthly_plans
  for delete using (graduate_id = current_graduate_id());

-- Admin full access (for reopening locked plans, fixing data, etc.)
create policy monthly_plans_admin_all on monthly_plans
  for all using (is_admin()) with check (is_admin());

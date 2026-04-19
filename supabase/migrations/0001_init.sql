-- =============================================================================
-- Madinah Dawah Graduates — initial schema
-- =============================================================================
-- Tables:        profiles, graduates, sponsors, sponsorships,
--                reports, activities, report_media
-- Security:      Row Level Security on every table; policies by role
-- Storage:       graduate-photos (public), report-media (private)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'sponsor', 'graduate')),
  full_name  text not null,
  phone      text,
  created_at timestamptz not null default now()
);

create table graduates (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid unique references profiles(id) on delete set null,
  slug                   text unique not null,
  country                text not null,
  university             text not null default 'Islamic University of Madinah',
  graduation_year        int,
  graduation_month       int check (graduation_month between 1 and 12),
  duration_years         numeric(3,1),
  gpa                    numeric(3,2),
  focus_areas            text[] not null default '{}',
  story                  text,
  photo_url              text,
  teaching_location      text,
  target_hours_monthly   int not null default 132,
  status                 text not null default 'active'
                           check (status in ('active', 'seeking', 'paused', 'alumni')),
  created_at             timestamptz not null default now()
);

create table sponsors (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete set null,
  country    text,
  created_at timestamptz not null default now()
);

create table sponsorships (
  id                  uuid primary key default gen_random_uuid(),
  graduate_id         uuid not null references graduates(id) on delete cascade,
  sponsor_id          uuid not null references sponsors(id) on delete cascade,
  monthly_amount_usd  numeric(8,2) not null default 290,
  started_on          date not null default current_date,
  ended_on            date,
  status              text not null default 'active'
                        check (status in ('active', 'ended')),
  created_at          timestamptz not null default now()
);

create table reports (
  id             uuid primary key default gen_random_uuid(),
  graduate_id    uuid not null references graduates(id) on delete cascade,
  report_date    date not null,
  location       text,
  overall_text   text,
  status         text not null default 'submitted'
                   check (status in ('draft', 'submitted')),
  submitted_at   timestamptz,
  created_at     timestamptz not null default now(),
  unique (graduate_id, report_date)
);

create table activities (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid not null references reports(id) on delete cascade,
  activity_type   text not null,
  start_time      time,
  end_time        time,
  hours           numeric(4,2) not null check (hours >= 0 and hours <= 24),
  students_count  int check (students_count >= 0),
  location        text,
  notes           text,
  position        int not null default 0,
  created_at      timestamptz not null default now()
);

create table report_media (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid not null references reports(id) on delete cascade,
  kind          text not null check (kind in ('photo', 'video', 'voice', 'link')),
  storage_path  text,
  external_url  text,
  caption       text,
  created_at    timestamptz not null default now(),
  check (
    (kind = 'link' and external_url is not null and storage_path is null)
    or (kind <> 'link' and storage_path is not null)
  )
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index idx_graduates_status          on graduates(status);
create index idx_sponsorships_graduate     on sponsorships(graduate_id) where status = 'active';
create index idx_sponsorships_sponsor      on sponsorships(sponsor_id)  where status = 'active';
create index idx_reports_graduate_date     on reports(graduate_id, report_date desc);
create index idx_reports_date              on reports(report_date);
create index idx_activities_report         on activities(report_id);
create index idx_report_media_report       on report_media(report_id);

-- -----------------------------------------------------------------------------
-- Helper functions (used by RLS policies)
-- -----------------------------------------------------------------------------

create or replace function auth_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select auth_role() = 'admin'
$$;

create or replace function current_graduate_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from graduates where profile_id = auth.uid()
$$;

create or replace function current_sponsor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from sponsors where profile_id = auth.uid()
$$;

create or replace function sponsor_of(g_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from sponsorships s
    where s.graduate_id = g_id
      and s.sponsor_id = current_sponsor_id()
      and s.status = 'active'
  )
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table profiles      enable row level security;
alter table graduates     enable row level security;
alter table sponsors      enable row level security;
alter table sponsorships  enable row level security;
alter table reports       enable row level security;
alter table activities    enable row level security;
alter table report_media  enable row level security;

-- profiles: a user sees their own row; admin sees all
create policy profiles_select_self_or_admin on profiles
  for select using (id = auth.uid() or is_admin());
create policy profiles_admin_all_write on profiles
  for all using (is_admin()) with check (is_admin());

-- graduates: authenticated users can read active/seeking; admin reads all; graduate reads own
create policy graduates_select_public on graduates
  for select using (
    status in ('active', 'seeking')
    or is_admin()
    or profile_id = auth.uid()
  );
create policy graduates_admin_write on graduates
  for all using (is_admin()) with check (is_admin());
create policy graduates_self_update_limited on graduates
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- sponsors: admin all; sponsor sees own; graduate sees their active sponsor
create policy sponsors_select on sponsors
  for select using (
    is_admin()
    or profile_id = auth.uid()
    or exists (
      select 1 from sponsorships s
      where s.sponsor_id = sponsors.id
        and s.graduate_id = current_graduate_id()
        and s.status = 'active'
    )
  );
create policy sponsors_admin_write on sponsors
  for all using (is_admin()) with check (is_admin());

-- sponsorships: admin all; graduate/sponsor sees own rows
create policy sponsorships_select on sponsorships
  for select using (
    is_admin()
    or graduate_id = current_graduate_id()
    or sponsor_id  = current_sponsor_id()
  );
create policy sponsorships_admin_write on sponsorships
  for all using (is_admin()) with check (is_admin());

-- reports: admin all; graduate owns own; sponsor reads their graduate's submitted reports
create policy reports_select on reports
  for select using (
    is_admin()
    or graduate_id = current_graduate_id()
    or (status = 'submitted' and sponsor_of(graduate_id))
  );
create policy reports_graduate_insert on reports
  for insert with check (graduate_id = current_graduate_id());
create policy reports_graduate_update on reports
  for update using (graduate_id = current_graduate_id())
              with check (graduate_id = current_graduate_id());
create policy reports_admin_write on reports
  for all using (is_admin()) with check (is_admin());

-- activities: follow parent report's visibility
create policy activities_select on activities
  for select using (
    exists (
      select 1 from reports r
      where r.id = activities.report_id
        and (
          is_admin()
          or r.graduate_id = current_graduate_id()
          or (r.status = 'submitted' and sponsor_of(r.graduate_id))
        )
    )
  );
create policy activities_graduate_write on activities
  for all using (
    exists (
      select 1 from reports r
      where r.id = activities.report_id
        and r.graduate_id = current_graduate_id()
    )
  ) with check (
    exists (
      select 1 from reports r
      where r.id = activities.report_id
        and r.graduate_id = current_graduate_id()
    )
  );
create policy activities_admin_write on activities
  for all using (is_admin()) with check (is_admin());

-- report_media: same as activities
create policy report_media_select on report_media
  for select using (
    exists (
      select 1 from reports r
      where r.id = report_media.report_id
        and (
          is_admin()
          or r.graduate_id = current_graduate_id()
          or (r.status = 'submitted' and sponsor_of(r.graduate_id))
        )
    )
  );
create policy report_media_graduate_write on report_media
  for all using (
    exists (
      select 1 from reports r
      where r.id = report_media.report_id
        and r.graduate_id = current_graduate_id()
    )
  ) with check (
    exists (
      select 1 from reports r
      where r.id = report_media.report_id
        and r.graduate_id = current_graduate_id()
    )
  );
create policy report_media_admin_write on report_media
  for all using (is_admin()) with check (is_admin());

-- Storage buckets + policies live in 0002_storage.sql
-- (run that AFTER clicking "Storage" in the Supabase sidebar once,
--  which initializes the storage schema)

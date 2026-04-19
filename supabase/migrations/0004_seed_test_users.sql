-- =============================================================================
-- Attach roles to the 3 test users created via the Supabase Auth UI.
-- Also links sponsor → Musa as an active sponsorship, and graduate → Musa.
-- Safe to re-run.
-- =============================================================================

-- Profiles (role rows keyed to auth.users by email)
insert into profiles (id, role, full_name)
select id, 'admin', 'Founder (test)'
from auth.users where email = 'admin@mdg.test'
on conflict (id) do update
  set role = excluded.role, full_name = excluded.full_name;

insert into profiles (id, role, full_name)
select id, 'sponsor', 'Abdullah (test sponsor)'
from auth.users where email = 'sponsor@mdg.test'
on conflict (id) do update
  set role = excluded.role, full_name = excluded.full_name;

insert into profiles (id, role, full_name)
select id, 'graduate', 'Musa Mohsin'
from auth.users where email = 'graduate@mdg.test'
on conflict (id) do update
  set role = excluded.role, full_name = excluded.full_name;

-- Link the graduate profile to Musa's graduate row
update graduates
set profile_id = (select id from auth.users where email = 'graduate@mdg.test')
where slug = 'musa-mohsin';

-- Create a sponsor row for the sponsor profile
insert into sponsors (profile_id, country)
select id, 'Netherlands'
from auth.users where email = 'sponsor@mdg.test'
on conflict (profile_id) do update set country = excluded.country;

-- Active sponsorship: test sponsor → Musa
insert into sponsorships (graduate_id, sponsor_id, monthly_amount_usd, started_on, status)
select
  (select id from graduates where slug = 'musa-mohsin'),
  (select id from sponsors where profile_id = (select id from auth.users where email = 'sponsor@mdg.test')),
  290,
  current_date - interval '4 months',
  'active'
where not exists (
  select 1 from sponsorships
  where graduate_id = (select id from graduates where slug = 'musa-mohsin')
    and sponsor_id  = (select id from sponsors where profile_id = (select id from auth.users where email = 'sponsor@mdg.test'))
    and status = 'active'
);

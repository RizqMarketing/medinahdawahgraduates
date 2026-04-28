-- Track whether a graduate has finished their first-login profile completion.
-- The admin "Add graduate" form now only collects identity + credentials;
-- teaching_location, focus_areas, and story are filled by the graduate
-- themselves on a /welcome page on first login. setup_completed_at IS NULL
-- means they still need to complete it.

alter table public.graduates
  add column if not exists setup_completed_at timestamptz default null;

comment on column public.graduates.setup_completed_at is
  'When the graduate finished first-login profile completion. NULL means pending.';

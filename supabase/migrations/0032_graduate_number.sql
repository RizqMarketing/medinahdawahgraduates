-- =============================================================================
-- Add a human-friendly ID number to graduates so admin and sponsor can
-- identify them at a glance — e.g. "#1 Musa Mohsin", "#2 Ibrahim Shirazi".
-- The numbers are admin-assigned (existing graduates already have IDs in the
-- founder's records), so this is just a slot to record them. Nullable until
-- backfilled, but unique once present so two graduates can't share an ID.
-- =============================================================================

alter table public.graduates
  add column if not exists graduate_number int;

create unique index if not exists graduates_graduate_number_unique_idx
  on public.graduates (graduate_number)
  where graduate_number is not null;

comment on column public.graduates.graduate_number is
  'Human-readable ID number assigned by admin (e.g. 1, 2, 3). Displayed as "#N" alongside the full name in admin and sponsor views. Unique when set.';

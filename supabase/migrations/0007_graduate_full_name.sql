-- =============================================================================
-- Add `full_name` to graduates so admin can enter a display name without
-- requiring the graduate to have an auth account yet.
-- Backfills Musa so the existing smoke-test row stays clean.
-- =============================================================================

alter table graduates add column if not exists full_name text;

update graduates set full_name = 'Musa Mohsin'
where slug = 'musa-mohsin' and full_name is null;

alter table graduates alter column full_name set not null;

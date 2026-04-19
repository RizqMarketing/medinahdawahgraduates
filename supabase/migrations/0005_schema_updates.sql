-- =============================================================================
-- Schema updates:
--   1. Drop `manhaj` column (platform-wide baseline, not a per-graduate label)
--   2. Monthly standard is 132 hours for every graduate — change default,
--      backfill existing rows
-- =============================================================================

alter table graduates drop column if exists manhaj;

alter table graduates alter column target_hours_monthly set default 132;

update graduates set target_hours_monthly = 132 where target_hours_monthly <> 132;

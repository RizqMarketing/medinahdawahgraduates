-- =============================================================================
-- Add `full_name` + `phone` to sponsors so admin can track sponsor records
-- without requiring an auth account yet. Same pattern as graduates.
-- =============================================================================

alter table sponsors add column if not exists full_name text;
alter table sponsors add column if not exists phone text;

-- Backfill existing sponsor rows from their linked profile (if any)
update sponsors s
set full_name = coalesce(s.full_name, p.full_name)
from profiles p
where s.profile_id = p.id and s.full_name is null;

update sponsors s
set full_name = 'Sponsor'
where s.full_name is null;

alter table sponsors alter column full_name set not null;

-- =============================================================================
-- Backfill graduate_number for every existing graduate.
--
-- Founder requested:
--   #1  Musa Mohsen
--   #2  Ibrahim Shirazi
--   #3..N  everyone else, by created_at ascending (oldest first)
--
-- Admin can fine-tune any individual row afterwards via the graduate edit
-- form — these are starting positions, not a permanent assignment.
--
-- Idempotent: bails out if ANY graduate already has a number set, so the
-- admin can safely run this once and then start tweaking via the UI without
-- worrying about a re-run trampling those tweaks.
--
-- If Musa or Ibrahim aren't matched (name typo, not yet added, etc.) the
-- backfill silently skips their pinned slots and just numbers everyone by
-- created_at starting from 1 — admin then assigns those two manually.
-- =============================================================================

do $$
declare
  musa_id uuid;
  ibrahim_id uuid;
  next_n int;
  rec record;
begin
  -- Idempotency guard: if any row is already numbered, treat the backfill as done.
  if exists (select 1 from public.graduates where graduate_number is not null) then
    raise notice 'graduate_number already populated on at least one row — skipping backfill.';
    return;
  end if;

  -- Match Musa Mohsen / Mohsin (founder's spelling and the existing seed
  -- migration spelling differ by one letter).
  select id into musa_id
  from public.graduates
  where full_name ilike '%musa%'
    and (full_name ilike '%mohsen%' or full_name ilike '%mohsin%')
  order by created_at asc
  limit 1;

  -- Match Ibrahim Shirazi.
  select id into ibrahim_id
  from public.graduates
  where full_name ilike '%ibrahim%'
    and full_name ilike '%shirazi%'
  order by created_at asc
  limit 1;

  if musa_id is not null then
    update public.graduates set graduate_number = 1 where id = musa_id;
    raise notice 'Pinned #1 → Musa (id=%)', musa_id;
  else
    raise notice 'Musa Mohsen not found — #1 left blank, admin will assign manually.';
  end if;

  if ibrahim_id is not null then
    update public.graduates set graduate_number = 2 where id = ibrahim_id;
    raise notice 'Pinned #2 → Ibrahim Shirazi (id=%)', ibrahim_id;
  else
    raise notice 'Ibrahim Shirazi not found — #2 left blank, admin will assign manually.';
  end if;

  -- Auto-number everyone else by creation order, starting one past the
  -- highest already-assigned number (i.e. 3 if both pins landed, 2 if only
  -- one landed, 1 if neither).
  select coalesce(max(graduate_number), 0) + 1 into next_n from public.graduates;

  for rec in
    select id, full_name from public.graduates
    where graduate_number is null
    order by created_at asc, id asc
  loop
    update public.graduates set graduate_number = next_n where id = rec.id;
    raise notice 'Assigned #% → %', next_n, rec.full_name;
    next_n := next_n + 1;
  end loop;
end $$;

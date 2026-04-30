-- =============================================================================
-- Extend the translation cache to all user-typed fields surfaced on the
-- monthly report.
--
-- Migration 0029 only translated `activities.notes` and `reports.overall_text`.
-- But the report also displays:
--   * `activities.activity_type` (e.g. "التفسير", "التوحيد")
--   * `activities.location`      (e.g. "معهد الحكمة")
--   * `reports.location`         (per-day location; rarely used now that
--                                 each activity has its own location, but
--                                 kept for back-compat with old rows)
--   * `graduates.teaching_location`  (rendered in the hero card)
--   * `graduates.story`              (graduate's bio)
--
-- All of these stay in Arabic when the sponsor flips the toggle to English,
-- which made the toggle look broken. This migration adds `_en` columns for
-- each, plus invalidation triggers so the cache resets when the source text
-- changes.
-- =============================================================================

alter table activities
  add column if not exists activity_type_en text,
  add column if not exists location_en text;

alter table reports
  add column if not exists location_en text;

alter table graduates
  add column if not exists teaching_location_en text,
  add column if not exists story_en text;

-- Replace the activities invalidation trigger from 0029 with one that
-- handles all three translatable columns at once.
create or replace function tg_activities_invalidate_notes_en()
returns trigger language plpgsql as $$
begin
  if new.notes is distinct from old.notes then
    new.notes_en := null;
  end if;
  if new.activity_type is distinct from old.activity_type then
    new.activity_type_en := null;
  end if;
  if new.location is distinct from old.location then
    new.location_en := null;
  end if;
  return new;
end;
$$;

-- Same for reports.
create or replace function tg_reports_invalidate_overall_text_en()
returns trigger language plpgsql as $$
begin
  if new.overall_text is distinct from old.overall_text then
    new.overall_text_en := null;
  end if;
  if new.location is distinct from old.location then
    new.location_en := null;
  end if;
  return new;
end;
$$;

-- New trigger on graduates for the two profile-level translatable fields.
create or replace function tg_graduates_invalidate_translations_en()
returns trigger language plpgsql as $$
begin
  if new.teaching_location is distinct from old.teaching_location then
    new.teaching_location_en := null;
  end if;
  if new.story is distinct from old.story then
    new.story_en := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_graduates_invalidate_translations_en on graduates;
create trigger trg_graduates_invalidate_translations_en
  before update on graduates
  for each row execute function tg_graduates_invalidate_translations_en();

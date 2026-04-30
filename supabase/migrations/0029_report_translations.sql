-- =============================================================================
-- AR → EN translations for monthly reports.
--
-- Many graduates write their daily activity notes in Arabic. Sponsors are
-- often English-speaking. Rather than maintaining two parallel input fields
-- (which would burden the graduate), we cache an English translation
-- alongside the original whenever someone first views the report in English.
--
-- Population path:
--   * Original `notes` / `overall_text` is whatever the graduate typed.
--   * The `translate-report` edge function fills in the `_en` columns
--     on demand (admin or sponsor clicks "English" on the monthly report).
--   * Once written, they're cached forever — translation cost is paid once
--     per piece of text, not per view.
--   * If the graduate later edits a report, the corresponding `_en` column
--     is reset to null so the next view re-translates.
-- =============================================================================

alter table activities
  add column if not exists notes_en text;

alter table reports
  add column if not exists overall_text_en text;

-- Reset the cached translation when the graduate edits the source text.
-- Trigger fires only when notes actually changed, so re-saving an unchanged
-- report does NOT invalidate the translation.
create or replace function tg_activities_invalidate_notes_en()
returns trigger language plpgsql as $$
begin
  if new.notes is distinct from old.notes then
    new.notes_en := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_activities_invalidate_notes_en on activities;
create trigger trg_activities_invalidate_notes_en
  before update on activities
  for each row execute function tg_activities_invalidate_notes_en();

create or replace function tg_reports_invalidate_overall_text_en()
returns trigger language plpgsql as $$
begin
  if new.overall_text is distinct from old.overall_text then
    new.overall_text_en := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reports_invalidate_overall_text_en on reports;
create trigger trg_reports_invalidate_overall_text_en
  before update on reports
  for each row execute function tg_reports_invalidate_overall_text_en();

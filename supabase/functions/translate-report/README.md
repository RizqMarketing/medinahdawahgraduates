# translate-report edge function

Caches Arabic → English translations of a graduate's monthly report for
English-speaking sponsors. Many graduates write their daily activity notes
in Arabic; this function lets the monthly-report page render an English copy
without forcing the graduate to write in two languages.

## Behavior

For a `(graduate_id, month_id)` pair, the function:

1. Loads all reports + activities for that month.
2. Collects rows where the source text is non-empty and the cached `_en`
   column is null (`activities.notes` / `reports.overall_text`).
3. Sends one batched JSON request to Claude Haiku 4.5 with prompt caching
   on the system prompt.
4. Writes translations back into `activities.notes_en` and
   `reports.overall_text_en`.

Idempotent: rows that already have a non-null `_en` value are skipped, so
calling repeatedly is cheap. When a graduate edits the source text, the
trigger from migration `0029_report_translations.sql` resets the
corresponding `_en` column, so the next call retranslates only the changed
items.

## Auth

Caller must be one of:

- An admin (`profiles.role = 'admin'`)
- The graduate themselves (`graduates.profile_id = auth.uid()`)
- The graduate's active sponsor (`sponsorships.status = 'active'`)

## Deploy

```bash
cd madinah-dawah-app
npx supabase functions deploy translate-report --no-verify-jwt
```

`--no-verify-jwt` because authorization is enforced inside the function
(same pattern as `bulk-invite-graduates` and `invite-user`).

### Required secret

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Get the key from <https://console.anthropic.com/settings/keys>. Haiku 4.5
runs at roughly $1 per 1M input tokens / $5 per 1M output tokens, and a
typical graduate-month has < 10K tokens, so monthly cost across 20 graduates
is in the cents.

## Request

```json
POST /functions/v1/translate-report
Authorization: Bearer <user access token>
{
  "graduate_id": "uuid",
  "month_id": "2026-04"
}
```

## Response

```json
{
  "ok": true,
  "translated": 23,
  "pending": 0,
  "errors": []
}
```

`pending > 0` means the batch limit was hit; call the function again to
finish the remaining items. With the current cap (80 per call) this only
happens for back-fills, never for a normal month's view.

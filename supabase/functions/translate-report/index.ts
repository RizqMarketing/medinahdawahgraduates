// deno-lint-ignore-file no-explicit-any
//
// translate-report
// ----------------
// Reads all activity notes + report overall_text for a (graduate, month) pair
// that don't yet have a cached English translation, batches them into a single
// Claude Haiku call, and writes the translations back to `activities.notes_en`
// and `reports.overall_text_en`.
//
// Auth: any of (admin, the graduate themselves, the graduate's active sponsor).
//       Translations are not sensitive data, but we still gate so a random
//       authenticated user can't burn API tokens by translating others' reports.
//
// Idempotent: rows that already have a non-null _en value are skipped, so
// re-invoking is cheap. The 0029 migration nulls out _en columns whenever the
// graduate edits the source text — calling this function again repopulates them.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You translate Arabic dawah-activity notes into clear, natural English for a sponsor reading a monthly report.

Rules:
- Translate faithfully. Don't add commentary, opinions, or explanations.
- Preserve names of people, places, masjids, books, and Quranic references — transliterate where helpful (e.g. "تفسير ابن كثير" → "Tafsir Ibn Kathir").
- Keep Islamic terms in their well-known English form: Tawheed, Fiqh, Aqeedah, Dawah, Hadith, Sunnah, Tajweed, Hifz, etc.
- If the input is already English, return it unchanged.
- If the input is empty or whitespace, return an empty string.
- Match the original's brevity. Don't expand short notes into paragraphs.

You will receive a JSON array of items. Return ONLY a JSON array of the same length, in the same order, where each item is {"id": "<the input id>", "translation": "<English text>"}. No prose, no markdown fences, no commentary.`

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function monthIdRange(monthId: string): { start: string; end: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(monthId)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (month < 1 || month > 12) return null
  const start = `${m[1]}-${m[2]}-01`
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
  return { start, end }
}

async function authorize(admin: any, userId: string, graduateId: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', userId).maybeSingle()
  if (profile?.role === 'admin') return { ok: true }

  // Graduate viewing their own report
  const { data: grad } = await admin
    .from('graduates').select('id').eq('id', graduateId).eq('profile_id', userId).maybeSingle()
  if (grad) return { ok: true }

  // Active sponsor of the graduate
  const { data: sponsorship } = await admin
    .from('sponsorships')
    .select('id, sponsor:sponsors!inner(profile_id)')
    .eq('graduate_id', graduateId)
    .eq('status', 'active')
    .maybeSingle()
  if (sponsorship?.sponsor?.profile_id === userId) return { ok: true }

  return { ok: false, status: 403, error: 'Not authorized to translate this report' }
}

type Item = { id: string; text: string; kind: 'activity' | 'report'; rowId: string }

async function translateBatch(items: Item[], apiKey: string): Promise<Map<string, string>> {
  const payload = items.map(it => ({ id: it.id, text: it.text }))

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      { role: 'user', content: JSON.stringify(payload) },
    ],
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 500)}`)
  }

  const data = await res.json()
  // Messages API: data.content is an array of blocks, first text block holds the JSON.
  const textBlock = (data.content || []).find((b: any) => b.type === 'text')
  if (!textBlock?.text) throw new Error('No text in Claude response')

  // The model is instructed to return raw JSON. Be defensive in case it wraps
  // in a fence anyway — strip ```json … ``` if present.
  let raw = textBlock.text.trim()
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim()
  }

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(`Could not parse translation JSON: ${(err as Error).message}; raw=${raw.slice(0, 300)}`)
  }
  if (!Array.isArray(parsed)) throw new Error('Translation response was not an array')

  const out = new Map<string, string>()
  for (const row of parsed) {
    if (row && typeof row.id === 'string' && typeof row.translation === 'string') {
      out.set(row.id, row.translation)
    }
  }
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  if (!ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'Not authenticated' }, 401)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const graduateId = (body.graduate_id || '').toString()
  const monthId = (body.month_id || '').toString()
  if (!graduateId) return json({ error: 'graduate_id required' }, 400)
  const range = monthIdRange(monthId)
  if (!range) return json({ error: 'month_id must be YYYY-MM' }, 400)

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const auth = await authorize(admin, user.id, graduateId)
  if (!auth.ok) return json({ error: auth.error }, auth.status)

  // Pull untranslated rows for this graduate+month.
  const { data: reports, error: reportsErr } = await admin
    .from('reports')
    .select('id, overall_text, overall_text_en, activities(id, notes, notes_en)')
    .eq('graduate_id', graduateId)
    .gte('report_date', range.start)
    .lt('report_date', range.end)
  if (reportsErr) return json({ error: `Could not load reports: ${reportsErr.message}` }, 500)

  const items: Item[] = []
  for (const r of reports || []) {
    if (r.overall_text && !r.overall_text_en) {
      items.push({ id: `r:${r.id}`, text: r.overall_text, kind: 'report', rowId: r.id })
    }
    for (const a of r.activities || []) {
      if (a.notes && !a.notes_en) {
        items.push({ id: `a:${a.id}`, text: a.notes, kind: 'activity', rowId: a.id })
      }
    }
  }

  if (items.length === 0) {
    return json({ ok: true, translated: 0, message: 'Nothing to translate' })
  }

  // Hard cap to keep a single Anthropic call bounded. A typical month has <100
  // items per graduate; if a back-fill ever exceeds this, the client can call
  // again until items.length === 0.
  const MAX_PER_BATCH = 80
  const batch = items.slice(0, MAX_PER_BATCH)

  let translations: Map<string, string>
  try {
    translations = await translateBatch(batch, ANTHROPIC_API_KEY)
  } catch (err) {
    return json({ error: `Translation failed: ${(err as Error).message}` }, 502)
  }

  // Write back. Update one row at a time so a single bad translation doesn't
  // poison the whole batch. Volume is small (<= MAX_PER_BATCH per call).
  let written = 0
  const writeErrors: any[] = []
  for (const it of batch) {
    const translation = translations.get(it.id)
    if (typeof translation !== 'string') continue
    const table = it.kind === 'activity' ? 'activities' : 'reports'
    const column = it.kind === 'activity' ? 'notes_en' : 'overall_text_en'
    const { error } = await admin
      .from(table)
      .update({ [column]: translation })
      .eq('id', it.rowId)
    if (error) writeErrors.push({ id: it.id, error: error.message })
    else written++
  }

  return json({
    ok: true,
    translated: written,
    pending: items.length - batch.length,
    errors: writeErrors,
  })
})

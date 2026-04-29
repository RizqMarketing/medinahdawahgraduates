// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function slugify(input: string) {
  return input.toString().toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function uniqueSlug(admin: any, baseName: string) {
  const base = slugify(baseName) || 'graduate'
  let candidate = base
  let suffix = 2
  while (true) {
    const { data } = await admin.from('graduates').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${suffix}`
    suffix++
    if (suffix > 50) {
      candidate = `${base}-${randomToken().slice(0, 6).toLowerCase()}`
      return candidate
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  // Admin gate
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'Not authenticated' }, 401)

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: callerProfile } = await admin
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (callerProfile?.role !== 'admin') return json({ error: 'Admin role required' }, 403)

  // Payload
  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const baseUrl: string = (body.base_url || '').toString().replace(/\/+$/, '')
  if (!baseUrl) return json({ error: 'base_url required' }, 400)

  const rows: any[] = Array.isArray(body.rows) ? body.rows : []
  if (rows.length === 0) return json({ error: 'rows must be a non-empty array' }, 400)
  if (rows.length > 100) return json({ error: 'Max 100 rows per batch' }, 400)

  const results: any[] = []
  const errors: any[] = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {}
    const fullName = (r.full_name || '').toString().trim()
    const phone = (r.phone || '').toString().trim() || null
    const country = (r.country || '').toString().trim()

    if (!fullName || !country) {
      errors.push({ index: i, full_name: fullName, error: 'full_name and country required' })
      continue
    }

    const slug = await uniqueSlug(admin, fullName)

    const { data: gradInsert, error: gradErr } = await admin
      .from('graduates')
      .insert({
        full_name: fullName,
        slug,
        country,
        // university default = 'Islamic University of Madinah' (column default)
        // target_hours_monthly default = 132 (column default)
        // status default = 'active' (column default)
        // photo_url, story, focus_areas, teaching_location filled by graduate via /welcome
      })
      .select('id, slug, full_name')
      .single()

    if (gradErr) {
      errors.push({ index: i, full_name: fullName, error: `Graduate insert failed: ${gradErr.message}` })
      continue
    }

    const token = randomToken()
    const { error: tokErr } = await admin.from('signup_tokens').insert({
      token,
      graduate_id: gradInsert.id,
      phone,
      created_by: user.id,
    })

    if (tokErr) {
      // Roll back the graduate row so a retry of this row doesn't double-create.
      await admin.from('graduates').delete().eq('id', gradInsert.id)
      errors.push({ index: i, full_name: fullName, error: `Token insert failed: ${tokErr.message}` })
      continue
    }

    results.push({
      full_name: gradInsert.full_name,
      slug: gradInsert.slug,
      phone,
      country,
      signup_url: `${baseUrl}/claim?token=${token}`,
    })
  }

  return json({ ok: true, created: results, errors })
})

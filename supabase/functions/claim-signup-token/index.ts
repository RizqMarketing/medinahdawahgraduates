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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const token: string = (body.token || '').toString().trim()
  const email: string = (body.email || '').toString().trim().toLowerCase()
  const password: string = (body.password || '').toString()

  if (!token) return json({ error: 'token required' }, 400)
  if (!email) return json({ error: 'email required' }, 400)
  if (!password || password.length < 8) {
    return json({ error: 'password must be at least 8 characters' }, 400)
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 1. Validate token + load graduate
  const { data: tokenRow, error: tokenErr } = await admin
    .from('signup_tokens')
    .select('id, token, graduate_id, phone, used_at, expires_at')
    .eq('token', token)
    .maybeSingle()
  if (tokenErr) return json({ error: `Token lookup failed: ${tokenErr.message}` }, 500)
  if (!tokenRow) return json({ error: 'Invalid signup link' }, 404)
  if (tokenRow.used_at) return json({ error: 'This signup link has already been used' }, 410)
  if (new Date(tokenRow.expires_at) <= new Date()) {
    return json({ error: 'This signup link has expired' }, 410)
  }

  const { data: graduate, error: gradErr } = await admin
    .from('graduates')
    .select('id, full_name, profile_id')
    .eq('id', tokenRow.graduate_id)
    .single()
  if (gradErr || !graduate) return json({ error: 'Graduate record not found' }, 404)
  if (graduate.profile_id) {
    return json({ error: 'This graduate already has an account' }, 409)
  }

  // 2. Create the auth user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: graduate.full_name },
  })
  if (createErr) return json({ error: createErr.message }, 400)
  const newUserId = created.user!.id

  // 3. Create profile
  const { error: profileErr } = await admin.from('profiles').insert({
    id: newUserId,
    role: 'graduate',
    full_name: graduate.full_name,
    phone: tokenRow.phone,
  })
  if (profileErr) {
    await admin.auth.admin.deleteUser(newUserId)
    return json({ error: `Profile insert failed: ${profileErr.message}` }, 500)
  }

  // 4. Link profile to graduate row
  const { error: linkErr } = await admin
    .from('graduates')
    .update({ profile_id: newUserId })
    .eq('id', graduate.id)
  if (linkErr) {
    await admin.from('profiles').delete().eq('id', newUserId)
    await admin.auth.admin.deleteUser(newUserId)
    return json({ error: `Graduate link failed: ${linkErr.message}` }, 500)
  }

  // 5. Burn the token
  await admin.from('signup_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenRow.id)

  return json({ ok: true, email })
})

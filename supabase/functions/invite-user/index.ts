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

function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const base = btoa(String.fromCharCode(...bytes)).replace(/[^A-Za-z0-9]/g, '')
  return base.slice(0, 14) + '!'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  // 1. Verify caller is an authenticated admin
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'Not authenticated' }, 401)

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: callerProfile } = await admin
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (callerProfile?.role !== 'admin') {
    return json({ error: 'Admin role required' }, 403)
  }

  // 2. Parse and validate payload
  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const email: string = (body.email || '').trim().toLowerCase()
  const fullName: string = (body.full_name || '').trim()
  const role: string = body.role
  const phone: string | null = body.phone || null
  const country: string | null = body.country || null
  const graduateId: string | null = body.graduate_id || null
  const sponsorId: string | null = body.sponsor_id || null

  if (!email || !fullName) return json({ error: 'email and full_name required' }, 400)
  if (!['sponsor', 'graduate', 'admin'].includes(role)) {
    return json({ error: 'role must be sponsor, graduate, or admin' }, 400)
  }

  // 3. Create auth user with a temporary password
  const tempPassword = randomPassword()
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (createErr) return json({ error: createErr.message }, 400)
  const newUserId = created.user!.id

  // 4. Create profile
  const { error: profileErr } = await admin.from('profiles').insert({
    id: newUserId, role, full_name: fullName, phone,
  })
  if (profileErr) {
    await admin.auth.admin.deleteUser(newUserId)
    return json({ error: `Profile insert failed: ${profileErr.message}` }, 500)
  }

  // 5. Side tables based on role
  if (role === 'sponsor') {
    if (sponsorId) {
      const changes: Record<string, unknown> = { profile_id: newUserId }
      if (country) changes.country = country
      if (phone)   changes.phone   = phone
      const { error } = await admin.from('sponsors').update(changes).eq('id', sponsorId)
      if (error) {
        await admin.auth.admin.deleteUser(newUserId)
        return json({ error: `Sponsor link failed: ${error.message}` }, 500)
      }
    } else {
      const { error } = await admin.from('sponsors').insert({
        profile_id: newUserId, full_name: fullName, country, phone,
      })
      if (error) {
        await admin.auth.admin.deleteUser(newUserId)
        return json({ error: `Sponsor insert failed: ${error.message}` }, 500)
      }
    }
  }

  if (role === 'graduate' && graduateId) {
    const { error } = await admin
      .from('graduates').update({ profile_id: newUserId }).eq('id', graduateId)
    if (error) {
      await admin.auth.admin.deleteUser(newUserId)
      return json({ error: `Graduate link failed: ${error.message}` }, 500)
    }
  }

  return json({
    ok: true,
    user_id: newUserId,
    email,
    temp_password: tempPassword,
  })
})

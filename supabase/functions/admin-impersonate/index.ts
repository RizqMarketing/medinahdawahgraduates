// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Issues a magic-link hashed_token for a target graduate so an admin can
// preview the app from that graduate's first-person view. The client calls
// supabase.auth.verifyOtp({ token_hash, type: 'magiclink' }) to swap the
// session, after backing up the admin's own session in localStorage.
//
// Limitations (acceptable for the May 2026 trial):
// - The minted session has the same TTL as a normal login. If the admin
//   closes the tab without clicking "Back to admin", they remain signed in
//   as the graduate on next visit. The sticky banner makes this obvious.
// - No audit trail beyond the edge function logs. Promote to an
//   admin_actions table if/when we add more privileged tools.

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
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'Not authenticated' }, 401)

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: callerProfile } = await admin
    .from('profiles').select('role, full_name').eq('id', user.id).maybeSingle()
  if (callerProfile?.role !== 'admin') {
    return json({ error: 'Admin role required' }, 403)
  }

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const targetSlug: string | null = body.graduate_slug || null
  if (!targetSlug) return json({ error: 'graduate_slug required' }, 400)

  // Look up the target graduate and resolve the linked auth user.
  const { data: grad, error: gradErr } = await admin
    .from('graduates')
    .select('id, full_name, slug, profile_id')
    .eq('slug', targetSlug)
    .maybeSingle()
  if (gradErr) return json({ error: gradErr.message }, 500)
  if (!grad) return json({ error: 'Graduate not found' }, 404)
  if (!grad.profile_id) {
    return json({ error: 'Graduate has not claimed their login yet' }, 400)
  }

  const { data: targetUserRes, error: targetErr } =
    await admin.auth.admin.getUserById(grad.profile_id)
  if (targetErr || !targetUserRes?.user?.email) {
    return json({ error: 'Target user has no email' }, 500)
  }
  const targetEmail = targetUserRes.user.email

  // Mint a magiclink-style hashed_token. The client will pass it to
  // verifyOtp({ token_hash, type: 'magiclink' }) to set the session.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetEmail,
  })
  if (linkErr || !linkData?.properties?.hashed_token) {
    return json({ error: linkErr?.message || 'Failed to generate link' }, 500)
  }

  console.log(JSON.stringify({
    event: 'admin_impersonation',
    admin_id: user.id,
    admin_name: callerProfile.full_name,
    target_graduate_id: grad.id,
    target_graduate_name: grad.full_name,
    target_email: targetEmail,
    at: new Date().toISOString(),
  }))

  return json({
    ok: true,
    token_hash: linkData.properties.hashed_token,
    target: {
      graduate_id: grad.id,
      graduate_slug: grad.slug,
      full_name: grad.full_name,
      email: targetEmail,
    },
  })
})

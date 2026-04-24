// Confirm the admin auth user + profile are properly linked
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const url = env.match(/VITE_SUPABASE_URL\s*=\s*(\S+)/)[1]
const svc = env.match(/service_role\s*=\s*(\S+)/)[1]
const sb = createClient(url, svc, { auth: { persistSession: false } })

const { data: users } = await sb.auth.admin.listUsers()
const { data: profiles } = await sb.from('profiles').select('id, role, full_name')

console.log('auth.users:')
for (const u of users.users) console.log(' ', u.id, u.email)
console.log('\nprofiles:')
for (const p of profiles) console.log(' ', p.id, p.role, p.full_name)

console.log('\nlinked:')
for (const u of users.users) {
  const p = profiles.find(p => p.id === u.id)
  console.log(' ', u.email, '→', p ? `role=${p.role}` : 'NO PROFILE')
}

// Create a new admin: adds a Supabase auth user + a profiles row with role='admin'.
// Usage: node scripts/add-admin.mjs <email> <full_name>
//
// Outputs a temp password to share via WhatsApp. The admin should change it
// via the profile menu after first login.
//
// Requires service_role key in .env.local.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const [, , email, fullName] = process.argv
if (!email || !fullName) {
  console.error('Usage: node scripts/add-admin.mjs <email> <full_name>')
  process.exit(1)
}

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const url = env.match(/VITE_SUPABASE_URL\s*=\s*(\S+)/)?.[1]
const svc = env.match(/service_role\s*=\s*(\S+)/)?.[1]
if (!url || !svc) { console.error('Missing env (VITE_SUPABASE_URL and service_role required in .env.local)'); process.exit(1) }

const sb = createClient(url, svc, { auth: { persistSession: false } })

const tempPassword = randomBytes(6).toString('hex') // 12 hex chars, copy-paste friendly

console.log(`Creating auth user for ${email}...`)
const { data: created, error: authErr } = await sb.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: true,
})
if (authErr) { console.error('createUser:', authErr.message); process.exit(1) }
const userId = created.user.id
console.log(`  auth user created: ${userId}`)

console.log('Inserting admin profile...')
const { error: profErr } = await sb.from('profiles').insert({
  id: userId,
  role: 'admin',
  full_name: fullName,
})
if (profErr) {
  console.error('profiles insert:', profErr.message)
  console.error('Rolling back auth user...')
  await sb.auth.admin.deleteUser(userId)
  process.exit(1)
}

console.log(`\n[done] admin created`)
console.log(`  email:         ${email}`)
console.log(`  full_name:     ${fullName}`)
console.log(`  temp password: ${tempPassword}`)
console.log(`\nShare the temp password over WhatsApp. Admin should change it from the profile menu after first login.`)

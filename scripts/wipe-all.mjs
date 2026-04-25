// Full wipe: deletes all auth users except admins, truncates all operational
// tables, and clears both storage buckets. Safe to re-run.
//
// Use this to reset to zero data after the dry run, or any time the DB
// needs to be brought back to a pristine state for a real pilot invite.
//
// Requires service_role key in .env.local.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const url = env.match(/VITE_SUPABASE_URL\s*=\s*(\S+)/)?.[1]
const svc = env.match(/service_role\s*=\s*(\S+)/)?.[1]
if (!url || !svc) { console.error('Missing env'); process.exit(1) }

const sb = createClient(url, svc, { auth: { persistSession: false } })

// 1. Truncate operational tables
console.log('[1/3] truncating operational tables')
for (const t of ['report_media', 'activities', 'reports', 'monthly_plans', 'graduate_bonus_awards', 'sponsorships', 'sponsors', 'graduates']) {
  const { error } = await sb.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) console.error(`  ${t}:`, error.message)
  else console.log(`  ${t}: cleared`)
}

// 2. Delete all non-admin auth users (admin profiles stay, non-admin get cascade-wiped)
console.log('\n[2/3] deleting non-admin auth users')
const { data: users } = await sb.auth.admin.listUsers()
const { data: profiles } = await sb.from('profiles').select('id, role')
const adminIds = new Set(profiles.filter(p => p.role === 'admin').map(p => p.id))
for (const u of users.users) {
  if (adminIds.has(u.id)) {
    console.log(`  keep:   ${u.email} (admin)`)
    continue
  }
  const { error } = await sb.auth.admin.deleteUser(u.id)
  if (error) console.error(`  ${u.email}:`, error.message)
  else console.log(`  delete: ${u.email}`)
}

// 3. Clear storage buckets
console.log('\n[3/3] clearing storage buckets')
async function listAll(bucket, prefix = '') {
  const all = []
  let offset = 0
  while (true) {
    const { data } = await sb.storage.from(bucket).list(prefix, {
      limit: 1000, offset, sortBy: { column: 'name', order: 'asc' },
    })
    if (!data || !data.length) break
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) all.push(...await listAll(bucket, path))
      else all.push(path)
    }
    if (data.length < 1000) break
    offset += 1000
  }
  return all
}
for (const bucket of ['report-media', 'graduate-photos']) {
  const paths = await listAll(bucket)
  if (!paths.length) { console.log(`  ${bucket}: already empty`); continue }
  for (let i = 0; i < paths.length; i += 200) {
    await sb.storage.from(bucket).remove(paths.slice(i, i + 200))
  }
  console.log(`  ${bucket}: removed ${paths.length} objects`)
}

// Final count
console.log('\n[done] final state:')
for (const t of ['graduates','sponsors','sponsorships','reports','activities','report_media','monthly_plans','graduate_bonus_awards','profiles']) {
  const { count } = await sb.from(t).select('*', { count: 'exact', head: true })
  console.log(`  ${t}: ${count}`)
}
const { data: finalUsers } = await sb.auth.admin.listUsers()
console.log(`  auth.users: ${finalUsers.users.length}`)

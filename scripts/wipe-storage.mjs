// One-shot: recursively empty both storage buckets.
// Uses service_role from .env.local. Does NOT delete the buckets themselves.
// Safe to re-run (second run = no-op, both buckets already empty).

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const url = env.match(/VITE_SUPABASE_URL\s*=\s*(\S+)/)?.[1]
const key = env.match(/service_role\s*=\s*(\S+)/)?.[1]
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or service_role in .env.local')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

async function listAll(bucket, prefix = '') {
  const all = []
  let offset = 0
  while (true) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    if (!data.length) break
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      // Supabase marks folders with id === null (no metadata object)
      if (item.id === null) {
        const nested = await listAll(bucket, path)
        all.push(...nested)
      } else {
        all.push(path)
      }
    }
    if (data.length < 1000) break
    offset += 1000
  }
  return all
}

for (const bucket of ['report-media', 'graduate-photos']) {
  try {
    const paths = await listAll(bucket)
    if (!paths.length) {
      console.log(`[${bucket}] already empty`)
      continue
    }
    // Batch in chunks of 200 to stay well under any request-size limit
    for (let i = 0; i < paths.length; i += 200) {
      const chunk = paths.slice(i, i + 200)
      const { error } = await sb.storage.from(bucket).remove(chunk)
      if (error) throw error
    }
    console.log(`[${bucket}] removed ${paths.length} objects`)
  } catch (err) {
    console.error(`[${bucket}] ERROR:`, err.message || err)
    process.exitCode = 1
  }
}

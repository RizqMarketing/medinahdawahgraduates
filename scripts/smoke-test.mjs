// End-to-end API smoke test for the post-wipe state.
// Creates a throwaway graduate + sponsor + sponsorship, files a report as
// the graduate, then verifies the sponsor can read it through RLS.
// Cleans up after itself — leaves the DB at the same state it started in.
//
// Does NOT test: browser UI, file upload, image compression, Arabic rendering.
// Those need a human in an incognito window after this passes.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const url = env.match(/VITE_SUPABASE_URL\s*=\s*(\S+)/)?.[1]
const anon = env.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(\S+)/)?.[1]
const svc = env.match(/service_role\s*=\s*(\S+)/)?.[1]
if (!url || !anon || !svc) {
  console.error('Missing env in .env.local')
  process.exit(1)
}

const admin = createClient(url, svc, { auth: { persistSession: false } })

const stamp = Date.now()
const gradEmail = `smoke-grad-${stamp}@mdg-test.local`
const sponEmail = `smoke-spon-${stamp}@mdg-test.local`
const gradPwd = 'SmokeGrad!ABC123'
const sponPwd = 'SmokeSpon!ABC123'

const trail = { gradUserId: null, sponUserId: null, gradId: null, sponId: null, reportId: null }

async function cleanup() {
  console.log('\n[cleanup] starting')
  if (trail.reportId) await admin.from('reports').delete().eq('id', trail.reportId)
  if (trail.gradId)   await admin.from('graduates').delete().eq('id', trail.gradId)
  if (trail.sponId)   await admin.from('sponsors').delete().eq('id', trail.sponId)
  if (trail.gradUserId) await admin.auth.admin.deleteUser(trail.gradUserId)
  if (trail.sponUserId) await admin.auth.admin.deleteUser(trail.sponUserId)
  // Sanity: confirm zero data again
  const counts = await Promise.all(
    ['graduates','sponsors','sponsorships','reports','activities','report_media']
      .map(async t => [t, (await admin.from(t).select('*', { count: 'exact', head: true })).count])
  )
  console.log('[cleanup] row counts:', Object.fromEntries(counts))
}

async function fail(stage, err) {
  console.error(`\n[FAIL] ${stage}:`, err?.message || err)
  await cleanup()
  process.exit(1)
}

try {
  // ---------------------------------------------------------------------------
  // 1. Create graduate record (admin would do this via UI first)
  // ---------------------------------------------------------------------------
  console.log('[1] create graduate row')
  const { data: grad, error: gErr } = await admin.from('graduates').insert({
    slug: `smoke-grad-${stamp}`,
    full_name: 'Smoke Test Graduate',
    country: 'Tanzania',
    gpa: 4.5,
    status: 'active',
  }).select('id').single()
  if (gErr) await fail('graduate insert', gErr)
  trail.gradId = grad.id

  // 2. Create graduate auth user + profile, link to graduate row
  console.log('[2] create graduate auth user + profile')
  const { data: gUser, error: gaErr } = await admin.auth.admin.createUser({
    email: gradEmail, password: gradPwd, email_confirm: true,
    user_metadata: { full_name: 'Smoke Test Graduate' },
  })
  if (gaErr) await fail('graduate auth user', gaErr)
  trail.gradUserId = gUser.user.id
  const { error: gpErr } = await admin.from('profiles').insert({
    id: gUser.user.id, role: 'graduate', full_name: 'Smoke Test Graduate',
  })
  if (gpErr) await fail('graduate profile', gpErr)
  const { error: glErr } = await admin.from('graduates')
    .update({ profile_id: gUser.user.id }).eq('id', trail.gradId)
  if (glErr) await fail('graduate profile link', glErr)

  // ---------------------------------------------------------------------------
  // 3. Create sponsor auth user + profile + sponsor row
  // ---------------------------------------------------------------------------
  console.log('[3] create sponsor auth user + profile + sponsor row')
  const { data: sUser, error: saErr } = await admin.auth.admin.createUser({
    email: sponEmail, password: sponPwd, email_confirm: true,
    user_metadata: { full_name: 'Smoke Test Sponsor' },
  })
  if (saErr) await fail('sponsor auth user', saErr)
  trail.sponUserId = sUser.user.id
  const { error: spErr } = await admin.from('profiles').insert({
    id: sUser.user.id, role: 'sponsor', full_name: 'Smoke Test Sponsor',
  })
  if (spErr) await fail('sponsor profile', spErr)
  const { data: spon, error: sErr } = await admin.from('sponsors').insert({
    profile_id: sUser.user.id, full_name: 'Smoke Test Sponsor', country: 'UK',
  }).select('id').single()
  if (sErr) await fail('sponsor insert', sErr)
  trail.sponId = spon.id

  // 4. Create active sponsorship
  console.log('[4] create sponsorship')
  const { error: spErr2 } = await admin.from('sponsorships').insert({
    graduate_id: trail.gradId, sponsor_id: trail.sponId, status: 'active',
  })
  if (spErr2) await fail('sponsorship insert', spErr2)

  // ---------------------------------------------------------------------------
  // 5. Graduate signs in and files a report (tests RLS insert policy)
  // ---------------------------------------------------------------------------
  console.log('[5] graduate signs in + files report')
  const gClient = createClient(url, anon, { auth: { persistSession: false } })
  const { error: gSignErr } = await gClient.auth.signInWithPassword({
    email: gradEmail, password: gradPwd,
  })
  if (gSignErr) await fail('graduate sign in', gSignErr)

  const today = new Date().toISOString().slice(0, 10)
  const { data: report, error: rErr } = await gClient.from('reports').insert({
    graduate_id: trail.gradId,
    report_date: today,
    location: 'Dar es Salaam',
    overall_text: 'Smoke test report — delete me.',
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  }).select('id').single()
  if (rErr) await fail('report insert (as graduate)', rErr)
  trail.reportId = report.id

  const { error: aErr } = await gClient.from('activities').insert([
    { report_id: report.id, activity_type: 'Tajweed lesson',
      hours: 2.5, students_count: 8, category: 'teaching', position: 0 },
    { report_id: report.id, activity_type: 'درس فقه',
      hours: 1.5, students_count: 5, category: 'teaching', position: 1 },
  ])
  if (aErr) await fail('activities insert (as graduate)', aErr)

  // ---------------------------------------------------------------------------
  // 6. Sponsor signs in and reads the report (tests RLS select policy)
  // ---------------------------------------------------------------------------
  console.log('[6] sponsor signs in + reads report')
  const sClient = createClient(url, anon, { auth: { persistSession: false } })
  const { error: sSignErr } = await sClient.auth.signInWithPassword({
    email: sponEmail, password: sponPwd,
  })
  if (sSignErr) await fail('sponsor sign in', sSignErr)

  const { data: visibleReports, error: vrErr } = await sClient
    .from('reports').select('id, report_date, overall_text, graduate_id')
  if (vrErr) await fail('sponsor report read', vrErr)
  if (!visibleReports.find(r => r.id === report.id)) {
    await fail('sponsor visibility', new Error(
      `Sponsor cannot see graduate's submitted report. RLS policy broken.\nGot: ${JSON.stringify(visibleReports)}`
    ))
  }

  const { data: visActs, error: vaErr } = await sClient
    .from('activities').select('id, activity_type, hours').eq('report_id', report.id)
  if (vaErr) await fail('sponsor activities read', vaErr)
  if (visActs.length !== 2) {
    await fail('sponsor activities visibility',
      new Error(`Expected 2 activities, sponsor sees ${visActs.length}`))
  }

  // 7. Negative check: sponsor should NOT see graduates outside their sponsorship
  console.log('[7] negative check: sponsor cannot see unrelated data')
  // Insert an orphan graduate + report as admin, confirm sponsor can't read it
  const { data: orphanGrad } = await admin.from('graduates').insert({
    slug: `orphan-${stamp}`, full_name: 'Orphan Graduate',
    country: 'Kenya', status: 'active',
  }).select('id').single()
  const { data: orphanRep } = await admin.from('reports').insert({
    graduate_id: orphanGrad.id, report_date: today,
    status: 'submitted', submitted_at: new Date().toISOString(),
  }).select('id').single()
  const { data: sponSees } = await sClient.from('reports').select('id').eq('id', orphanRep.id)
  if (sponSees.length > 0) {
    await fail('RLS leak',
      new Error(`Sponsor can see a report from a graduate they DON'T sponsor. RLS broken.`))
  }
  await admin.from('reports').delete().eq('id', orphanRep.id)
  await admin.from('graduates').delete().eq('id', orphanGrad.id)

  console.log('\n[PASS] all checks green')
} catch (err) {
  await fail('unexpected', err)
}

await cleanup()
console.log('[done] system ready for real pilot invite')

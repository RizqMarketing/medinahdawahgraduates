// Seed two test graduates with realistic reports + plans, so the new
// monthly-plans + monthly-report features can be tested end-to-end without
// real graduate accounts.
//
// Creates:
//   * Yusuf Test  — full set: April reports + April plan + May plan SUBMITTED
//                   → tests Monthly Report page + "Plan submitted ✓" banner
//   * Hassan Test — April reports + April plan + NO May plan
//                   → tests admin late list + WhatsApp deep-link reminder
//
// Both get fake +966 phone numbers so the WhatsApp link is well-formed but
// doesn't open a real chat. Edit a phone via the admin UI to your own number
// if you want to verify the deep link opens WhatsApp with your message.
//
// Idempotent-ish: if test users already exist, exits without changes. Run
// scripts/wipe-all.mjs first to re-seed from scratch.
//
// Usage: node scripts/seed-test-data.mjs
// Requires service_role key in .env.local.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const url = env.match(/VITE_SUPABASE_URL\s*=\s*(\S+)/)?.[1]
const svc = env.match(/service_role\s*=\s*(\S+)/)?.[1]
if (!url || !svc) { console.error('Missing env'); process.exit(1) }

const sb = createClient(url, svc, { auth: { persistSession: false } })

// Deterministic test password — kept in sync with src/lib/devAccounts.js so
// the in-app DEV "Switch view" panel can sign into these accounts.
const TEST_PASSWORD = 'mdg-test-2026'

// ── Date helpers ──────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0') }
function today() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function monthIdNow() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}` }
function monthIdPrev(id) { const [y, m] = id.split('-').map(Number); return m === 1 ? `${y-1}-12` : `${y}-${pad(m-1)}` }
function monthIdNext(id) { const [y, m] = id.split('-').map(Number); return m === 12 ? `${y+1}-01` : `${y}-${pad(m+1)}` }

const THIS_MONTH = monthIdNow()
const LAST_MONTH = monthIdPrev(THIS_MONTH)
const NEXT_MONTH = monthIdNext(THIS_MONTH)

console.log(`Seeding for: last=${LAST_MONTH}, this=${THIS_MONTH}, next=${NEXT_MONTH}`)

// ── Sample report shapes ──────────────────────────────────────────────────
// Generate ~14 days of reports across last + this month so the monthly
// report page (`/graduate/:slug/months/:monthId`) shows real data for both.
function makeReportDates(monthId, count) {
  const [y, m] = monthId.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const dates = []
  const stride = Math.max(1, Math.floor(lastDay / count))
  for (let i = 0; i < count; i++) {
    const day = Math.min(lastDay, 1 + i * stride + (i % 2))
    dates.push(`${y}-${pad(m)}-${pad(day)}`)
  }
  return [...new Set(dates)]
}

const ACTIVITY_TEMPLATES = [
  { activity_type: 'Tawheed lesson',     category: 'teaching', hours: 2.5, students: 22 },
  { activity_type: 'Quran reading group', category: 'teaching', hours: 1.5, students: 14 },
  { activity_type: 'Khutbah preparation', category: 'teaching', hours: 1.0, students: 0 },
  { activity_type: 'Friday khutbah',     category: 'teaching', hours: 1.0, students: 80 },
  { activity_type: 'Aqeedah class',      category: 'teaching', hours: 2.0, students: 18 },
  { activity_type: 'Village visit',      category: 'dawah',    hours: 3.0, students: 35 },
  { activity_type: "Children's class",   category: 'teaching', hours: 1.5, students: 26 },
  { activity_type: 'New Muslim support', category: 'dawah',    hours: 1.0, students: 3 },
]

function activitiesForDay(seed) {
  // Pick 2-3 deterministic activities based on the seed (date string).
  const hash = seed.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  const count = 2 + (hash % 2)
  const out = []
  for (let i = 0; i < count; i++) {
    const tpl = ACTIVITY_TEMPLATES[(hash + i) % ACTIVITY_TEMPLATES.length]
    out.push({
      activity_type: tpl.activity_type,
      category: tpl.category,
      hours: tpl.hours,
      students_count: tpl.students,
      position: i,
    })
  }
  return out
}

// ── Insert one test graduate end-to-end ──────────────────────────────────
async function seedGraduate({ email, fullName, slug, country, phone, focusAreas, story, withMayPlan }) {
  // 1) auth user
  const { data: created, error: authErr } = await sb.auth.admin.createUser({
    email, password: TEST_PASSWORD, email_confirm: true,
  })
  if (authErr) { console.error(`  auth(${email}):`, authErr.message); return null }
  const userId = created.user.id

  // 2) profile
  const { error: profErr } = await sb.from('profiles').insert({
    id: userId, role: 'graduate', full_name: fullName, phone,
  })
  if (profErr) { console.error('  profile:', profErr.message); return null }

  // 3) graduate row
  const { data: grad, error: gradErr } = await sb.from('graduates').insert({
    profile_id: userId, slug, full_name: fullName, country,
    university: 'Islamic University of Madinah',
    duration_years: 5.0, gpa: 4.5,
    focus_areas: focusAreas, story, target_hours_monthly: 132,
    teaching_location: country, status: 'active',
  }).select().single()
  if (gradErr) { console.error('  graduate:', gradErr.message); return null }

  // 4) reports for last + this month
  const allDates = [
    ...makeReportDates(LAST_MONTH, 14),
    ...makeReportDates(THIS_MONTH, Math.min(8, new Date().getDate() - 1)),
  ]
  for (const date of allDates) {
    const { data: report, error: repErr } = await sb.from('reports').insert({
      graduate_id: grad.id, report_date: date, status: 'submitted',
      submitted_at: new Date(date + 'T18:00:00Z').toISOString(),
      overall_text: `Alhamdulillah, productive day teaching and engaging with the community in ${country}.`,
      location: country,
    }).select().single()
    if (repErr) { console.error(`  report(${date}):`, repErr.message); continue }

    const acts = activitiesForDay(date).map(a => ({ ...a, report_id: report.id }))
    const { error: actErr } = await sb.from('activities').insert(acts)
    if (actErr) console.error(`  activities(${date}):`, actErr.message)
  }

  // 5) plans — last month (submitted, for plan-vs-actual on report page)
  await sb.from('monthly_plans').insert({
    graduate_id: grad.id, month_id: LAST_MONTH,
    hours_target: 140,
    focus_text: `In shaa Allah, focus on Tawheed lessons for the youth, weekly Friday khutbah preparation, and visits to surrounding villages for dawah.`,
    planned_activities: [
      { subject: 'Tawheed class', location: 'Main masjid', frequency: '3× per week' },
      { subject: 'Quran memorisation', location: 'Madrasa', frequency: 'Daily' },
      { subject: 'Village dawah visits', location: 'Surrounding villages', frequency: 'Weekly' },
    ],
    status: 'submitted',
    submitted_at: new Date(`${LAST_MONTH}-01T10:00:00Z`).toISOString(),
  })

  // 6) plan for next month — submitted only for the "happy path" graduate
  if (withMayPlan) {
    await sb.from('monthly_plans').insert({
      graduate_id: grad.id, month_id: NEXT_MONTH,
      hours_target: 145,
      focus_text: `Continuing the Tawheed series with the youth and adding a new Aqeedah class for adults after Maghrib.`,
      planned_activities: [
        { subject: 'Tawheed class (advanced)', location: 'Main masjid', frequency: '3× per week' },
        { subject: 'Aqeedah for adults', location: 'Main masjid (after Maghrib)', frequency: '2× per week' },
        { subject: 'Quran memorisation', location: 'Madrasa', frequency: 'Daily' },
      ],
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
  }

  return { email, slug, fullName, hasMayPlan: !!withMayPlan }
}

async function seedSponsor({ email, fullName, country, phone, sponsoredGraduateId }) {
  const { data: created, error: authErr } = await sb.auth.admin.createUser({
    email, password: TEST_PASSWORD, email_confirm: true,
  })
  if (authErr) { console.error(`  auth(${email}):`, authErr.message); return null }
  const userId = created.user.id

  const { error: profErr } = await sb.from('profiles').insert({
    id: userId, role: 'sponsor', full_name: fullName, phone,
  })
  if (profErr) { console.error('  profile:', profErr.message); return null }

  const { data: sponsor, error: spErr } = await sb.from('sponsors').insert({
    profile_id: userId, full_name: fullName, country, phone,
  }).select().single()
  if (spErr) { console.error('  sponsor:', spErr.message); return null }

  if (sponsoredGraduateId) {
    const { error: shipErr } = await sb.from('sponsorships').insert({
      sponsor_id: sponsor.id, graduate_id: sponsoredGraduateId,
      monthly_amount_usd: 290,
      started_on: `${LAST_MONTH}-01`,
      status: 'active',
    })
    if (shipErr) console.error('  sponsorship:', shipErr.message)
  }

  return { email, fullName }
}

// ── Run ───────────────────────────────────────────────────────────────────
console.log('\n[1/3] checking for existing test users')
const { data: existing } = await sb.auth.admin.listUsers()
const testEmails = ['yusuf.test@mdg.test', 'hassan.test@mdg.test', 'fatima.sponsor.test@mdg.test']
const conflicts = existing.users.filter(u => testEmails.includes(u.email))
if (conflicts.length) {
  console.log(`  found ${conflicts.length} existing test user(s) — exiting.`)
  console.log('  run "node scripts/wipe-all.mjs" first if you want to re-seed.')
  process.exit(0)
}

console.log('\n[2/3] seeding two test graduates')

const yusuf = await seedGraduate({
  email: 'yusuf.test@mdg.test',
  fullName: 'Yusuf Test',
  slug: 'yusuf-test',
  country: 'Tanzania',
  phone: '+966500000001',
  focusAreas: ['Tawheed', 'Quran', 'Aqeedah'],
  story: 'Test graduate teaching in rural Tanzania.',
  withMayPlan: true,
})

const hassan = await seedGraduate({
  email: 'hassan.test@mdg.test',
  fullName: 'Hassan Test',
  slug: 'hassan-test',
  country: 'Uganda',
  phone: '+966500000002',
  focusAreas: ['Fiqh', 'Seerah'],
  story: 'Test graduate teaching in Kampala.',
  withMayPlan: false, // late on next month's plan — admin can WhatsApp-nudge
})

console.log('\n[3/3] seeding one test sponsor (covering Yusuf)')
const fatima = yusuf ? await seedSponsor({
  email: 'fatima.sponsor.test@mdg.test',
  fullName: 'Fatima Sponsor',
  country: 'United Kingdom',
  phone: '+447700900000',
  sponsoredGraduateId: (await sb.from('graduates').select('id').eq('slug', 'yusuf-test').single()).data?.id,
}) : null

console.log('\n[done] seeded test accounts (all share the same password):')
console.log(`  password: ${TEST_PASSWORD}`)
for (const g of [yusuf, hassan].filter(Boolean)) {
  console.log(`  ${g.fullName.padEnd(18)} ${g.email.padEnd(34)} ${g.hasMayPlan ? '(May plan submitted)' : '(May plan MISSING — late)'}`)
}
if (fatima) console.log(`  ${fatima.fullName.padEnd(18)} ${fatima.email}  (sponsoring Yusuf)`)
console.log('\nLog in as admin and use the DEV "Switch view" panel on the admin dashboard,')
console.log('or open /login in incognito and pick any test account.')
console.log('When done: node scripts/wipe-all.mjs')

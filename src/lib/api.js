import { supabase } from './supabase.js'
import { compressImage } from './compress.js'
import { monthIdRange } from './months.js'
import { breakdownBySubject } from './subjects.js'

const roundHours = (n) => Math.round(Number(n || 0) * 100) / 100

export async function listGraduates() {
  const { data, error } = await supabase
    .from('graduates')
    .select('id, slug, country, university, gpa, duration_years, status, photo_url, target_hours_monthly')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getGraduateBySlug(slug) {
  const { data, error } = await supabase
    .from('graduates')
    .select(`
      *,
      profile:profiles(id, full_name, phone),
      sponsorships:sponsorships(
        id, status, started_on, ended_on, monthly_amount_usd,
        sponsor:sponsors(
          id, country,
          profile:profiles(id, full_name)
        )
      )
    `)
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

// ---- Admin ----
export async function listAllGraduatesForAdmin() {
  const { data, error } = await supabase
    .from('graduates')
    .select(`
      id, slug, full_name, country, status, target_hours_monthly, photo_url,
      profile:profiles(full_name)
    `)
    .order('full_name', { ascending: true })
  if (error) throw error
  return data
}

export async function getAdminRollup(targetMonthStart = null) {
  const payload = targetMonthStart ? { target_month: targetMonthStart } : {}
  const { data, error } = await supabase.rpc('admin_graduate_rollup', payload)
  if (error) throw error
  const byId = {}
  for (const row of data) byId[row.graduate_id] = row
  return byId
}

// Range variant — end is exclusive. Use for single-day views, last-7-days, etc.
export async function getAdminRollupRange(rangeStart, rangeEnd) {
  const { data, error } = await supabase.rpc('admin_graduate_rollup_range', {
    range_start: rangeStart,
    range_end: rangeEnd,
  })
  if (error) throw error
  const byId = {}
  for (const row of data) byId[row.graduate_id] = row
  return byId
}

export async function createGraduate(input) {
  const { data, error } = await supabase
    .from('graduates')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getGraduateById(id) {
  const { data, error } = await supabase
    .from('graduates')
    .select(`
      *,
      profile:profiles(id, full_name, phone),
      sponsorships:sponsorships(
        id, status, started_on, ended_on, monthly_amount_usd,
        sponsor:sponsors(
          id, country,
          profile:profiles(id, full_name)
        )
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateGraduate(id, changes) {
  const { data, error } = await supabase
    .from('graduates')
    .update(changes)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateGraduateStatus(id, status) {
  return updateGraduate(id, { status })
}

export async function uploadGraduatePhoto(file) {
  const processed = await compressImage(file, { maxDim: 800, quality: 0.85 })
  const ext = (processed.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `uploads/${crypto.randomUUID()}.${ext}`
  const { error: uploadErr } = await supabase
    .storage.from('graduate-photos')
    .upload(path, processed, { contentType: processed.type, upsert: false })
  if (uploadErr) throw uploadErr
  const { data: { publicUrl } } = supabase
    .storage.from('graduate-photos').getPublicUrl(path)
  return publicUrl
}

// ---- Sponsor-facing ----
export async function getMySponsorship() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')

  const { data: sponsor, error } = await supabase
    .from('sponsors')
    .select(`
      id, full_name, country, phone, profile_id,
      sponsorships:sponsorships(
        id, status, started_on, ended_on, monthly_amount_usd,
        graduate:graduates(
          id, slug, full_name, country, photo_url, story,
          focus_areas, target_hours_monthly, teaching_location,
          university, duration_years, gpa, graduation_year, graduation_month
        )
      )
    `)
    .eq('profile_id', session.user.id)
    .maybeSingle()
  if (error) throw error
  const active = (sponsor?.sponsorships || []).find(s => s.status === 'active')
  return { sponsor, activeSponsorship: active }
}

export async function getSponsorImpactStats(sponsorshipStartDate, graduateId) {
  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, report_date, activities(hours, students_count)')
    .eq('graduate_id', graduateId)
    .gte('report_date', sponsorshipStartDate)
  if (error) throw error
  const reportsCount = reports.length
  const activeDays = new Set(reports.map(r => r.report_date)).size
  const totalHours = roundHours(reports.reduce(
    (sum, r) => sum + (r.activities || []).reduce((a, x) => a + Number(x.hours || 0), 0),
    0
  ))
  const studentsReached = reports.reduce(
    (sum, r) => sum + (r.activities || []).reduce((a, x) => a + (x.students_count || 0), 0),
    0
  )
  const startDate = new Date(sponsorshipStartDate + 'T00:00:00')
  const now = new Date()
  const monthsSponsored = Math.max(1, Math.round((now - startDate) / (1000 * 60 * 60 * 24 * 30)))
  return { reportsCount, activeDays, totalHours, studentsReached, monthsSponsored }
}

export async function getGraduateMonthSummary(graduateId, monthId) {
  const { start, end } = monthIdRange(monthId)
  const { data, error } = await supabase
    .from('reports')
    .select('report_date, activities(hours, students_count, activity_type)')
    .eq('graduate_id', graduateId)
    .gte('report_date', start)
    .lt('report_date', end)
  if (error) throw error
  const reports = data || []
  const totalHours = roundHours(reports.reduce(
    (s, r) => s + (r.activities || []).reduce((a, x) => a + Number(x.hours || 0), 0), 0
  ))
  const activeDays = new Set(reports.map(r => r.report_date)).size
  const studentsReached = reports.reduce(
    (s, r) => s + (r.activities || []).reduce((a, x) => a + (x.students_count || 0), 0), 0
  )
  return { totalHours, activeDays, reportsCount: reports.length, studentsReached }
}

export async function getGraduateMonthBreakdown(graduateId, monthId) {
  const { start, end } = monthIdRange(monthId)
  const { data, error } = await supabase
    .from('reports')
    .select('activities(hours, activity_type)')
    .eq('graduate_id', graduateId)
    .gte('report_date', start)
    .lt('report_date', end)
  if (error) throw error
  const allActivities = (data || []).flatMap(r => r.activities || [])
  return breakdownBySubject(allActivities)
}

export async function listReportsForGraduateInMonth(graduateId, monthId) {
  const { start, end } = monthIdRange(monthId)
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id, report_date, location, overall_text, status, created_at,
      activities(hours, activity_type)
    `)
    .eq('graduate_id', graduateId)
    .gte('report_date', start)
    .lt('report_date', end)
    .order('report_date', { ascending: false })
  if (error) throw error
  return (data || []).map(r => ({
    ...r,
    total_hours: roundHours((r.activities || []).reduce((s, a) => s + Number(a.hours || 0), 0)),
  }))
}

export async function getMonthlyHoursForGraduate(graduateId, { start, end } = {}) {
  const now = new Date()
  const effStart = start || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const effEnd = end || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('reports')
    .select('activities(hours)')
    .eq('graduate_id', graduateId)
    .gte('report_date', effStart)
    .lt('report_date', effEnd)
  if (error) throw error
  return roundHours((data || []).reduce(
    (sum, r) => sum + (r.activities || []).reduce((s, a) => s + Number(a.hours || 0), 0),
    0
  ))
}

// ---- Graduate-facing (self-service) ----
export async function getMyGraduate() {
  const { data: session } = await supabase.auth.getSession()
  const userId = session?.session?.user?.id
  if (!userId) throw new Error('Not signed in')
  const { data, error } = await supabase
    .from('graduates')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listReportsForGraduate(graduateId, { limit = 60 } = {}) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id, report_date, location, overall_text, status, created_at,
      activities(hours, activity_type)
    `)
    .eq('graduate_id', graduateId)
    .order('report_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []).map(r => ({
    ...r,
    total_hours: roundHours((r.activities || []).reduce((s, a) => s + Number(a.hours || 0), 0)),
  }))
}

export async function getMyMonthlyHours(graduateId, { start, end } = {}) {
  return getMonthlyHoursForGraduate(graduateId, { start, end })
}

export async function getReportForToday(graduateId) {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('reports')
    .select('id, report_date')
    .eq('graduate_id', graduateId)
    .eq('report_date', today)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createReport({ graduate_id, report_date, location, overall_text, activities }) {
  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .insert({
      graduate_id,
      report_date,
      location: location || null,
      overall_text: overall_text || null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (reportErr) throw reportErr

  if (activities?.length) {
    const rows = activities.map((a, i) => ({
      report_id: report.id,
      activity_type: a.activity_type,
      category: a.category || 'teaching',
      start_time: a.start_time || null,
      end_time: a.end_time || null,
      hours: Number(a.hours) || 0,
      students_count: a.students_count ? Number(a.students_count) : null,
      location: a.location || null,
      notes: a.notes || null,
      position: i,
    }))
    const { error: actErr } = await supabase.from('activities').insert(rows)
    if (actErr) {
      await supabase.from('reports').delete().eq('id', report.id)
      throw actErr
    }
  }

  return report
}

export function kindFromMime(mime) {
  if (!mime) return null
  if (mime.startsWith('image/')) return 'photo'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'voice'
  return null
}

export async function uploadReportMedia({ graduateId, reportId, file }) {
  const originalKind = kindFromMime(file.type) || (
    /\.(heic|heif|jpe?g|png|webp|gif)$/i.test(file.name || '') ? 'photo'
    : /\.(mp4|webm|mov|3gp|3g2|mkv)$/i.test(file.name || '') ? 'video'
    : /\.(mp3|m4a|ogg|wav|flac|amr|opus)$/i.test(file.name || '') ? 'voice'
    : 'photo'
  )
  const processed = originalKind === 'photo'
    ? await compressImage(file, { maxDim: 1600, quality: 0.85 })
    : file
  const kind = kindFromMime(processed.type) || originalKind
  const extFromName = (processed.name?.split('.').pop() || '').toLowerCase()
  const ext = extFromName || (kind === 'photo' ? 'jpg'
    : kind === 'video' ? 'mp4'
    : kind === 'voice' ? 'm4a' : 'bin')
  const path = `${graduateId}/${reportId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('report-media')
    .upload(path, processed, { contentType: processed.type || 'application/octet-stream', upsert: false })
  if (error) throw error
  return { storage_path: path, kind }
}

export async function insertReportMediaRows(rows) {
  if (!rows.length) return []
  const { data, error } = await supabase.from('report_media').insert(rows).select()
  if (error) throw error
  return data
}

export async function getReportMediaSignedUrl(path, expiresInSec = 3600) {
  const { data, error } = await supabase.storage
    .from('report-media')
    .createSignedUrl(path, expiresInSec)
  if (error) throw error
  return data.signedUrl
}

export async function getReportForEdit(reportId) {
  const { data, error } = await supabase
    .from('reports')
    .select(`*, activities(*), media:report_media(*)`)
    .eq('id', reportId)
    .single()
  if (error) throw error
  return data
}

export async function updateReport(reportId, changes) {
  const { data, error } = await supabase
    .from('reports')
    .update(changes)
    .eq('id', reportId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function replaceActivities(reportId, activities) {
  const { error: delErr } = await supabase
    .from('activities').delete().eq('report_id', reportId)
  if (delErr) throw delErr
  if (!activities?.length) return
  const rows = activities.map((a, i) => ({
    report_id: reportId,
    activity_type: a.activity_type,
    category: a.category || 'teaching',
    start_time: a.start_time || null,
    end_time: a.end_time || null,
    hours: Number(a.hours) || 0,
    students_count: a.students_count != null ? Number(a.students_count) : null,
    location: a.location || null,
    notes: a.notes || null,
    position: i,
  }))
  const { error } = await supabase.from('activities').insert(rows)
  if (error) throw error
}

export async function deleteReportMediaItem(mediaId, storagePath = null) {
  if (storagePath) {
    try { await supabase.storage.from('report-media').remove([storagePath]) }
    catch (err) { console.warn('Storage remove failed (continuing):', err) }
  }
  const { error } = await supabase.from('report_media').delete().eq('id', mediaId)
  if (error) throw error
}

export async function getReportDetail(reportId) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      activities(*),
      media:report_media(*),
      graduate:graduates(id, slug, full_name, country, photo_url, target_hours_monthly, profile:profiles(id))
    `)
    .eq('id', reportId)
    .single()
  if (error) throw error
  return data
}

export async function getReportBySlugAndDate(graduateSlug, reportDate) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      activities(*),
      media:report_media(*),
      graduate:graduates!inner(id, slug, full_name, country, photo_url, target_hours_monthly, profile:profiles(id))
    `)
    .eq('graduate.slug', graduateSlug)
    .eq('report_date', reportDate)
    .single()
  if (error) throw error
  return data
}

export async function getReportForEditBySlugAndDate(graduateSlug, reportDate) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      activities(*),
      media:report_media(*),
      graduate:graduates!inner(id, slug, full_name)
    `)
    .eq('graduate.slug', graduateSlug)
    .eq('report_date', reportDate)
    .single()
  if (error) throw error
  return data
}

// ---- Sponsors ----
export async function listAllSponsors() {
  const { data, error } = await supabase
    .from('sponsors')
    .select(`
      id, full_name, country, phone, created_at, profile_id,
      profile:profiles(id, full_name),
      sponsorships:sponsorships(id, status, graduate:graduates(id, slug, full_name, country))
    `)
    .order('full_name', { ascending: true })
  if (error) throw error
  return data
}

export async function createSponsor(input) {
  const { data, error } = await supabase
    .from('sponsors')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getSponsorById(id) {
  const { data, error } = await supabase
    .from('sponsors')
    .select(`
      *,
      profile:profiles(id, full_name, phone),
      sponsorships:sponsorships(
        id, status, started_on, ended_on, monthly_amount_usd,
        graduate:graduates(id, slug, full_name, country, photo_url)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateSponsor(id, changes) {
  const { data, error } = await supabase
    .from('sponsors')
    .update(changes)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listUnsponsoredGraduates() {
  const { data, error } = await supabase
    .from('graduates')
    .select(`
      id, slug, full_name, country, status, photo_url,
      sponsorships:sponsorships(status)
    `)
    .in('status', ['active', 'seeking'])
    .order('full_name', { ascending: true })
  if (error) throw error
  return (data || []).filter(g => !(g.sponsorships || []).some(s => s.status === 'active'))
}

// ---- Sponsorships ----
export async function createSponsorship({ graduate_id, sponsor_id, monthly_amount_usd = 290, started_on }) {
  const payload = { graduate_id, sponsor_id, monthly_amount_usd }
  if (started_on) payload.started_on = started_on
  const { data, error } = await supabase
    .from('sponsorships')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function endSponsorship(id, ended_on = null) {
  const endDate = ended_on || new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('sponsorships')
    .update({ status: 'ended', ended_on: endDate })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ---- Points / grading ----
export async function getGraduatePointsBreakdown(graduateId, { start, end } = {}) {
  const now = new Date()
  const effStart = start || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const effEnd = end || new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)
  const { data, error } = await supabase.rpc('graduate_points_breakdown', {
    g_id: graduateId,
    range_start: effStart,
    range_end: effEnd,
  })
  if (error) throw error
  return (data && data[0]) || {
    daily_report_points: 0,
    mandatory_video_points: 0,
    optional_video_points: 0,
    hours_bonus: 0,
    manual_bonus_total: 0,
    total_points: 0,
    hours_in_range: 0,
  }
}

export async function listBonusAwards(graduateId, monthStart = null) {
  let q = supabase
    .from('graduate_bonus_awards')
    .select('id, month_start, points, reason, awarded_by, created_at')
    .eq('graduate_id', graduateId)
    .order('created_at', { ascending: false })
  if (monthStart) q = q.eq('month_start', monthStart)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function createBonusAward({ graduate_id, points, reason, month_start = null }) {
  const payload = { graduate_id, points, reason }
  if (month_start) payload.month_start = month_start
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.id) payload.awarded_by = session.user.id
  const { data, error } = await supabase
    .from('graduate_bonus_awards')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBonusAward(id) {
  const { error } = await supabase
    .from('graduate_bonus_awards')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function inviteUser(payload) {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: payload,
  })
  if (error) {
    let detail = error.message || 'Request failed'
    try {
      const res = error.context
      if (res && typeof res.text === 'function') {
        const text = await res.text()
        const body = JSON.parse(text)
        if (body?.error) detail = body.error
      }
    } catch { /* fall through with default message */ }
    throw new Error(detail)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

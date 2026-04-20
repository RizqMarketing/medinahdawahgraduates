import i18n from '../i18n.js'

// Canonical month keys — used to look up localized names via i18n.
const MONTH_KEYS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
]
const WEEKDAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat']

// Returns the localized month name for the given 1-based month number.
function monthName(monthOneBased) {
  return i18n.t(`time.months.${MONTH_KEYS[monthOneBased - 1]}`)
}
function weekdayShort(dayOfWeek) {
  return i18n.t(`time.weekdaysShort.${WEEKDAY_KEYS[dayOfWeek]}`)
}

// Kept as a backwards-compat export for any caller still importing MONTH_NAMES.
// Note: this snapshot does NOT react to language changes. Prefer calling
// `monthName()` / `formatMonthId()` which always read the current locale.
export const MONTH_NAMES = MONTH_KEYS.map((_, i) => monthName(i + 1))

export function monthIdNow() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function parseMonthId(id) {
  if (!id) return null
  const [year, month] = id.split('-').map(Number)
  return { year, month }
}

export function monthIdPrev(id) {
  const { year, month } = parseMonthId(id)
  if (month === 1) return `${year - 1}-12`
  return `${year}-${String(month - 1).padStart(2, '0')}`
}

export function monthIdNext(id) {
  const { year, month } = parseMonthId(id)
  if (month === 12) return `${year + 1}-01`
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function formatMonthId(id) {
  const { year, month } = parseMonthId(id)
  return `${monthName(month)} ${year}`
}

export function monthIdRange(id) {
  const { year, month } = parseMonthId(id)
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endYear = month === 12 ? year + 1 : year
  const endMonth = month === 12 ? 1 : month + 1
  const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
  return { start, end }
}

export function isCurrentMonth(id) {
  return id === monthIdNow()
}

export function isFutureMonth(id) {
  const now = parseMonthId(monthIdNow())
  const m = parseMonthId(id)
  return (m.year > now.year) || (m.year === now.year && m.month > now.month)
}

export function daysLeftInMonth() {
  const d = new Date()
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return lastDay - d.getDate()
}

export function lastMonthId() {
  return monthIdPrev(monthIdNow())
}

// ---- Day helpers (ISO date strings: 'YYYY-MM-DD') ----

export function dayIdNow() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftDayId(id, deltaDays) {
  const [y, m, d] = id.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + deltaDays)
  const yy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function dayIdPrev(id) { return shiftDayId(id, -1) }
export function dayIdNext(id) { return shiftDayId(id, 1) }

export function dayIdRange(id) {
  return { start: id, end: shiftDayId(id, 1) }
}

export function isToday(id) {
  return id === dayIdNow()
}

export function isFutureDay(id) {
  return id > dayIdNow()
}

export function formatDayId(id) {
  const [y, m, d] = id.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const today = dayIdNow()
  const yesterday = shiftDayId(today, -1)
  if (id === today) return `${i18n.t('time.today')} · ${monthName(m)} ${d}`
  if (id === yesterday) return `${i18n.t('time.yesterday')} · ${monthName(m)} ${d}`
  return `${weekdayShort(date.getUTCDay())}, ${monthName(m)} ${d}, ${y}`
}

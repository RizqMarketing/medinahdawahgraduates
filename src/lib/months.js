export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

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
  return `${MONTH_NAMES[month - 1]} ${year}`
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

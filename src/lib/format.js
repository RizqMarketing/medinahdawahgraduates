import i18n from '../i18n.js'

// Display helpers for hours/minutes.
// Data still lives as decimal hours in the DB — this is purely presentation.
// We read translations via the i18n instance so these work in any language.

function tr(key) {
  return i18n.t(key)
}

export function formatHoursMinutes(n) {
  const totalMinutes = Math.round(Number(n || 0) * 60)
  if (totalMinutes <= 0) return tr('time.zeroMinsLong')
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const minUnit = m === 1 ? tr('time.minLong') : tr('time.minsLong')
  const hrUnit  = h === 1 ? tr('time.hrLong')  : tr('time.hrsLong')
  if (h === 0) return `${m} ${minUnit}`
  if (m === 0) return `${h} ${hrUnit}`
  return `${h} ${hrUnit} ${m} ${minUnit}`
}

// Short version for tight places — e.g. "1h 38m" / "1س 38د"
export function formatHoursMinutesShort(n) {
  const totalMinutes = Math.round(Number(n || 0) * 60)
  if (totalMinutes <= 0) return tr('time.zeroMinsShort')
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const hSym = tr('time.hrsShort')
  const mSym = tr('time.minsShort')
  if (h === 0) return `${m}${mSym}`
  if (m === 0) return `${h}${hSym}`
  return `${h}${hSym} ${m}${mSym}`
}

// Format a plain number using the current language — but ALWAYS with Western
// digits (0-9), since the founder wants "132 ساعة" not "١٣٢ ساعة".
export function formatNumber(n) {
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  try {
    return new Intl.NumberFormat(lang, { numberingSystem: 'latn' }).format(n)
  } catch {
    return String(n)
  }
}

// "07:00:00" + "08:55:00" → "7:00 a.m. – 8:55 a.m."
// Returns null if either side is missing — caller should fall back to hours.
export function formatTimeRange(start, end) {
  if (!start || !end) return null
  const fmt = (t) => {
    const [hStr, mStr] = String(t).split(':')
    let h = Number(hStr)
    const m = Number(mStr || 0)
    if (Number.isNaN(h) || Number.isNaN(m)) return null
    const ampm = h >= 12 ? tr('time.pm') : tr('time.am')
    h = h % 12 || 12
    return `${h}:${String(m).padStart(2, '0')} ${ampm}`
  }
  const a = fmt(start)
  const b = fmt(end)
  if (!a || !b) return null
  return `${a} – ${b}`
}

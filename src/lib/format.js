// Display helpers for hours/minutes.
// Data still lives as decimal hours in the DB — this is purely presentation.

export function formatHoursMinutes(n) {
  const totalMinutes = Math.round(Number(n || 0) * 60)
  if (totalMinutes <= 0) return '0 mins'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} min${m === 1 ? '' : 's'}`
  if (m === 0) return `${h} hr${h === 1 ? '' : 's'}`
  return `${h} hr${h === 1 ? '' : 's'} ${m} min${m === 1 ? '' : 's'}`
}

// Short version for tight places — e.g. "1h 38m", "45m", "2h"
export function formatHoursMinutesShort(n) {
  const totalMinutes = Math.round(Number(n || 0) * 60)
  if (totalMinutes <= 0) return '0m'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

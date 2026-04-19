// Groups free-text activity_type into normalized subject buckets so the
// sponsor dashboard can show a clean breakdown ("62 hrs Quran, 38 hrs Fiqh…")
// without being fragile about the specific wording each graduate uses.

export function subjectFromActivityType(activityType) {
  const s = (activityType || '').toLowerCase()
  if (!s) return 'Other'
  if (/\bquran\b|qur'?an|memoris|memoriz|hifz|hifdh/.test(s)) return 'Quran'
  if (/tajweed|tajwid/.test(s))                              return 'Tajweed'
  if (/tafsir|tafseer/.test(s))                              return 'Tafsir'
  if (/fiqh|usool al fiqh|usul al fiqh/.test(s))             return 'Fiqh'
  if (/tawheed|tawhid|aqeedah|aqidah/.test(s))               return 'Aqeedah'
  if (/hadith|musta(lah|lih)/.test(s))                       return 'Hadith'
  if (/khutbah|jumu'?ah|friday/.test(s))                     return 'Khutbah'
  if (/sirah|seerah/.test(s))                                return 'Sirah'
  if (/arabic/.test(s))                                      return 'Arabic'
  if (/umrah|hajj/.test(s))                                  return 'Umrah / Hajj'
  if (/visit|community|dawah|da'?wah|nasihah|advice|lecture|event|outreach|new muslim/.test(s))
                                                             return 'Dawah'
  if (/translation/.test(s))                                 return 'Translation'
  if (/writing|content/.test(s))                             return 'Writing'
  return 'Other'
}

// Given a list of activity rows, return an array of { subject, hours }
// sorted by hours descending. Zero-hour subjects are omitted.
export function breakdownBySubject(activities) {
  const totals = {}
  for (const a of activities || []) {
    const subj = subjectFromActivityType(a.activity_type)
    totals[subj] = (totals[subj] || 0) + Number(a.hours || 0)
  }
  return Object.entries(totals)
    .map(([subject, hours]) => ({ subject, hours: Math.round(hours * 100) / 100 }))
    .filter(x => x.hours > 0)
    .sort((a, b) => b.hours - a.hours)
}

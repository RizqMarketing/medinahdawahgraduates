// Groups free-text activity_type into normalized subject keys so the
// sponsor dashboard can show a clean breakdown ("62 hrs Quran, 38 hrs Fiqh…")
// without being fragile about the specific wording each graduate uses.
//
// Returns a canonical KEY ('quran', 'fiqh', ...) not a display label.
// Callers translate via i18n: t(`subject.${key}`). This keeps grouping stable
// across languages and lets the UI render either English or Arabic labels.
//
// Regexes match both English AND Arabic forms so graduates can type in
// their own language and still get categorized correctly.

export function subjectFromActivityType(activityType) {
  const s = (activityType || '').toLowerCase().trim()
  if (!s) return 'other'
  // Quran / memorization
  if (/\bquran\b|qur'?an|memoris|memoriz|hifz|hifdh|قرآن|حفظ|تحفيظ/.test(s)) return 'quran'
  // Tajweed
  if (/tajweed|tajwid|تجويد/.test(s))                                          return 'tajweed'
  // Tafsir
  if (/tafsir|tafseer|تفسير/.test(s))                                          return 'tafsir'
  // Fiqh / usool
  if (/fiqh|usool al fiqh|usul al fiqh|فقه|أصول الفقه|اصول الفقه/.test(s))     return 'fiqh'
  // Aqeedah / tawheed
  if (/tawheed|tawhid|aqeedah|aqidah|توحيد|عقيدة/.test(s))                     return 'aqeedah'
  // Hadith / mustalah
  if (/hadith|musta(lah|lih)|حديث|مصطلح/.test(s))                              return 'hadith'
  // Khutbah / jumuah
  if (/khutbah|jumu'?ah|friday|خطبة|جمعة/.test(s))                             return 'khutbah'
  // Sirah
  if (/sirah|seerah|سيرة/.test(s))                                             return 'sirah'
  // Arabic language
  if (/arabic|اللغة العربية|\bعربية\b/.test(s))                                return 'arabic'
  // Umrah / Hajj teaching
  if (/umrah|hajj|عمرة|حج/.test(s))                                            return 'umrahHajj'
  // Dawah / community
  if (/visit|community|dawah|da'?wah|nasihah|advice|lecture|event|outreach|new muslim|دعوة|محاضرة|زيارة|مجتمع|نصيحة/.test(s))
                                                                               return 'dawah'
  // Translation
  if (/translation|ترجمة/.test(s))                                             return 'translation'
  // Writing / content
  if (/writing|content|كتابة|محتوى/.test(s))                                   return 'writing'
  return 'other'
}

// Given a list of activity rows, return an array of { subjectKey, hours }
// sorted by hours descending. Zero-hour subjects are omitted.
// Callers render the label via `t(\`subject.\${subjectKey}\`)`.
export function breakdownBySubject(activities) {
  const totals = {}
  for (const a of activities || []) {
    const key = subjectFromActivityType(a.activity_type)
    totals[key] = (totals[key] || 0) + Number(a.hours || 0)
  }
  return Object.entries(totals)
    .map(([subjectKey, hours]) => ({ subjectKey, hours: Math.round(hours * 100) / 100 }))
    .filter(x => x.hours > 0)
    .sort((a, b) => b.hours - a.hours)
}

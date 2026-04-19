export const CATEGORIES = [
  { value: 'teaching',        label: 'Teaching',          hint: 'Lessons, halaqah, Quran, tajweed, fiqh, aqeedah' },
  { value: 'dawah',           label: 'Dawah / community', hint: 'Visits, nasihah, community events, new-Muslim support' },
  { value: 'umrah_teaching',  label: 'Umrah teaching',    hint: 'Only when leading an Umrah group and teaching during the trip' },
  { value: 'other',           label: 'Other (not counted)', hint: 'Travel, admin, personal study, construction supervision' },
]

export const COUNTED_CATEGORIES = new Set(['teaching', 'dawah', 'umrah_teaching'])

export function categoryLabel(value) {
  return CATEGORIES.find(c => c.value === value)?.label || 'Teaching'
}

const SUGGESTION_TO_CATEGORY = {
  'tajweed lesson':           'teaching',
  'quran memorisation':       'teaching',
  'quran memorization':       'teaching',
  'tawheed class':            'teaching',
  'fiqh class':               'teaching',
  'aqeedah lesson':           'teaching',
  'friday khutbah':           'teaching',
  'khutbah preparation':      'teaching',
  'lesson preparation':       'teaching',
  'one-on-one teaching':      'teaching',
  "children's class":         'teaching',
  "adults' class":            'teaching',
  'village visit':            'dawah',
  'community lecture':        'dawah',
  'community event':          'dawah',
  'nasihah / advice session': 'dawah',
  'new muslim support':       'dawah',
  'dawah conversation':       'dawah',
  'translation work':         'teaching',
  'writing / content':        'teaching',
}

export function suggestCategory(activityType) {
  if (!activityType) return 'teaching'
  const key = activityType.trim().toLowerCase()
  if (!key) return 'teaching'
  if (SUGGESTION_TO_CATEGORY[key]) return SUGGESTION_TO_CATEGORY[key]
  if (/umrah/.test(key)) return 'umrah_teaching'
  if (/travel|trip|journey|transport/.test(key)) return 'other'
  if (/construction|building|admin|supervis/.test(key)) return 'other'
  if (/visit|community|dawah|da'wah|outreach|nasihah|advice/.test(key)) return 'dawah'
  return 'teaching'
}

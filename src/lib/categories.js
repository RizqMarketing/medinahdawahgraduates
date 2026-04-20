import i18n from '../i18n.js'

// Category value + metadata. `value` is the DB enum (always English, stored
// literally in the activities.category column under a CHECK constraint).
// `labelKey` and `hintKey` point to i18n keys for display.
export const CATEGORIES = [
  { value: 'teaching',        labelKey: 'category.teaching',        hintKey: 'category.teachingHint' },
  { value: 'dawah',           labelKey: 'category.dawah',           hintKey: 'category.dawahHint' },
  { value: 'umrah_teaching',  labelKey: 'category.umrah_teaching',  hintKey: 'category.umrah_teachingHint' },
  { value: 'other',           labelKey: 'category.other',           hintKey: 'category.otherHint' },
]

export const COUNTED_CATEGORIES = new Set(['teaching', 'dawah', 'umrah_teaching'])

// Returns a translated label for a category value.
// Call with a fresh `t` from useTranslation for reactive components, or
// omit it to read from the current i18n instance (non-reactive fallback).
export function categoryLabel(value, t) {
  const entry = CATEGORIES.find(c => c.value === value)
  if (!entry) return (t || i18n.t.bind(i18n))('category.teaching')
  return (t || i18n.t.bind(i18n))(entry.labelKey)
}

// Suggestion map — matches common activity-type phrases (EN + AR) to a
// category. Keys are lowercased phrases; values are category enum values.
const SUGGESTION_TO_CATEGORY = {
  // English
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
  // Arabic
  'درس تجويد':                 'teaching',
  'تحفيظ قرآن':                'teaching',
  'حفظ قرآن':                  'teaching',
  'درس توحيد':                 'teaching',
  'درس فقه':                   'teaching',
  'درس عقيدة':                 'teaching',
  'خطبة الجمعة':               'teaching',
  'تحضير خطبة':                'teaching',
  'تحضير درس':                 'teaching',
  'تعليم فردي':                'teaching',
  'درس أطفال':                 'teaching',
  'درس كبار':                  'teaching',
  'زيارة قرية':                'dawah',
  'محاضرة مجتمعية':            'dawah',
  'فعالية مجتمعية':            'dawah',
  'نصيحة':                     'dawah',
  'دعم مسلم جديد':             'dawah',
  'محادثة دعوية':              'dawah',
  'عمل ترجمة':                 'teaching',
  'كتابة / محتوى':             'teaching',
}

export function suggestCategory(activityType) {
  if (!activityType) return 'teaching'
  const key = activityType.trim().toLowerCase()
  if (!key) return 'teaching'
  if (SUGGESTION_TO_CATEGORY[key]) return SUGGESTION_TO_CATEGORY[key]
  // English + Arabic keyword fallbacks
  if (/umrah|hajj|عمرة|حج/.test(key)) return 'umrah_teaching'
  if (/travel|trip|journey|transport|سفر|رحلة|انتقال/.test(key)) return 'other'
  if (/construction|building|admin|supervis|بناء|إشراف|إدارة/.test(key)) return 'other'
  if (/visit|community|dawah|da'wah|outreach|nasihah|advice|دعوة|زيارة|مجتمع|نصيحة|توعية/.test(key)) return 'dawah'
  return 'teaching'
}

const MESSAGES = [
  'May Allah bless your efforts today.',
  'May Allah put barakah in every hour you give.',
  'May Allah make your tongue a means of guidance today.',
  'May Allah reward you for what only He witnesses.',
  'May Allah keep your intention pure and your patience strong.',
  'May Allah make the path of knowledge easy for you.',
  'May Allah accept from you, openly and in secret.',
  'May Allah grant you sincerity in every word you teach.',
  'May Allah raise you by what you give to His deen.',
  'May Allah make your effort today heavy on the scales.',
  'May Allah protect you from tiredness of the heart.',
  'May Allah grant you beneficial knowledge and sincere action.',
  'May Allah forgive what came before and guide what comes after.',
  'May Allah put love for the truth in the hearts of those you teach.',
  'May Allah make the masjid a resting place for your heart today.',
  'May Allah bless your family while you serve the ummah.',
  'May Allah make you of those who teach for His sake alone.',
  'May Allah reward every step toward the halaqah.',
  'May Allah expand your chest and ease your tongue.',
  'May Allah accept your dawah — quietly, abundantly.',
  'May Allah keep your feet firm on the path of the Salaf.',
  'May Allah give you ikhlas that matches your effort.',
  'May Allah grant you the hikmah of those who came before.',
  'May Allah make what you teach today outlive you.',
  'May Allah unite you with the Prophet ﷺ in the Hereafter.',
  'May Allah make your work a sadaqah jariyah.',
  'May Allah grant you company that reminds you of Him.',
  'May Allah give you strength when fatigue tries to visit.',
  'May Allah protect your heart from riya and your work from waste.',
  'May Allah bless your Fajr and ease your Isha.',
]

function dayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getDailyGreeting() {
  return MESSAGES[dayOfYear() % MESSAGES.length]
}

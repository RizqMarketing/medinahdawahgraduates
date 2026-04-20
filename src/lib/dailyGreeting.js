import i18n from '../i18n.js'

// Daily du'a rotation — shown on the graduate home page. 32 entries per
// language, both arrays kept the same length so day-N picks the same
// du'a across languages. Arabic entries use standard du'a phrasings
// (not literal translations of the English) so they read naturally.
//
// Per the project convention, these stay in the ACTIVE language rather
// than being forced Arabic in both modes — a graduate using the English
// UI sees transliterated/English-styled du'as, an Arabic user sees them
// in Arabic. The footer ayah in App.jsx and the impact ayah in
// SponsorDashboard are the ones that stay Arabic-only.

const MESSAGES_EN = [
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
  'May Allah grant you a heart attached to the masjid.',
  'May Allah make your knowledge a light on the Day of Judgement.',
]

const MESSAGES_AR = [
  'بارك الله في جهدك اليوم.',
  'بارك الله لك في كل ساعة تبذلها.',
  'جعل الله لسانك سبباً لهداية الخلق.',
  'جزاك الله خيراً على ما لا يطّلع عليه إلا هو.',
  'ثبّت الله نيّتك وقوّى صبرك.',
  'يسّر الله لك طريق العلم.',
  'تقبّل الله منك في السرّ والعلن.',
  'رزقك الله الإخلاص في كل كلمة تُعلّمها.',
  'رفع الله قدرك بما تقدّم لدينه.',
  'جعل الله عملك اليوم ثقيلاً في ميزان حسناتك.',
  'أعاذك الله من فتور القلب وكسل الجوارح.',
  'رزقك الله علماً نافعاً وعملاً خالصاً.',
  'غفر الله لك ما مضى وهداك في ما بقي.',
  'أسكن الله حبّ الحق في قلوب من تُعلّمهم.',
  'جعل الله المسجد راحةً لقلبك اليوم.',
  'بارك الله لك في أهلك وأنت تخدم الأمة.',
  'جعلك الله ممّن يُعلّم لوجهه الكريم.',
  'أجرك الله على كل خطوة نحو الحلقة.',
  'اشرح الله صدرك وأطلق لسانك بالحق.',
  'تقبّل الله منك دعوتك خفيةً وافرةً.',
  'ثبّت الله قدمك على منهج السلف الصالح.',
  'رزقك الله إخلاصاً يليق بجهدك.',
  'رزقك الله حكمة السابقين من أهل العلم.',
  'جعل الله ما تُعلّمه اليوم باقياً بعدك.',
  'جمعك الله بالنبي ﷺ في جنّات النعيم.',
  'جعل الله عملك صدقةً جاريةً إلى يوم الدين.',
  'رزقك الله صحبةً تُذكّرك به كلّما نسيت.',
  'قوّاك الله حين يحاول التعب زيارتك.',
  'أعاذ الله قلبك من الرياء وعملك من الضياع.',
  'بارك الله لك في فجرك ويسّر لك عشاءك.',
  'رزقك الله قلباً معلّقاً بالمسجد.',
  'جعل الله علمك نوراً يوم القيامة.',
]

function dayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getDailyGreeting() {
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const pool = lang === 'ar' ? MESSAGES_AR : MESSAGES_EN
  return pool[dayOfYear() % pool.length]
}

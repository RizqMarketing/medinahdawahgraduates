// WhatsApp deep-link helper.
//
// `https://wa.me/<international-digits>?text=<urlencoded-message>` opens
// WhatsApp web/desktop/mobile straight to that contact's chat with the
// message pre-filled. The recipient just hits send.

export function normalizePhone(raw) {
  if (!raw) return null
  // Strip every non-digit (spaces, parens, hyphens, leading +, etc.).
  const digits = String(raw).replace(/\D/g, '')
  return digits || null
}

export function buildWaLink({ phone, text }) {
  const digits = normalizePhone(phone)
  if (!digits) return null
  const params = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${params}`
}

// Bilingual late-plan reminder. Lang ordering: Arabic first then English so
// graduates in Arabic-first regions see their language up top, and English
// speakers still see the message clearly below.
export function buildPlanReminderText({ graduateName, monthLabel }) {
  const en = `Assalamu alaykum akhi ${graduateName ? graduateName + ' ' : ''}— this is a kind reminder to submit your plan for ${monthLabel} when you get a moment. JazakAllahu khayran.`
  const ar = `السلام عليكم أخي ${graduateName ? graduateName + ' ' : ''}— تذكير لطيف بإرسال خطتك لشهر ${monthLabel} عندما يتيسر لك. جزاك الله خيرًا.`
  return `${ar}\n\n${en}`
}

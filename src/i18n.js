import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.js'
import ar from './locales/ar.js'

export const SUPPORTED_LANGS = ['en', 'ar']
export const RTL_LANGS = new Set(['ar'])
// Bumped to v2 when Arabic became the default for everyone — wipes stale
// 'en' preferences cached during pre-launch testing so the new default
// actually takes effect on first load.
export const STORAGE_KEY = 'mdg.lang.v2'

// Apply <html dir> + <html lang> + translate="no" whenever the language
// changes. Called once at init and again on every changeLanguage.
// translate="no" stops browser auto-translation from silently rewriting
// our Arabic idioms and language-toggle controls.
export function applyDocumentDirection(lang) {
  const dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('translate', 'no')
    document.documentElement.classList.add('notranslate')
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'ar',
    supportedLngs: SUPPORTED_LANGS,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      // Arabic is the default for everyone. Only honor an explicit user
      // toggle persisted in localStorage; never fall back to navigator
      // locale, which would silently flip English-locale browsers to EN.
      order: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
    returnNull: false,
    // Warn in dev when a key is requested but missing — catches English-only
    // strings slipping into the Arabic bundle.
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing key: ${key} in ${lngs?.join(',')}`)
      }
    },
  })

// Apply direction immediately on init so the first render is already correct.
applyDocumentDirection(i18n.language || 'ar')

// Keep <html dir> in sync on every change.
i18n.on('languageChanged', (lng) => {
  applyDocumentDirection(lng)
})

export default i18n

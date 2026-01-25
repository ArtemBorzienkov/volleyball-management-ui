import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Cookies from 'js-cookie'

// Import translation files
// @ts-ignore - JSON imports are supported in Next.js
import enTranslations from '@/locales/en/common.json'
// @ts-ignore
import ukTranslations from '@/locales/uk/common.json'
// @ts-ignore
import plTranslations from '@/locales/pl/common.json'
// @ts-ignore
import beTranslations from '@/locales/be/common.json'

const resources = {
  en: {
    translation: enTranslations,
  },
  uk: {
    translation: ukTranslations,
  },
  pl: {
    translation: plTranslations,
  },
  be: {
    translation: beTranslations,
  },
}

// Custom cookie detector
const cookieDetector = {
  name: 'cookie',
  lookup() {
    return Cookies.get('i18next') || undefined
  },
  cacheUserLanguage(lng: string) {
    Cookies.set('i18next', lng, { expires: 365 })
  },
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: ['en', 'uk', 'pl', 'be'],
      detection: {
        order: ['cookie', 'localStorage', 'navigator'],
        caches: ['cookie', 'localStorage'],
        lookupCookie: 'i18next',
        cookieMinutes: 365 * 24 * 60, // 1 year
      },
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false,
      },
    })

  // Add custom cookie detector
  if (i18n.services.languageDetector) {
    i18n.services.languageDetector.addDetector(cookieDetector)
  }
}

export default i18n

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Safe cookie access for SSR
const getCookie = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined
  try {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
  } catch (e) {
    // Ignore errors
  }
  return undefined
}

const setCookie = (name: string, value: string, days: number) => {
  if (typeof window === 'undefined') return
  try {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  } catch (e) {
    // Ignore errors
  }
}

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
    return getCookie('i18next') || undefined
  },
  cacheUserLanguage(lng: string) {
    setCookie('i18next', lng, 365)
  },
}

if (!i18n.isInitialized) {
  // For SSR compatibility, always use 'en' on server
  // Client will detect and update language after hydration
  const isServer = typeof window === 'undefined'
  const initialLanguage = isServer ? 'en' : undefined

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage, // 'en' on server, undefined on client (will use detector)
      fallbackLng: 'en',
      supportedLngs: ['en', 'uk', 'pl', 'be'],
      detection: isServer
        ? undefined // Disable detection on server
        : {
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

  // Add custom cookie detector only on client
  if (!isServer && i18n.services.languageDetector) {
    i18n.services.languageDetector.addDetector(cookieDetector)
  }

  // Ensure language is set on server
  if (isServer && !i18n.language) {
    i18n.changeLanguage('en')
  }
}

export default i18n

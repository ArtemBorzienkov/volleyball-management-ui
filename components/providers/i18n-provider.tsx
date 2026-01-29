'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/config'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // On mount, ensure language is synced with localStorage immediately
    // This runs synchronously before any child components render
    const syncLanguage = () => {
      try {
        const storedLang = localStorage.getItem('i18nextLng')
        if (storedLang && ['en', 'uk', 'pl', 'be'].includes(storedLang)) {
          if (i18n.language !== storedLang) {
            // Change language synchronously - don't await to avoid blocking
            i18n.changeLanguage(storedLang)
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    syncLanguage()
  }, [])

  // Always render children - language should already be set correctly from config.ts
  // The useEffect above ensures it stays in sync
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

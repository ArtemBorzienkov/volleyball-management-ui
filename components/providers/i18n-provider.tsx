'use client'

import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/config'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Ensure i18n is initialized with default language if not already set
    if (!i18n.language) {
      i18n.changeLanguage('en')
    }
  }, [])

  // Always provide the provider to avoid hydration mismatches
  // The translations will be consistent once mounted
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

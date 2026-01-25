'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.lang = i18n.language
    }
  }, [i18n.language, mounted])

  return <>{children}</>
}

'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SiteFooter } from '@/components/site-footer'

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

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}

import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AnalyticsGate } from '@/components/analytics-gate'
import { QueryProvider } from '@/components/providers/query-provider'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/ui/toast'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { CookieConsentProvider } from '@/components/providers/cookie-consent-provider'
import { CookieConsentBanner } from '@/components/cookie-consent-banner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'SandStats - Beach Volleyball Analytics',
  description: 'Professional beach volleyball tournament management and player statistics platform',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {/* Outermost so nothing below it — analytics included — can run before a choice is on record. */}
        <CookieConsentProvider>
          <I18nProvider>
            <LayoutWrapper>
              <QueryProvider>
                <AuthProvider>
                  <ToastProvider>{children}</ToastProvider>
                </AuthProvider>
              </QueryProvider>
            </LayoutWrapper>
            <CookieConsentBanner />
          </I18nProvider>
          <AnalyticsGate />
        </CookieConsentProvider>
      </body>
    </html>
  )
}

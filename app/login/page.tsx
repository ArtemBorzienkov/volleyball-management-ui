'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('auth.logIn')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm onSuccess={() => router.push('/')} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

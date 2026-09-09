'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectInput } from '@/components/ui/select-input'
import { useAuth } from '@/components/providers/auth-provider'
import API from '@/lib/api'
import type { Player } from '@/lib/types'

const NEW_PLAYER_VALUE = 'new'

// Telegram's own rule for usernames, mirrored from the API's CreateUserDto so a bad value is caught
// before the request. Blank passes: the field is optional.
const TELEGRAM_NICKNAME_PATTERN = /^@?[A-Za-z0-9_]{5,32}$/

const registerSchema = z
  .object({
    telegramNickname: z
      .string()
      .refine((value) => value.trim() === '' || TELEGRAM_NICKNAME_PATTERN.test(value.trim()), {
        message: '5-32 letters, digits or underscores',
      }),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    playerId: z.string().min(1, 'Choose a player or create a new one'),
    newPlayerName: z.string(),
    newPlayerGender: z.string(),
    // Required, not merely offered: results are published under a player's name, and that needs a
    // lawful basis before the account exists (GDPR art. 6(1)(a)).
    acceptDataProcessing: z.literal(true, {
      errorMap: () => ({ message: 'You must accept how player data is processed' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.playerId !== NEW_PLAYER_VALUE || data.newPlayerName.trim().length > 0, {
    message: 'Player name is required',
    path: ['newPlayerName'],
  })
  .refine((data) => data.playerId !== NEW_PLAYER_VALUE || ['male', 'female'].includes(data.newPlayerGender), {
    message: 'Choose a gender',
    path: ['newPlayerGender'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { login } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: () => fetch(API.GET_ALL_PLAYERS).then((res) => res.json()),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      telegramNickname: '',
      email: '',
      password: '',
      confirmPassword: '',
      playerId: '',
      newPlayerName: '',
      newPlayerGender: '',
      // Never pre-ticked: a pre-ticked consent box is not consent (GDPR recital 32).
      acceptDataProcessing: false as unknown as true,
    },
  })

  const playerId = watch('playerId')
  const isCreatingNewPlayer = playerId === NEW_PLAYER_VALUE

  const onSubmit = async (data: RegisterFormData) => {
    setFormError(null)
    const res = await fetch(API.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        acceptDataProcessing: data.acceptDataProcessing,
        ...(data.telegramNickname.trim() ? { telegramNickname: data.telegramNickname.trim() } : {}),
        ...(data.playerId === NEW_PLAYER_VALUE
          ? { newPlayer: { name: data.newPlayerName.trim(), gender: data.newPlayerGender } }
          : { playerId: data.playerId }),
      }),
    })

    if (!res.ok) {
      if (res.status === 409) {
        const body = await res.json().catch(() => null)
        setFormError(body?.message ?? 'This email or player is already in use')
      } else {
        setFormError('Something went wrong')
      }
      return
    }

    try {
      await login(data.email, data.password)
      router.push('/')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="telegramNickname" className="text-sm font-medium" suppressHydrationWarning>
                  {t('auth.telegramLabel')}
                </label>
                <Input id="telegramNickname" placeholder="@nickname" {...register('telegramNickname')} />
                {errors.telegramNickname ? (
                  <p className="text-sm text-destructive">{errors.telegramNickname.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {t('auth.telegramHint')}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
              <Controller
                control={control}
                name="playerId"
                render={({ field }) => (
                  <SelectInput
                    name="playerId"
                    label="Your player"
                    placeholder="Select a player"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.playerId?.message}
                    // "Create new" stays a selectable VALUE here, not an addNewOption callback: the
                    // zod schema and the inline sub-form below both key off playerId === NEW_PLAYER_VALUE.
                    options={[
                      { value: NEW_PLAYER_VALUE, label: '＋ Create new player' },
                      ...players.map((player) => ({ value: player.id, label: player.name })),
                    ]}
                  />
                )}
              />
              {isCreatingNewPlayer && (
                <div className="flex flex-col gap-4 rounded-md border border-input p-3">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="newPlayerName" className="text-sm font-medium">
                      Player name
                    </label>
                    <Input id="newPlayerName" {...register('newPlayerName')} />
                    {errors.newPlayerName && (
                      <p className="text-sm text-destructive">{errors.newPlayerName.message}</p>
                    )}
                  </div>
                  <Controller
                    control={control}
                    name="newPlayerGender"
                    render={({ field }) => (
                      <SelectInput
                        name="newPlayerGender"
                        label="Gender"
                        placeholder="Select gender"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.newPlayerGender?.message}
                        options={[
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                        ]}
                      />
                    )}
                  />
                </div>
              )}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" {...register('acceptDataProcessing')} />
                <span className="flex flex-col gap-0.5">
                  <span suppressHydrationWarning>
                    {t('auth.consentLabel')}{' '}
                    <Link href="/privacy" className="text-primary underline underline-offset-4" target="_blank">
                      <span suppressHydrationWarning>{t('auth.consentLink')}</span>
                    </Link>
                  </span>
                  {errors.acceptDataProcessing && (
                    <span className="text-xs text-destructive">{errors.acceptDataProcessing.message}</span>
                  )}
                </span>
              </label>

              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Log in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

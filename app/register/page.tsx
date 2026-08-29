'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
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

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    playerId: z.string().min(1, 'Choose a player or create a new one'),
    newPlayerName: z.string(),
    newPlayerGender: z.string(),
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
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      playerId: '',
      newPlayerName: '',
      newPlayerGender: '',
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
        name: data.name,
        email: data.email,
        password: data.password,
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
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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

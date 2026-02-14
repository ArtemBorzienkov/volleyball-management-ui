'use client'

import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import API from '@/lib/api'
import type { Player } from '@/lib/types'
import * as XLSX from 'xlsx'

export default function AddResultsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false)
  const [fieldToUpdate, setFieldToUpdate] = useState<{
    gameIndex?: number
    placeIndex?: number
    fieldName?: 'team1Player1' | 'team1Player2' | 'team2Player1' | 'team2Player2'
    type: 'game' | 'place'
  } | null>(null)

  // Fetch all players
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: () => fetch(API.GET_ALL_PLAYERS).then((res) => res.json()),
  })

  // Form for adding results
  type GameResult = {
    team1Player1: string
    team1Player2: string
    team2Player1: string
    team2Player2: string
    team1Points: number
    team2Points: number
  }

  type PlaceResult = {
    place: string
    playerId: string
  }

  type FormData = {
    eventName: string
    eventDate: string
    eventLocation: string
    places: PlaceResult[]
    games: GameResult[]
  }

  const { register, handleSubmit, control, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      eventName: '',
      eventDate: '',
      eventLocation: '',
      places: [
        {
          place: '',
          playerId: '',
        },
      ],
      games: [
        {
          team1Player1: '',
          team1Player2: '',
          team2Player1: '',
          team2Player2: '',
          team1Points: 0,
          team2Points: 0,
        },
      ],
    },
  })

  const { fields: gameFields, append: appendGame, remove: removeGame } = useFieldArray({
    control,
    name: 'games',
  })

  const { fields: placeFields, append: appendPlace, remove: removePlace } = useFieldArray({
    control,
    name: 'places',
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Form for creating a new player
  type CreatePlayerFormData = {
    name: string
    gender?: string
    avatar?: string
  }

  const {
    register: registerPlayer,
    handleSubmit: handleSubmitPlayer,
    reset: resetPlayerForm,
    control: controlPlayer,
    formState: { errors: playerErrors },
  } = useForm<CreatePlayerFormData>({
    defaultValues: {
      name: '',
      gender: '',
      avatar: '',
    },
  })

  const handleSelectResultFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const playerNamesMap = new Map<string, Player>(players.map((player) => [player.name, player]))

    const fileReader = new FileReader()
    fileReader.onload = (event: ProgressEvent<FileReader>) => {
      const data = event.target?.result
      if (!data) {
        return
      }

      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      
      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      const rowsWithData = jsonData.reduce((acc: never[], row: any) => {
        if (row && row.length > 0) {
          const parsedRow = row.filter((cell: never) => cell !== null && cell !== undefined)
          if (parsedRow.length > 0) {
            acc.push(parsedRow as never)
          }
        }
        return acc
      }, [] as never[])

      let isPlacesRowPassed = false
      let isGamesRowPassed = false

      const {places, games} = rowsWithData.reduce((acc:{places: PlaceResult[], games: GameResult[]}, row: string[] | number[]) => {
        if (row.some((cell: string | number) => cell && typeof cell === 'string' && cell.toLowerCase() === 'places')) {
          isPlacesRowPassed = true
          return acc
        }
        if (row.some((cell: string | number) => cell && typeof cell === 'string' && cell.toLowerCase() === 'games')) {
          isGamesRowPassed = true
          return acc
        }

        if (isGamesRowPassed) {
          const [team1Player1, team1Player2, team1Points, team2Points, team2Player1, team2Player2] = row
          return {
            ...acc,
            games: [...acc.games, {
              team1Player1: playerNamesMap.get(team1Player1 as string)?.id || '',
              team1Player2: playerNamesMap.get(team1Player2 as string)?.id || '',
              team1Points,
              team2Points,
              team2Player1: playerNamesMap.get(team2Player1 as string)?.id || '',
              team2Player2: playerNamesMap.get(team2Player2 as string)?.id || '',
            } as GameResult]
          }
        }

        if (isPlacesRowPassed) {
          const [place, playerName] = row
          return {
            ...acc,
            places: [...acc.places, {
              place: place.toString(),
              playerId: playerNamesMap.get(playerName as string)?.id || '',
            } as PlaceResult]
          }
        }

        return acc
      }, {places: [], games: []} as {places: PlaceResult[], games: GameResult[]})

      setValue('games', games)
      setValue('places', places)
    }
    fileReader.readAsBinaryString(file)
  }

  // Mutation for creating a new player
  const createPlayerMutation = useMutation({
    mutationFn: async (payload: CreatePlayerFormData) => {
      const response = await fetch(API.CREATE_PLAYER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: payload.name,
          gender: payload.gender || undefined,
          avatar: payload.avatar || undefined,
          active: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to create player',
        }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return response.json()
    },
    onSuccess: async (newPlayer: Player) => {
      // Invalidate and refetch players list
      await queryClient.invalidateQueries({ queryKey: ['players'] })
      
      // If we have a field to update, set it to the new player's ID
      if (fieldToUpdate) {
        // Wait a bit for the players list to refresh, then update the field
        setTimeout(() => {
          if (fieldToUpdate.type === 'game' && fieldToUpdate.gameIndex !== undefined && fieldToUpdate.fieldName) {
            const { gameIndex, fieldName } = fieldToUpdate
            if (fieldName === 'team1Player1') {
              setValue(`games.${gameIndex}.team1Player1`, newPlayer.id)
            } else if (fieldName === 'team1Player2') {
              setValue(`games.${gameIndex}.team1Player2`, newPlayer.id)
            } else if (fieldName === 'team2Player1') {
              setValue(`games.${gameIndex}.team2Player1`, newPlayer.id)
            } else if (fieldName === 'team2Player2') {
              setValue(`games.${gameIndex}.team2Player2`, newPlayer.id)
            }
          } else if (fieldToUpdate.type === 'place' && fieldToUpdate.placeIndex !== undefined) {
            setValue(`places.${fieldToUpdate.placeIndex}.playerId`, newPlayer.id)
          }
        }, 300)
      }
      
      setIsAddPlayerModalOpen(false)
      resetPlayerForm()
      setFieldToUpdate(null)
    },
    onError: (error: Error) => {
      console.error('Failed to create player:', error)
    },
  })

  const onAddPlayerSubmit = (data: CreatePlayerFormData) => {
    createPlayerMutation.mutate(data)
  }

  const handleAddNewPlayerClick = (
    gameIndex: number,
    fieldName: 'team1Player1' | 'team1Player2' | 'team2Player1' | 'team2Player2'
  ) => {
    setFieldToUpdate({ gameIndex, fieldName, type: 'game' })
    setIsAddPlayerModalOpen(true)
  }

  const handleAddNewPlayerForPlace = (placeIndex: number) => {
    setFieldToUpdate({ placeIndex, type: 'place' })
    setIsAddPlayerModalOpen(true)
  }

  const createEventWithGamesMutation = useMutation({
    mutationFn: async (payload: {
      name: string
      date: string
      location?: string
      places?: Record<string, string[]>
      games: Array<{
        team1Player1Id: string
        team1Player2Id: string
        team2Player1Id: string
        team2Player2Id: string
        team1Points: number
        team2Points: number
      }>
    }) => {
      const response = await fetch(API.CREATE_EVENT_WITH_GAMES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to create event with games',
        }))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return response.json()
    },
    onSuccess: () => {
      setSubmitSuccess(true)
      setSubmitError(null)
      reset()
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000)
    },
    onError: (error: Error) => {
      setSubmitError(error.message || 'Failed to submit results. Please try again.')
      setSubmitSuccess(false)
    },
  })

  const onSubmit = (data: FormData) => {
    setSubmitError(null)
    setSubmitSuccess(false)

    // Transform places array to JSON object (place number -> array of player IDs)
    const placesObject: Record<string, string[]> = {}
    data.places.forEach((place) => {
      if (place.place && place.playerId) {
        if (!placesObject[place.place]) {
          placesObject[place.place] = []
        }
        placesObject[place.place].push(place.playerId)
      }
    })

    // Transform form data to match backend DTO structure
    const payload = {
      name: data.eventName,
      date: data.eventDate,
      location: data.eventLocation || undefined,
      places: Object.keys(placesObject).length > 0 ? placesObject : undefined,
      games: data.games.map((game) => ({
        team1Player1Id: game.team1Player1,
        team1Player2Id: game.team1Player2,
        team2Player1Id: game.team2Player1,
        team2Player2Id: game.team2Player2,
        team1Points: game.team1Points,
        team2Points: game.team2Points,
      })),
    }

    createEventWithGamesMutation.mutate(payload)
  }

  if (isLoadingPlayers) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="flex justify-between items-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('addResults.title')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('addResults.subtitle')}
            </p>
          </div>
          <div className="mb-8">
            <Input type="file" placeholder={'Upload xlsx file'} onChange={handleSelectResultFile} />
          </div>
        </div>

        {/* Add Results Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('addResults.cardTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Event Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">{t('addResults.eventInformation')}</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label htmlFor="eventName" className="text-sm font-medium">
                      {t('addResults.eventName')}
                    </label>
                    <Input
                      id="eventName"
                      placeholder={t('addResults.eventNamePlaceholder')}
                      {...register('eventName', { required: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="eventDate" className="text-sm font-medium">
                      {t('addResults.date')}
                    </label>
                    <Input
                      id="eventDate"
                      type="date"
                      {...register('eventDate', { required: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="eventLocation" className="text-sm font-medium">
                      {t('addResults.location')}
                    </label>
                    <Input
                      id="eventLocation"
                      placeholder={t('addResults.locationPlaceholder')}
                      {...register('eventLocation', { required: true })}
                    />
                  </div>
                </div>
              </div>

              {/* Tournament Places */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">{t('addResults.tournamentPlaces')}</h3>
                {placeFields.map((field, index) => (
                  <div key={field.id} className="space-y-4 rounded-lg border p-4 relative">
                    {placeFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removePlace(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">{t('addResults.place')}</label>
                        <Controller
                          name={`places.${index}.place`}
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('addResults.selectPlace')} />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((placeNum) => (
                                  <SelectItem key={placeNum} value={placeNum.toString()}>
                                    {placeNum}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">{t('addResults.player')}</label>
                        <Controller
                          name={`places.${index}.playerId`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={(value) => {
                                if (value === '__add_new__') {
                                  handleAddNewPlayerForPlace(index)
                                } else {
                                  field.onChange(value)
                                }
                              }}
                              value={field.value}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('addResults.selectPlayer')} />
                              </SelectTrigger>
                              <SelectContent>
                                {players.map((player) => (
                                  <SelectItem key={player.id} value={player.id}>
                                    {player.name}
                                  </SelectItem>
                                ))}
                                <SelectItem
                                  value="__add_new__"
                                  className="text-primary font-medium"
                                >
                                  <Plus className="h-4 w-4 inline mr-2" />
                                  {t('addResults.addNewPlayer')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendPlace({
                      place: '',
                      playerId: '',
                    })
                  }
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addResults.addAnotherPlace')}
                </Button>
              </div>

              {/* Game Results */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">{t('addResults.gameResults')}</h3>

                {gameFields.map((field, index) => (
                  <div key={field.id} className="space-y-4 rounded-lg border p-4 relative">
                    {gameFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeGame(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <h4 className="text-sm font-medium">{t('addResults.game')} {index + 1}</h4>
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Team 1 */}
                      <div className="space-y-4 rounded-lg border p-4">
                        <h5 className="text-xs font-medium">{t('addResults.team1')}</h5>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">{t('addResults.player1')}</label>
                            <Controller
                              name={`games.${index}.team1Player1`}
                              control={control}
                              rules={{ required: true }}
                              render={({ field }) => (
                                <Select
                                  onValueChange={(value) => {
                                    if (value === '__add_new__') {
                                      handleAddNewPlayerClick(index, 'team1Player1')
                                    } else {
                                      field.onChange(value)
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select player" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {players.map((player) => (
                                      <SelectItem key={player.id} value={player.id}>
                                        {player.name}
                                      </SelectItem>
                                    ))}
                                    <SelectItem
                                      value="__add_new__"
                                      className="text-primary font-medium"
                                    >
                                      <Plus className="h-4 w-4 inline mr-2" />
                                      {t('addResults.addNewPlayer')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">{t('addResults.player2')}</label>
                            <Controller
                              name={`games.${index}.team1Player2`}
                              control={control}
                              rules={{ required: true }}
                              render={({ field }) => (
                                <Select
                                  onValueChange={(value) => {
                                    if (value === '__add_new__') {
                                      handleAddNewPlayerClick(index, 'team1Player2')
                                    } else {
                                      field.onChange(value)
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select player" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {players.map((player) => (
                                      <SelectItem key={player.id} value={player.id}>
                                        {player.name}
                                      </SelectItem>
                                    ))}
                                    <SelectItem
                                      value="__add_new__"
                                      className="text-primary font-medium"
                                    >
                                      <Plus className="h-4 w-4 inline mr-2" />
                                      {t('addResults.addNewPlayer')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">{t('addResults.points')}</label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...register(`games.${index}.team1Points`, {
                              required: true,
                              min: 0,
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="space-y-4 rounded-lg border p-4">
                        <h5 className="text-xs font-medium">{t('addResults.team2')}</h5>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Player 1</label>
                            <Controller
                              name={`games.${index}.team2Player1`}
                              control={control}
                              rules={{ required: true }}
                              render={({ field }) => (
                                <Select
                                  onValueChange={(value) => {
                                    if (value === '__add_new__') {
                                      handleAddNewPlayerClick(index, 'team2Player1')
                                    } else {
                                      field.onChange(value)
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select player" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {players.map((player) => (
                                      <SelectItem key={player.id} value={player.id}>
                                        {player.name}
                                      </SelectItem>
                                    ))}
                                    <SelectItem
                                      value="__add_new__"
                                      className="text-primary font-medium"
                                    >
                                      <Plus className="h-4 w-4 inline mr-2" />
                                      {t('addResults.addNewPlayer')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">{t('addResults.player2')}</label>
                            <Controller
                              name={`games.${index}.team2Player2`}
                              control={control}
                              rules={{ required: true }}
                              render={({ field }) => (
                                <Select
                                  onValueChange={(value) => {
                                    if (value === '__add_new__') {
                                      handleAddNewPlayerClick(index, 'team2Player2')
                                    } else {
                                      field.onChange(value)
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select player" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {players.map((player) => (
                                      <SelectItem key={player.id} value={player.id}>
                                        {player.name}
                                      </SelectItem>
                                    ))}
                                    <SelectItem
                                      value="__add_new__"
                                      className="text-primary font-medium"
                                    >
                                      <Plus className="h-4 w-4 inline mr-2" />
                                      {t('addResults.addNewPlayer')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">{t('addResults.points')}</label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...register(`games.${index}.team2Points`, {
                              required: true,
                              min: 0,
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendGame({
                      team1Player1: '',
                      team1Player2: '',
                      team2Player1: '',
                      team2Player2: '',
                      team1Points: 0,
                      team2Points: 0,
                    })
                  }
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addResults.addOneMoreGame')}
                </Button>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              )}

              {/* Success Message */}
              {submitSuccess && (
                <div className="rounded-lg border border-green-500 bg-green-500/10 p-4">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {t('addResults.success')}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset()
                    setSubmitError(null)
                    setSubmitSuccess(false)
                  }}
                  disabled={createEventWithGamesMutation.isPending}
                >
                  {t('addResults.reset')}
                </Button>
                <Button
                  type="submit"
                  disabled={createEventWithGamesMutation.isPending}
                >
                  {createEventWithGamesMutation.isPending
                    ? t('addResults.submitting')
                    : t('addResults.submit')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Add New Player Modal */}
        <Dialog open={isAddPlayerModalOpen} onOpenChange={setIsAddPlayerModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addResults.addPlayerModal.title')}</DialogTitle>
              <DialogDescription>
                {t('addResults.addPlayerModal.description')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitPlayer(onAddPlayerSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="playerName" className="text-sm font-medium">
                  {t('addResults.addPlayerModal.name')} <span className="text-destructive">*</span>
                </label>
                <Input
                  id="playerName"
                  placeholder={t('addResults.addPlayerModal.namePlaceholder')}
                  {...registerPlayer('name', { required: t('addResults.addPlayerModal.nameRequired') })}
                />
                {playerErrors.name && (
                  <p className="text-sm text-destructive">{playerErrors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="playerGender" className="text-sm font-medium">
                  {t('addResults.addPlayerModal.gender')}
                </label>
                <Controller
                  name="gender"
                  control={controlPlayer}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('addResults.addPlayerModal.genderPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('addResults.addPlayerModal.male')}</SelectItem>
                        <SelectItem value="female">{t('addResults.addPlayerModal.female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="playerAvatar" className="text-sm font-medium">
                  {t('addResults.addPlayerModal.avatarUrl')}
                </label>
                <Input
                  id="playerAvatar"
                  type="url"
                  placeholder={t('addResults.addPlayerModal.avatarPlaceholder')}
                  {...registerPlayer('avatar')}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddPlayerModalOpen(false)
                    resetPlayerForm()
                    setFieldToUpdate(null)
                  }}
                  disabled={createPlayerMutation.isPending}
                >
                  {t('addResults.addPlayerModal.cancel')}
                </Button>
                <Button type="submit" disabled={createPlayerMutation.isPending}>
                  {createPlayerMutation.isPending ? t('addResults.addPlayerModal.creating') : t('addResults.addPlayerModal.create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

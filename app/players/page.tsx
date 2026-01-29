'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Filter, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import API from '@/lib/api'
import type { FullPlayer } from '@/lib/types'
import { GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon } from '@/components/medal-icons'
import { CheckCircle2, XCircle } from 'lucide-react'
import { GenderFilter, type GenderFilter as GenderFilterType } from '@/components/gender-filter'

const Loading = () => null

function PlayersPageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('query') || '')
  const [genderFilter, setGenderFilter] = useState<GenderFilterType>('ALL')

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Players</h1>
            <p className="mt-1 text-muted-foreground">
              Browse and search through all registered players.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <GenderFilter value={genderFilter} onChange={setGenderFilter} />
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <PlayersContent searchQuery={searchQuery} genderFilter={genderFilter} />
      </main>
    </div>
  )
}

function PlayersContent({ searchQuery, genderFilter }: { searchQuery: string; genderFilter: GenderFilterType }) {
  const { t } = useTranslation()
  
  // Fetch full players with extended stats
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<FullPlayer[]>({
    queryKey: ['full-players'],
    queryFn: () => fetch(API.GET_FULL_PLAYERS).then((res) => res.json()),
  })

  const filteredPlayers = players
    .filter((player) => {
      // Filter by gender first
      if (genderFilter === 'W' && player.gender !== 'female') return false
      if (genderFilter === 'M' && player.gender !== 'male') return false
      // Then filter by search query
      return player.name.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      {isLoadingPlayers ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground/50 animate-pulse" />
            <p className="mt-4 text-lg font-medium">Loading players...</p>
          </CardContent>
        </Card>
      ) : filteredPlayers.length > 0 ? (
        <Card className="py-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>
                    {t('nav.players')} ({filteredPlayers.length})
                  </TableHead>
                  <TableHead className="text-center">{t('home.topPlayers.totalTournaments')}</TableHead>
                  <TableHead className="text-center">{t('home.topPlayers.tournamentResults')}</TableHead>
                  <TableHead className="text-center">{t('home.topPlayers.totalGames')}</TableHead>
                  <TableHead className="text-center">WR %</TableHead>
                  <TableHead className="text-center">{t('home.topPlayers.lastGames')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map((player) => (
                  <TableRow key={player.id} className="cursor-pointer hover:bg-secondary/50">
                    <TableCell className="pl-8">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[#4F403D] text-[#BDBDBD] font-semibold text-sm">
                            {player.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell>
                        {player.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">
                        {player.totalEvents}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="flex items-center gap-1">
                          {player.medals.gold}
                          <GoldMedalIcon className="h-4 w-4" />
                        </span>
                        <span className="flex items-center gap-1">
                          {player.medals.silver}
                          <SilverMedalIcon className="h-4 w-4" />
                        </span>
                        <span className="flex items-center gap-1">
                          {player.medals.bronze}
                          <BronzeMedalIcon className="h-4 w-4" />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">
                        {player.totalGames}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-muted-foreground">
                          {Math.round(player.winRate)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {player.recentGames && player.recentGames.length > 0 && (
                        <div className="flex items-center justify-center gap-1.5">
                          {[...player.recentGames].reverse().map((result, idx) => (
                            <div key={idx} title={result === 'win' ? 'Win' : 'Loss'}>
                              {result === 'win' ? (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                </div>
                              ) : (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
                                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No players found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PlayersPageContent />
    </Suspense>
  )
}

'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { StatCard } from '@/components/stat-card'
import { PlayerCard } from '@/components/player-card'
import { GenderFilter, type GenderFilter as GenderFilterType } from '@/components/gender-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Users, Trophy, Calendar, TrendingUp, HelpCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import API from '@/lib/api'
import type { Player, Game, Event, TeamStats, PlayerRanking, MedalCounts } from '@/lib/types'
import { getPlayerWinRate } from '@/lib/data'
import { GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon } from '@/components/medal-icons'

interface GroupedRankingResponse {
  ALL: PlayerRanking[]
  W: PlayerRanking[]
  M: PlayerRanking[]
}

export default function HomePage() {
  const { t } = useTranslation()
  const [genderFilter, setGenderFilter] = useState<GenderFilterType>('ALL')
  // Fetch all players
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: () => fetch(API.GET_ALL_PLAYERS).then((res) => res.json()),
  })

  // Fetch top players by won events (limit to 10) - grouped by gender
  const { data: topPlayersByWonEventsGrouped, isLoading: isLoadingTopPlayersByWonEvents } = useQuery<GroupedRankingResponse>({
    queryKey: ['top-players-won-events'],
    queryFn: () => fetch(`${API.GET_TOP_PLAYERS_BY_WON_EVENTS}?limit=10`).then((res) => res.json()),
  })

  // Fetch top players by win rate (limit to 10) - grouped by gender
  const { data: topPlayersByWinRateGrouped, isLoading: isLoadingTopPlayersByWinRate } = useQuery<GroupedRankingResponse>({
    queryKey: ['top-players-win-rate'],
    queryFn: () => fetch(`${API.GET_TOP_PLAYERS_BY_WIN_RATE}?limit=10`).then((res) => res.json()),
  })

  // Fetch top players by rank (limit to 10) - grouped by gender
  const { data: topRankPlayersGrouped, isLoading: isLoadingTopRankPlayers } = useQuery<GroupedRankingResponse>({
    queryKey: ['top-players-rank'],
    queryFn: () => fetch(`${API.GET_TOP_PLAYERS_BY_RANK}?limit=10`).then((res) => res.json()),
  })

  // Get filtered data based on selected gender filter
  const topPlayersByWonEvents = topPlayersByWonEventsGrouped?.[genderFilter] || []
  const topPlayersByWinRate = topPlayersByWinRateGrouped?.[genderFilter] || []
  const topRankPlayers = topRankPlayersGrouped?.[genderFilter] || []

  // Fetch all games and get recent ones (limit to 4)
  const { data: gamesData, isLoading: isLoadingGames } = useQuery<{ games: Game[]; allGamesCount: number }>({
    queryKey: ['games'],
    queryFn: () => fetch(API.GET_ALL_GAMES).then((res) => res.json()),
  })

  const {allGamesCount} = gamesData || { allGamesCount: 0 }

  // Fetch best team combinations (limit to 3)
  const { data: bestTeams = [], isLoading: isLoadingTeams } = useQuery<TeamStats[]>({
    queryKey: ['best-teams'],
    queryFn: () => fetch(API.GET_BEST_TEAM_COMBINATIONS).then((res) => res.json()),
    select: (data) => data.slice(0, 3),
  })

  // Fetch all events and filter upcoming ones
  const { data: allEvents = {events: [], page: 1, hasMore: false, totalEvents: 0}, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetch(API.GET_ALL_EVENTS).then(async (res) => {
      const {events, page, hasMore, totalEvents} = await res.json()
      return {events, page, hasMore, totalEvents}
    }),
  })

  const isLoading =
    isLoadingPlayers || 
    isLoadingTopPlayersByWonEvents || 
    isLoadingTopPlayersByWinRate || 
    isLoadingTopRankPlayers || 
    isLoadingGames || 
    isLoadingTeams || 
    isLoadingEvents

  const upcomingEvents = allEvents.events.filter((e: Event) => e.status === 'upcoming')
  const activePlayers = players.filter((p) => p.active).length

  // Calculate average win rate for top 10 players
  const calculateAvgWinRate = () => {
    if (topPlayersByWinRate.length === 0) return 0
    const sum = topPlayersByWinRate.reduce((acc, ranking) => {
      const value = typeof ranking.value === 'number' ? ranking.value : 0
      return acc + value
    }, 0)
    return Math.round(sum / topPlayersByWinRate.length)
  }
  const avgWinRate = calculateAvgWinRate()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground" suppressHydrationWarning>{t('common.loading')}</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('home.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('home.stats.activePlayers')}
            value={activePlayers}
            description={`${players.length} ${t('home.statsDescriptions.totalRegistered')}`}
            icon={Users}
          />
          <StatCard
            title={t('home.stats.totalGames')}
            value={allGamesCount}
            description={t('home.statsDescriptions.acrossAllTournaments')}
            icon={Trophy}
          />
          <StatCard
            title={t('home.stats.tournaments')}
            value={allEvents.totalEvents}
            description={`${upcomingEvents.length} ${t('home.statsDescriptions.upcoming')}`}
            icon={Calendar}
          />
          <StatCard
            title={t('home.stats.avgWinRate')}
            value={`${avgWinRate}%`}
            description={t('home.statsDescriptions.top10Players')}
            icon={TrendingUp}
          />
        </div>
        {/* Top Players - 1 Columns */}
        <div className="mb-8">
          <div className="mx-auto max-w-7xl">
            {/* Gender Filter */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('home.topPlayers.title')}</h2>
              <GenderFilter value={genderFilter} onChange={setGenderFilter} />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Column 1: Top Players by Rank */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {t('home.topPlayers.byRank')}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="inline-flex items-center justify-center">
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="max-w-xs">
                        <p className="text-sm">{t('home.topPlayers.rankExplanation')}</p>
                      </PopoverContent>
                    </Popover>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {topRankPlayers.length > 0 ? (
                    topRankPlayers.map((ranking) => {
                      const rank = typeof ranking.value === 'number' ? ranking.value : 0
                      const totalGames = ranking.player.totalGames || 0
                      return (
                        <PlayerCard 
                          key={`rank-${ranking.player.id}-${ranking.rank}`} 
                          player={ranking.player} 
                          rank={ranking.rank} 
                          hasBorder={false}
                          statsContent={
                            <>
                              <span>
                                {t('home.topPlayers.rank')}: {typeof rank === 'number' ? rank : 0}
                              </span>
                              <span>
                                {totalGames} {t('home.topPlayers.totalGames')}
                              </span>
                            </>
                          }
                        />
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground p-4">{t('home.topPlayers.noPlayers')}</p>
                  )}
                </CardContent>
              </Card>
              {/* Column 2: Top Players by Won Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('home.topPlayers.byWonEvents')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {topPlayersByWonEvents.length > 0 ? (
                    topPlayersByWonEvents.map((ranking) => {
                      // Check if value is a MedalCounts object
                      const isMedalValue = (value: number | MedalCounts): value is MedalCounts => {
                        return typeof value === 'object' && 'gold' in value && 'silver' in value && 'bronze' in value
                      }

                      const medalCounts = isMedalValue(ranking.value) ? ranking.value : null
                      const totalEvents = ranking.totalEvents || 0

                      return (
                        <PlayerCard 
                          key={`won-events-${ranking.player.id}-${ranking.rank}`} 
                          player={ranking.player} 
                          rank={ranking.rank} 
                          hasBorder={false}
                          statsContent={
                            medalCounts ? (
                              <div className="flex items-center gap-2">
                                <span>
                                  {totalEvents} {t('home.topPlayers.total')}
                                </span>
                                <span className="flex items-center gap-1">
                                  {medalCounts.gold}
                                  <GoldMedalIcon className="h-4 w-4" />
                                </span>
                                <span className="flex items-center gap-1">
                                  {medalCounts.silver}
                                  <SilverMedalIcon className="h-4 w-4" />
                                </span>
                                <span className="flex items-center gap-1">
                                  {medalCounts.bronze}
                                  <BronzeMedalIcon className="h-4 w-4" />
                                </span>
                              </div>
                            ) : null
                          }
                        />
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground p-4">{t('home.topPlayers.noPlayers')}</p>
                  )}
                </CardContent>
              </Card>

              {/* Column 2: Top Players by Win Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('home.topPlayers.byWinRate')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {topPlayersByWinRate.length > 0 ? (
                    topPlayersByWinRate.map((ranking) => {
                      const winRate = getPlayerWinRate(ranking.player)
                      return (
                        <PlayerCard 
                          key={`win-rate-${ranking.player.id}-${ranking.rank}`} 
                          player={ranking.player} 
                          rank={ranking.rank} 
                          hasBorder={false}
                          statsContent={
                            <>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {winRate}% WR
                              </span>
                              <span>
                                {ranking.player.totalWins}W - {ranking.player.totalLosses}L
                              </span>
                            </>
                          }
                        />
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground p-4">{t('home.topPlayers.noPlayers')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

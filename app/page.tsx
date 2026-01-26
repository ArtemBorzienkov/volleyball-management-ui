'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { StatCard } from '@/components/stat-card'
import { PlayerCard } from '@/components/player-card'
import { GenderFilter, type GenderFilter as GenderFilterType } from '@/components/gender-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Trophy, Calendar, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import API from '@/lib/api'
import type { Player, Game, Event, TeamStats, PlayerRanking } from '@/lib/types'

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

  // Fetch top players by games played (limit to 10) - grouped by gender
  const { data: topPlayersByGamesPlayedGrouped, isLoading: isLoadingTopPlayersByGamesPlayed } = useQuery<GroupedRankingResponse>({
    queryKey: ['top-players-games-played'],
    queryFn: () => fetch(`${API.GET_TOP_PLAYERS_BY_GAMES_PLAYED}?limit=10`).then((res) => res.json()),
  })

  // Get filtered data based on selected gender filter
  const topPlayersByWonEvents = topPlayersByWonEventsGrouped?.[genderFilter] || []
  const topPlayersByWinRate = topPlayersByWinRateGrouped?.[genderFilter] || []
  const topPlayersByGamesPlayed = topPlayersByGamesPlayedGrouped?.[genderFilter] || []

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
  const { data: allEvents = [], isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => fetch(API.GET_ALL_EVENTS).then((res) => res.json()),
  })

  const isLoading =
    isLoadingPlayers || 
    isLoadingTopPlayersByWonEvents || 
    isLoadingTopPlayersByWinRate || 
    isLoadingTopPlayersByGamesPlayed || 
    isLoadingGames || 
    isLoadingTeams || 
    isLoadingEvents

  const upcomingEvents = allEvents.filter((e) => e.status === 'upcoming')
  const activePlayers = players.filter((p) => p.active).length

  // Calculate average win rate for top 10 players
  const calculateAvgWinRate = () => {
    if (topPlayersByWinRate.length === 0) return 0
    const sum = topPlayersByWinRate.reduce((acc, ranking) => acc + ranking.value, 0)
    return Math.round(sum / topPlayersByWinRate.length)
  }
  const avgWinRate = calculateAvgWinRate()

  if (isLoading) {
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
            value={allEvents.length}
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

        {/* Top Players - 3 Columns */}
        <div className="mb-8">
          <div className="mx-auto max-w-7xl">
            {/* Gender Filter */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('home.topPlayers.title')}</h2>
              <GenderFilter value={genderFilter} onChange={setGenderFilter} />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Column 1: Top Players by Won Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('home.topPlayers.byWonEvents')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {topPlayersByWonEvents.length > 0 ? (
                    topPlayersByWonEvents.map((ranking) => (
                      <PlayerCard 
                        key={`won-events-${ranking.player.id}-${ranking.rank}`} 
                        player={ranking.player} 
                        rank={ranking.rank} 
                        hasBorder={false}
                        metric={ranking.metric}
                        totalEvents={ranking.totalEvents}
                        eventsWon={ranking.eventsWon}
                      />
                    ))
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
                    topPlayersByWinRate.map((ranking) => (
                      <PlayerCard 
                        key={`win-rate-${ranking.player.id}-${ranking.rank}`} 
                        player={ranking.player} 
                        rank={ranking.rank} 
                        hasBorder={false}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground p-4">{t('home.topPlayers.noPlayers')}</p>
                  )}
                </CardContent>
              </Card>

              {/* Column 3: Top Players by Games Played */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('home.topPlayers.byGamesPlayed')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {topPlayersByGamesPlayed.length > 0 ? (
                    topPlayersByGamesPlayed.map((ranking) => (
                      <PlayerCard 
                        key={`games-played-${ranking.player.id}-${ranking.rank}`} 
                        player={ranking.player} 
                        rank={ranking.rank} 
                        hasBorder={false}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground p-4">{t('home.topPlayers.noPlayers')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Recent Games */}
        {/* <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Games</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/games">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentGames.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {recentGames.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent games found.</p>
              )}
            </CardContent>
          </Card>
        </div> */}
      </main>
    </div>
  )
}

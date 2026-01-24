'use client'

import { Navigation } from '@/components/navigation'
import { StatCard } from '@/components/stat-card'
import { PlayerCard } from '@/components/player-card'
import { GameCard } from '@/components/game-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Trophy, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import API from '@/lib/api'
import type { Player, Game, Event, TeamStats, PlayerRanking } from '@/lib/types'

export default function HomePage() {
  // Fetch all players
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: () => fetch(API.GET_ALL_PLAYERS).then((res) => res.json()),
  })

  // Fetch top players by wins (limit to 5)
  const { data: topPlayersRankings = [], isLoading: isLoadingTopPlayers } = useQuery<PlayerRanking[]>({
    queryKey: ['top-players'],
    queryFn: () => fetch(API.GET_TOP_PLAYERS_BY_WINS).then((res) => res.json()),
    select: (data) => data.slice(0, 5),
  })
  
  // Extract players from rankings
  const topPlayers: Player[] = topPlayersRankings.map((ranking) => ranking.player)

  // Fetch all games and get recent ones (limit to 4)
  const { data: allGames = [], isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ['games'],
    queryFn: () => fetch(API.GET_ALL_GAMES).then((res) => res.json()),
    select: (data) =>
      [...data]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4),
  })

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
    isLoadingPlayers || isLoadingTopPlayers || isLoadingGames || isLoadingTeams || isLoadingEvents

  const upcomingEvents = allEvents.filter((e) => e.status === 'upcoming')
  const activePlayers = players.filter((p) => p.active).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
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
            Beach Volleyball Analytics
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track tournaments, analyze player performance, and discover winning combinations.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Players"
            value={activePlayers}
            description={`${players.length} total registered`}
            icon={Users}
          />
          <StatCard
            title="Total Games"
            value={allGames.length}
            description="Across all tournaments"
            icon={Trophy}
          />
          <StatCard
            title="Tournaments"
            value={allEvents.length}
            description={`${upcomingEvents.length} upcoming`}
            icon={Calendar}
          />
          <StatCard
            title="Avg Win Rate"
            value="52%"
            description="Top 10 players"
            icon={TrendingUp}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Top Players */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Top Players</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/rankings">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPlayers.length > 0 ? (
                  topPlayers.map((player, idx) => (
                    <PlayerCard key={`top-player-${player.id}-${idx}`} player={player} rank={idx + 1} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No players found.</p>
                )}
              </CardContent>
            </Card>
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

'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { GameCard } from '@/components/game-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getEventById, getPlayerWinRate } from '@/lib/data'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Trophy,
  Users,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Player } from '@/lib/types'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const event = getEventById(id)

  if (!event) {
    notFound()
  }

  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)

  const dateRange = `${startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  })} - ${endDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`

  const statusColors = {
    upcoming: 'bg-blue-500/20 text-blue-400',
    ongoing: 'bg-green-500/20 text-green-400',
    completed: 'bg-muted text-muted-foreground',
  }

  // Calculate player stats for this event
  const playerStats = new Map<
    string,
    { player: Player; wins: number; losses: number; games: number }
  >()

  for (const game of event.games) {
    const allPlayers = [
      game.team1.player1,
      game.team1.player2,
      game.team2.player1,
      game.team2.player2,
    ]

    for (const player of allPlayers) {
      if (!playerStats.has(player.id)) {
        playerStats.set(player.id, { player, wins: 0, losses: 0, games: 0 })
      }
      const stats = playerStats.get(player.id)!
      stats.games++

      const inTeam1 =
        game.team1.player1.id === player.id ||
        game.team1.player2.id === player.id
      const won =
        (inTeam1 && game.winner === 'team1') ||
        (!inTeam1 && game.winner === 'team2')
      if (won) {
        stats.wins++
      } else {
        stats.losses++
      }
    }
  }

  const leaderboard = Array.from(playerStats.values())
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .slice(0, 8)

  // Determine MVP (most wins in the event)
  const mvp = leaderboard[0]?.player

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>

        {/* Event Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cn('capitalize', statusColors[event.status])}>
                    {event.status}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold">{event.name}</h1>
                <div className="mt-4 space-y-2 text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {dateRange}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    {event.games.length} Games Played
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {playerStats.size} Participants
                  </p>
                </div>
              </div>

              {/* Winners */}
              {event.status === 'completed' && event.winners.length > 0 && (
                <div className="rounded-xl bg-primary/10 p-6 text-center">
                  <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Champions
                  </p>
                  <div className="flex justify-center -space-x-2 mb-3">
                    {event.winners.map((winner) => (
                      <Avatar
                        key={winner.id}
                        className="h-12 w-12 border-4 border-background"
                      >
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {getInitials(winner.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {event.winners.map((winner) => (
                      <Link
                        key={winner.id}
                        href={`/players/${winner.id}`}
                        className="block font-semibold hover:text-primary transition-colors"
                      >
                        {winner.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Games */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tournament Games</CardTitle>
              </CardHeader>
              <CardContent>
                {event.games.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {event.games.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No games yet</p>
                    <p className="text-sm">
                      Games will appear here once the tournament starts.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* MVP */}
            {mvp && event.status === 'completed' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    MVP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/players/${mvp.id}`}
                    className="flex items-center gap-4 rounded-lg bg-primary/10 p-4 hover:bg-primary/20 transition-colors"
                  >
                    <Avatar className="h-14 w-14 border-2 border-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                        {getInitials(mvp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{mvp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {leaderboard[0]?.wins}W - {leaderboard[0]?.losses}L in
                        this event
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((entry, idx) => (
                      <Link
                        key={entry.player.id}
                        href={`/players/${entry.player.id}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
                      >
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                            idx === 0
                              ? 'bg-primary text-primary-foreground'
                              : idx === 1
                                ? 'bg-muted-foreground/30 text-foreground'
                                : idx === 2
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {idx + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(entry.player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {entry.player.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {entry.wins}W-{entry.losses}L
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.games > 0
                              ? Math.round((entry.wins / entry.games) * 100)
                              : 0}
                            %
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No statistics available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

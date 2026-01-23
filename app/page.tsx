import { Navigation } from '@/components/navigation'
import { StatCard } from '@/components/stat-card'
import { PlayerCard } from '@/components/player-card'
import { GameCard } from '@/components/game-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  players,
  events,
  getTopPlayersByWins,
  getRecentGames,
  getBestTeamCombinations,
} from '@/lib/data'
import { Users, Trophy, Calendar, TrendingUp, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const topPlayers = getTopPlayersByWins(5)
  const recentGames = getRecentGames(4)
  const bestTeams = getBestTeamCombinations(3)
  const upcomingEvents = events.filter((e) => e.status === 'upcoming')
  const activePlayers = players.filter((p) => p.active).length
  const totalGames = players.reduce((sum, p) => sum + p.totalGames, 0) / 2

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
            value={Math.floor(totalGames)}
            description="Across all tournaments"
            icon={Trophy}
          />
          <StatCard
            title="Tournaments"
            value={events.length}
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
                {topPlayers.map((player, idx) => (
                  <PlayerCard key={player.id} player={player} rank={idx + 1} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/events">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 3).map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="block rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-secondary/30"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{event.name}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.location.split(',')[0]}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date(event.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Badge>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No upcoming events scheduled.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Best Team Combinations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Pairings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bestTeams.map((team, idx) => {
                  const initials1 = team.player1.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                  const initials2 = team.player2.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3"
                    >
                      <div className="flex -space-x-2">
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initials1}
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initials2}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {team.player1.name.split(' ')[0]} &{' '}
                          {team.player2.name.split(' ')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {team.wins}W - {team.losses}L
                        </p>
                      </div>
                      <Badge variant="secondary">{team.winRate}%</Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Games */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Games</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/games">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recentGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

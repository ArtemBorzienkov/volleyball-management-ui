'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { GameCard } from '@/components/game-card'
import { StatCardMini } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getPlayerById,
  getPlayerWinRate,
  getPlayerPointsDiff,
  getPlayerGames,
  getPerformanceOverTime,
  players,
  getHeadToHead,
} from '@/lib/data'
import {
  ArrowLeft,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

export default function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const player = getPlayerById(id)

  if (!player) {
    notFound()
  }

  const winRate = getPlayerWinRate(player)
  const pointsDiff = getPlayerPointsDiff(player)
  const playerGames = getPlayerGames(player.id)
  const performanceData = getPerformanceOverTime(player.id)
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')

  // Get head-to-head stats with other players
  const h2hStats = players
    .filter((p) => p.id !== player.id)
    .map((p) => getHeadToHead(player.id, p.id))
    .filter((h) => h !== null && (h.gamesAsTeam > 0 || h.gamesAgainst > 0))
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/players">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Players
          </Link>
        </Button>

        {/* Player Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold">{player.name}</h1>
                  {player.active ? (
                    <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {player.gender && (
                    <Badge variant="outline" className="capitalize">
                      {player.gender}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    {player.tournamentsWon} Tournaments Won
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {player.totalGames} Games Played
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {winRate}% Win Rate
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCardMini label="Wins" value={player.totalWins} />
              <StatCardMini label="Losses" value={player.totalLosses} />
              <StatCardMini label="Sets Won" value={player.setsWon} />
              <StatCardMini
                label="Point Diff"
                value={pointsDiff > 0 ? `+${pointsDiff}` : pointsDiff}
              />
            </div>

            {/* Performance Chart */}
            {performanceData.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Win Rate Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      winRate: {
                        label: 'Win Rate',
                        color: 'oklch(0.70 0.18 45)',
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={performanceData}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(0.28 0.01 250)"
                        />
                        <XAxis
                          dataKey="games"
                          tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          label={{
                            value: 'Games',
                            position: 'insideBottom',
                            offset: -5,
                            fill: 'oklch(0.65 0 0)',
                          }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          cursor={{ stroke: 'oklch(0.70 0.18 45)', strokeWidth: 1 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="winRate"
                          stroke="oklch(0.70 0.18 45)"
                          strokeWidth={2}
                          dot={{ fill: 'oklch(0.70 0.18 45)', r: 4 }}
                          activeDot={{ r: 6, fill: 'oklch(0.70 0.18 45)' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent Games */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Games</CardTitle>
                <Badge variant="outline">{playerGames.length} Total</Badge>
              </CardHeader>
              <CardContent>
                {playerGames.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {playerGames.slice(0, 4).map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No games recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Head-to-Head */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Head-to-Head
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {h2hStats.length > 0 ? (
                  h2hStats.map((h2h) => {
                    if (!h2h) return null
                    const otherPlayer = h2h.player2
                    const otherInitials = otherPlayer.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                    return (
                      <Link
                        key={otherPlayer.id}
                        href={`/players/${otherPlayer.id}`}
                        className="block rounded-lg border border-border p-3 transition-colors hover:border-primary/50 hover:bg-secondary/30"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {otherInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-sm">
                              {otherPlayer.name}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {h2h.gamesAsTeam > 0 && (
                                <span>
                                  Together: {h2h.winsAsTeam}W-{h2h.lossesAsTeam}L
                                </span>
                              )}
                              {h2h.gamesAgainst > 0 && (
                                <span>
                                  vs: {h2h.winsAgainst}W-{h2h.lossesAgainst}L
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No head-to-head data available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Career Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Points Scored</span>
                  <span className="font-semibold">{player.pointsScored}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Points Conceded</span>
                  <span className="font-semibold">{player.pointsConceded}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sets Won</span>
                  <span className="font-semibold">{player.setsWon}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sets Lost</span>
                  <span className="font-semibold">{player.setsLost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Set Win Rate</span>
                  <span className="font-semibold">
                    {player.setsWon + player.setsLost > 0
                      ? Math.round(
                          (player.setsWon / (player.setsWon + player.setsLost)) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

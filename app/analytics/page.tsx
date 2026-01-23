'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  players,
  games,
  getBestTeamCombinations,
  getHeadToHead,
  getPlayerWinRate,
  getPlayerPointsDiff,
} from '@/lib/data'
import {
  Users,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}

export default function AnalyticsPage() {
  const [selectedPlayer1, setSelectedPlayer1] = useState(players[0].id)
  const [selectedPlayer2, setSelectedPlayer2] = useState(players[1].id)

  const bestTeams = getBestTeamCombinations(6)
  const h2h = getHeadToHead(selectedPlayer1, selectedPlayer2)

  // Win rate distribution data
  const winRateDistribution = [
    {
      range: '0-40%',
      count: players.filter((p) => getPlayerWinRate(p) <= 40).length,
    },
    {
      range: '41-50%',
      count: players.filter(
        (p) => getPlayerWinRate(p) > 40 && getPlayerWinRate(p) <= 50
      ).length,
    },
    {
      range: '51-60%',
      count: players.filter(
        (p) => getPlayerWinRate(p) > 50 && getPlayerWinRate(p) <= 60
      ).length,
    },
    {
      range: '61-70%',
      count: players.filter(
        (p) => getPlayerWinRate(p) > 60 && getPlayerWinRate(p) <= 70
      ).length,
    },
    {
      range: '71-100%',
      count: players.filter((p) => getPlayerWinRate(p) > 70).length,
    },
  ]

  // Top performers radar data
  const topPlayer = players.reduce((best, player) =>
    getPlayerWinRate(player) > getPlayerWinRate(best) ? player : best
  )
  const radarData = [
    {
      stat: 'Win Rate',
      value: getPlayerWinRate(topPlayer),
      fullMark: 100,
    },
    {
      stat: 'Games',
      value: Math.min(100, (topPlayer.totalGames / 60) * 100),
      fullMark: 100,
    },
    {
      stat: 'Sets Won',
      value: Math.min(100, (topPlayer.setsWon / 100) * 100),
      fullMark: 100,
    },
    {
      stat: 'Titles',
      value: Math.min(100, topPlayer.tournamentsWon * 20),
      fullMark: 100,
    },
    {
      stat: 'Pt Diff',
      value: Math.min(100, Math.max(0, getPlayerPointsDiff(topPlayer) / 5)),
      fullMark: 100,
    },
  ]

  // Games by location
  const locationStats = games.reduce(
    (acc, game) => {
      const loc = game.location.split(',')[0]
      if (!acc[loc]) acc[loc] = 0
      acc[loc]++
      return acc
    },
    {} as Record<string, number>
  )
  const locationData = Object.entries(locationStats).map(([name, value]) => ({
    name,
    value,
  }))

  // Player comparison data
  const player1 = players.find((p) => p.id === selectedPlayer1)!
  const player2 = players.find((p) => p.id === selectedPlayer2)!

  const comparisonData = [
    {
      stat: 'Win Rate',
      player1: getPlayerWinRate(player1),
      player2: getPlayerWinRate(player2),
    },
    {
      stat: 'Total Wins',
      player1: player1.totalWins,
      player2: player2.totalWins,
    },
    {
      stat: 'Sets Won',
      player1: player1.setsWon,
      player2: player2.setsWon,
    },
    {
      stat: 'Tournaments',
      player1: player1.tournamentsWon * 10,
      player2: player2.tournamentsWon * 10,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Advanced statistics and insights for beach volleyball performance.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bestTeams.length}</p>
                  <p className="text-sm text-muted-foreground">Active Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      players.reduce((sum, p) => sum + getPlayerWinRate(p), 0) /
                        players.length
                    )}
                    %
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      games.reduce(
                        (sum, g) =>
                          sum +
                          g.score.sets.reduce((s, set) => s + set.team1 + set.team2, 0),
                        0
                      ) / games.length
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Points/Game</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-orange-500/10 p-3">
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {bestTeams[0]?.winRate || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Best Team WR</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          {/* Best Team Combinations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Best Player Combinations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bestTeams.map((team, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 rounded-lg bg-secondary/30 p-4"
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                      idx === 0
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex -space-x-2">
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(team.player1.name)}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(team.player2.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {team.player1.name.split(' ')[0]} &{' '}
                      {team.player2.name.split(' ')[0]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {team.gamesPlayed} games together
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {team.winRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {team.wins}W-{team.losses}L
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Win Rate Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Win Rate Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: 'Players',
                    color: 'oklch(0.70 0.18 45)',
                  },
                }}
                className="h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={winRateDistribution}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.28 0.01 250)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {winRateDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index >= 3
                              ? 'oklch(0.70 0.18 45)'
                              : 'oklch(0.70 0.18 45 / 0.5)'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Head-to-Head Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Head-to-Head Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              {/* Player Selectors */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-48">
                  <Select
                    value={selectedPlayer1}
                    onValueChange={setSelectedPlayer1}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-muted-foreground font-medium">vs</span>
                <div className="w-full sm:w-48">
                  <Select
                    value={selectedPlayer2}
                    onValueChange={setSelectedPlayer2}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* H2H Stats */}
              {h2h && (
                <div className="flex-1 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-secondary/30 p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      As Teammates
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{h2h.gamesAsTeam}</span>
                      <span className="text-muted-foreground">Games</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-semibold text-primary">
                        {h2h.winRateAsTeam}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {h2h.winsAsTeam}W - {h2h.lossesAsTeam}L
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      As Opponents
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{h2h.gamesAgainst}</span>
                      <span className="text-muted-foreground">Games</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-semibold text-primary">
                        {h2h.winRateAgainst}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {h2h.winsAgainst}W - {h2h.lossesAgainst}L
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Bars */}
            <div className="mt-6 space-y-4">
              {comparisonData.map((item) => {
                const max = Math.max(item.player1, item.player2)
                const p1Width = max > 0 ? (item.player1 / max) * 100 : 0
                const p2Width = max > 0 ? (item.player2 / max) * 100 : 0
                return (
                  <div key={item.stat}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {item.stat === 'Tournaments'
                          ? item.player1 / 10
                          : item.player1}
                        {item.stat === 'Win Rate' ? '%' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.stat}
                      </span>
                      <span className="text-sm font-medium">
                        {item.stat === 'Tournaments'
                          ? item.player2 / 10
                          : item.player2}
                        {item.stat === 'Win Rate' ? '%' : ''}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 flex justify-end">
                        <div
                          className="h-3 rounded-l-full bg-primary"
                          style={{ width: `${p1Width}%` }}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className="h-3 rounded-r-full bg-primary/50"
                          style={{ width: `${p2Width}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Player Names */}
            <div className="mt-4 flex justify-between text-sm">
              <Link
                href={`/players/${player1.id}`}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(player1.name)}
                  </AvatarFallback>
                </Avatar>
                {player1.name}
              </Link>
              <Link
                href={`/players/${player2.id}`}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                {player2.name}
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/50 text-primary-foreground text-xs">
                    {getInitials(player2.name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Top Player Radar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Player Profile: {topPlayer.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: 'Value',
                    color: 'oklch(0.70 0.18 45)',
                  },
                }}
                className="h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="oklch(0.28 0.01 250)" />
                    <PolarAngleAxis
                      dataKey="stat"
                      tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: 'oklch(0.65 0 0)', fontSize: 10 }}
                    />
                    <Radar
                      name={topPlayer.name}
                      dataKey="value"
                      stroke="oklch(0.70 0.18 45)"
                      fill="oklch(0.70 0.18 45)"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Games by Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Games by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: 'Games',
                    color: 'oklch(0.70 0.18 45)',
                  },
                }}
                className="h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={locationData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {locationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? 'oklch(0.70 0.18 45)'
                              : index === 1
                                ? 'oklch(0.65 0.15 180)'
                                : 'oklch(0.75 0.12 85)'
                          }
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {locationData.map((loc, idx) => (
                  <div key={loc.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          idx === 0
                            ? 'oklch(0.70 0.18 45)'
                            : idx === 1
                              ? 'oklch(0.65 0.15 180)'
                              : 'oklch(0.75 0.12 85)',
                      }}
                    />
                    <span className="text-sm text-muted-foreground">{loc.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

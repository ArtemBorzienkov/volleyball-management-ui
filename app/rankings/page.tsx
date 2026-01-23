'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  players,
  getTopPlayersByWins,
  getTopPlayersByWinRate,
  getTopPlayersBySetsWon,
  getTopPlayersByTournamentsWon,
  getTopPlayersByPointsDiff,
  getPlayerWinRate,
  getPlayerPointsDiff,
} from '@/lib/data'
import { Trophy, TrendingUp, Target, Medal, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type RankingCategory =
  | 'wins'
  | 'winRate'
  | 'setsWon'
  | 'tournaments'
  | 'pointsDiff'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}

export default function RankingsPage() {
  const [activeCategory, setActiveCategory] = useState<RankingCategory>('wins')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const categories = [
    { id: 'wins' as const, label: 'Total Wins', icon: Trophy },
    { id: 'winRate' as const, label: 'Win Rate', icon: TrendingUp },
    { id: 'setsWon' as const, label: 'Sets Won', icon: Target },
    { id: 'tournaments' as const, label: 'Tournaments', icon: Medal },
    { id: 'pointsDiff' as const, label: 'Points Diff', icon: ArrowUpDown },
  ]

  const getRankedPlayers = () => {
    let ranked
    switch (activeCategory) {
      case 'wins':
        ranked = getTopPlayersByWins(players.length)
        break
      case 'winRate':
        ranked = getTopPlayersByWinRate(players.length)
        break
      case 'setsWon':
        ranked = getTopPlayersBySetsWon(players.length)
        break
      case 'tournaments':
        ranked = getTopPlayersByTournamentsWon(players.length)
        break
      case 'pointsDiff':
        ranked = getTopPlayersByPointsDiff(players.length)
        break
      default:
        ranked = getTopPlayersByWins(players.length)
    }
    return sortDirection === 'asc' ? [...ranked].reverse() : ranked
  }

  const rankedPlayers = getRankedPlayers()

  const getStatValue = (player: (typeof players)[0]) => {
    switch (activeCategory) {
      case 'wins':
        return player.totalWins
      case 'winRate':
        return `${getPlayerWinRate(player)}%`
      case 'setsWon':
        return player.setsWon
      case 'tournaments':
        return player.tournamentsWon
      case 'pointsDiff':
        const diff = getPlayerPointsDiff(player)
        return diff > 0 ? `+${diff}` : diff
      default:
        return player.totalWins
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Rankings</h1>
          <p className="mt-1 text-muted-foreground">
            Global player rankings across different categories.
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {rankedPlayers.slice(0, 3).map((player, idx) => {
            const positions = [
              { position: 2, label: '2nd', color: 'bg-muted-foreground/20' },
              { position: 1, label: '1st', color: 'bg-primary/20' },
              { position: 3, label: '3rd', color: 'bg-orange-500/20' },
            ]
            const pos = positions[idx]
            const orderClasses = ['sm:order-1', 'sm:order-0', 'sm:order-2']

            return (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className={cn('block', orderClasses[idx])}
              >
                <Card
                  className={cn(
                    'group transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
                    idx === 1 && 'ring-2 ring-primary'
                  )}
                >
                  <CardContent className="p-6 text-center">
                    <div
                      className={cn(
                        'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold',
                        pos.color,
                        idx === 1 ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {pos.position}
                    </div>
                    <Avatar className="mx-auto h-16 w-16 border-4 border-background mb-3">
                      <AvatarFallback
                        className={cn(
                          'text-lg font-bold',
                          idx === 1
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {player.name}
                    </h3>
                    <p className="text-2xl font-bold text-primary mt-2">
                      {getStatValue(player)}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {activeCategory === 'winRate'
                        ? 'Win Rate'
                        : activeCategory === 'pointsDiff'
                          ? 'Point Diff'
                          : activeCategory === 'setsWon'
                            ? 'Sets Won'
                            : activeCategory}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Category Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-2">
                Rank by:
              </span>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className="gap-2"
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </Button>
              ))}
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
                  }
                  className="gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortDirection === 'desc' ? 'Highest First' : 'Lowest First'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rankings Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                  <TableHead className="text-right">W-L</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                  <TableHead className="text-right">
                    {activeCategory === 'wins'
                      ? 'Wins'
                      : activeCategory === 'winRate'
                        ? 'Win Rate'
                        : activeCategory === 'setsWon'
                          ? 'Sets'
                          : activeCategory === 'tournaments'
                            ? 'Titles'
                            : 'Pt Diff'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedPlayers.map((player, idx) => {
                  const rank = sortDirection === 'desc' ? idx + 1 : rankedPlayers.length - idx
                  return (
                    <TableRow key={player.id} className="group">
                      <TableCell>
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                            rank === 1
                              ? 'bg-primary text-primary-foreground'
                              : rank === 2
                                ? 'bg-muted-foreground/30 text-foreground'
                                : rank === 3
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {rank}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/players/${player.id}`}
                          className="flex items-center gap-3 group-hover:text-primary transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {getInitials(player.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <div className="flex items-center gap-2">
                              {!player.active && (
                                <Badge variant="secondary" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                              {player.tournamentsWon > 0 && (
                                <span className="flex items-center gap-1 text-xs text-primary">
                                  <Trophy className="h-3 w-3" />
                                  {player.tournamentsWon}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {player.totalGames}
                      </TableCell>
                      <TableCell className="text-right">
                        {player.totalWins}-{player.totalLosses}
                      </TableCell>
                      <TableCell className="text-right">
                        {getPlayerWinRate(player)}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {getStatValue(player)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

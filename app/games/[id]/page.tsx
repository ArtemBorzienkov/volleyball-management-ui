'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { PlayerCardCompact } from '@/components/player-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getGameById, getEventById } from '@/lib/data'
import { ArrowLeft, MapPin, Calendar, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const game = getGameById(id)

  if (!game) {
    notFound()
  }

  const event = getEventById(game.eventId)
  const formattedDate = new Date(game.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const team1Won = game.winner === 'team1'
  const team2Won = game.winner === 'team2'

  const team1Points = game.score.sets.reduce((sum, set) => sum + set.team1, 0)
  const team2Points = game.score.sets.reduce((sum, set) => sum + set.team2, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/games">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Link>
        </Button>

        {/* Game Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">{formattedDate}</span>
              </div>
              {event && (
                <Link href={`/events/${event.id}`}>
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    {event.name}
                  </Badge>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <MapPin className="h-4 w-4" />
              <span>{game.location}</span>
            </div>

            {/* Score Display */}
            <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr]">
              {/* Team 1 */}
              <div
                className={cn(
                  'rounded-xl p-6 text-center transition-colors',
                  team1Won
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'bg-secondary/50'
                )}
              >
                <div className="flex justify-center -space-x-3 mb-4">
                  <Avatar className="h-16 w-16 border-4 border-background">
                    <AvatarFallback
                      className={cn(
                        'text-lg font-bold',
                        team1Won
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {getInitials(game.team1.player1.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Avatar className="h-16 w-16 border-4 border-background">
                    <AvatarFallback
                      className={cn(
                        'text-lg font-bold',
                        team1Won
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {getInitials(game.team1.player2.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-1">
                  <Link
                    href={`/players/${game.team1.player1.id}`}
                    className="block font-semibold hover:text-primary transition-colors"
                  >
                    {game.team1.player1.name}
                  </Link>
                  <Link
                    href={`/players/${game.team1.player2.id}`}
                    className="block font-semibold hover:text-primary transition-colors"
                  >
                    {game.team1.player2.name}
                  </Link>
                </div>
                {team1Won && (
                  <Badge className="mt-4 bg-primary text-primary-foreground">
                    Winner
                  </Badge>
                )}
              </div>

              {/* Score */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-6xl font-bold tracking-tighter">
                  <span className={team1Won ? 'text-primary' : ''}>
                    {game.score.team1Sets}
                  </span>
                  <span className="text-muted-foreground mx-2">-</span>
                  <span className={team2Won ? 'text-primary' : ''}>
                    {game.score.team2Sets}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Final Score</p>
              </div>

              {/* Team 2 */}
              <div
                className={cn(
                  'rounded-xl p-6 text-center transition-colors',
                  team2Won
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'bg-secondary/50'
                )}
              >
                <div className="flex justify-center -space-x-3 mb-4">
                  <Avatar className="h-16 w-16 border-4 border-background">
                    <AvatarFallback
                      className={cn(
                        'text-lg font-bold',
                        team2Won
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {getInitials(game.team2.player1.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Avatar className="h-16 w-16 border-4 border-background">
                    <AvatarFallback
                      className={cn(
                        'text-lg font-bold',
                        team2Won
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {getInitials(game.team2.player2.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-1">
                  <Link
                    href={`/players/${game.team2.player1.id}`}
                    className="block font-semibold hover:text-primary transition-colors"
                  >
                    {game.team2.player1.name}
                  </Link>
                  <Link
                    href={`/players/${game.team2.player2.id}`}
                    className="block font-semibold hover:text-primary transition-colors"
                  >
                    {game.team2.player2.name}
                  </Link>
                </div>
                {team2Won && (
                  <Badge className="mt-4 bg-primary text-primary-foreground">
                    Winner
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Set Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Set Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Team
                    </th>
                    {game.score.sets.map((_, idx) => (
                      <th
                        key={idx}
                        className="text-center py-3 px-4 text-sm font-medium text-muted-foreground"
                      >
                        Set {idx + 1}
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                      Total Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          <Avatar className="h-6 w-6 border border-background">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {getInitials(game.team1.player1.name)}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6 border border-background">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {getInitials(game.team1.player2.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="font-medium text-sm">
                          {game.team1.player1.name.split(' ')[0]} &{' '}
                          {game.team1.player2.name.split(' ')[0]}
                        </span>
                      </div>
                    </td>
                    {game.score.sets.map((set, idx) => {
                      const won = set.team1 > set.team2
                      return (
                        <td
                          key={idx}
                          className={cn(
                            'text-center py-3 px-4 font-semibold',
                            won ? 'text-primary' : 'text-muted-foreground'
                          )}
                        >
                          {set.team1}
                        </td>
                      )
                    })}
                    <td
                      className={cn(
                        'text-center py-3 px-4 font-bold',
                        team1Won ? 'text-primary' : ''
                      )}
                    >
                      {team1Points}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          <Avatar className="h-6 w-6 border border-background">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {getInitials(game.team2.player1.name)}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6 border border-background">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {getInitials(game.team2.player2.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="font-medium text-sm">
                          {game.team2.player1.name.split(' ')[0]} &{' '}
                          {game.team2.player2.name.split(' ')[0]}
                        </span>
                      </div>
                    </td>
                    {game.score.sets.map((set, idx) => {
                      const won = set.team2 > set.team1
                      return (
                        <td
                          key={idx}
                          className={cn(
                            'text-center py-3 px-4 font-semibold',
                            won ? 'text-primary' : 'text-muted-foreground'
                          )}
                        >
                          {set.team2}
                        </td>
                      )
                    })}
                    <td
                      className={cn(
                        'text-center py-3 px-4 font-bold',
                        team2Won ? 'text-primary' : ''
                      )}
                    >
                      {team2Points}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

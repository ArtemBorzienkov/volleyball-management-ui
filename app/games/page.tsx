'use client'

import { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { GameCard } from '@/components/game-card'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { games, events } from '@/lib/data'
import { Search, Filter, Calendar, MapPin } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function GamesPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedEvent, setSelectedEvent] = useState<string>(searchParams.get('event') || 'all')

  const filteredGames = games.filter((game) => {
    const playerNames = [
      game.team1.player1.name,
      game.team1.player2.name,
      game.team2.player1.name,
      game.team2.player2.name,
    ]
    const matchesSearch = playerNames.some((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesEvent =
      selectedEvent === 'all' || game.eventId === selectedEvent

    return matchesSearch && matchesEvent
  })

  const sortedGames = [...filteredGames].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Group games by date
  const gamesByDate = sortedGames.reduce(
    (acc, game) => {
      const date = game.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(game)
      return acc
    },
    {} as Record<string, typeof games>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Games</h1>
            <p className="mt-1 text-muted-foreground">
              Browse all recorded matches and results.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1 self-start">
            <Calendar className="h-3 w-3" />
            {games.length} Games
          </Badge>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by player name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedEvent === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedEvent('all')}
                >
                  All Events
                </Button>
                {events.map((event) => (
                  <Button
                    key={event.id}
                    variant={selectedEvent === event.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedEvent(event.id)}
                  >
                    {event.name.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games List */}
        {sortedGames.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(gamesByDate).map(([date, dateGames]) => {
              const formattedDate = new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
              return (
                <div key={date}>
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="font-semibold text-lg">{formattedDate}</h2>
                    <div className="h-px flex-1 bg-border" />
                    <Badge variant="outline">{dateGames.length} games</Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {dateGames.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No games found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

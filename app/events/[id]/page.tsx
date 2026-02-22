'use client'

import { use } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Trophy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Player } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import API from '@/lib/api'

type GamePlayerRank = { playerId: string; rank: number; rankChange: number }
type BackendGame = {
  id: string
  team1Player1Id: string
  team1Player2Id: string
  team2Player1Id: string
  team2Player2Id: string
  team1Points: number
  team2Points: number
  gamePlayerRanks: GamePlayerRank[]
}
type BackendEvent = {
  id: string
  name: string
  date: string
  location?: string
  games: BackendGame[]
}

const TeamCard = ({ playersById, pid, info }: { playersById: Record<string, Player>, pid: string, info: { rank: number; rankChange: number } }) => (
  <div key={pid} className="flex flex-wrap gap-2">
    <h1 className="text-md font-bold">{playersById[pid]?.name}</h1>
    <span
      key={pid}
      className="inline-flex items-center gap-2 rounded bg-muted px-2 py-0.5 text-md"
    >
      {info.rank}
      {info.rankChange >= 0 ? (
        <TrendingUp className="h-3 w-3 text-green-600" />
      ) : (
        <TrendingDown className="h-3 w-3 text-red-600" />
      )}
      {info.rankChange >= 0 ? `+${info.rankChange}` : info.rankChange}
    </span>
  </div>
)

function getPlayerRankInfo(
  gamePlayerRanks: GamePlayerRank[],
  playerId: string
): { rank: number; rankChange: number } | null {
  const info = gamePlayerRanks.find((r) => r.playerId === playerId)
  return info ? { rank: info.rank, rankChange: info.rankChange } : null
}

const fetchEventById = async (id: string) => {
  const resp = await fetch(API.GET_EVENT_BY_ID(id))
  const data = await resp.json()
  return data
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: event, isLoading: isEventLoading } = useQuery<BackendEvent>({
    queryKey: ['eventById', id],
    queryFn: () => fetchEventById(id),
  })

  const { data: players = [], isLoading: isPlayersLoading } = useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: () => fetch(API.GET_ALL_PLAYERS).then((res) => res.json()),
  })

  const playersById = players.reduce<Record<string, Player>>(
    (acc, p) => {
      acc[p.id] = p
      return acc
    },
    {}
  )

  if (isEventLoading || isPlayersLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button size="sm" asChild className="mb-6">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        {/* Event Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h1 className="text-3xl font-bold">{event?.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(event?.date || '').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                {event?.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event?.location}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  {event?.games?.length} Games Played
                </p>
              </div>
            </div>

            {/* Games list */}
            <div className="mt-6 space-y-4">
              {event?.games?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No games yet</p>
              ) : (
                event?.games?.map((game) => (
                    <Card key={game.id} className="overflow-hidden p-0">
                      <CardContent className="p-0">
                        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                          {/* Team 1 */}
                          <div className="space-y-1">
                            <div className="flex flex-col gap-2 text-md">
                              {[game.team1Player1Id, game.team1Player2Id].map((pid) => <TeamCard key={pid} playersById={playersById} pid={pid} info={getPlayerRankInfo(game.gamePlayerRanks, pid) ?? { rank: 0, rankChange: 0 }} />)}
                            </div>
                          </div>

                          {/* Result */}
                          <div className="flex items-center justify-center gap-2 text-lg font-bold">
                            <span
                              className={cn(
                                game.team1Points > game.team2Points && 'text-primary'
                              )}
                            >
                              {game.team1Points}
                            </span>
                            <span className="text-muted-foreground">–</span>
                            <span
                              className={cn(
                                game.team2Points > game.team1Points && 'text-primary'
                              )}
                            >
                              {game.team2Points}
                            </span>
                          </div>

                          {/* Team 2 */}
                          <div className="space-y-1 text-right flex flex-col items-end">
                          <div className="flex flex-col gap-2 text-md">
                            {[game.team2Player1Id, game.team2Player2Id].map((pid) => <TeamCard key={pid} playersById={playersById} pid={pid} info={getPlayerRankInfo(game.gamePlayerRanks, pid) ?? { rank: 0, rankChange: 0 }} />)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
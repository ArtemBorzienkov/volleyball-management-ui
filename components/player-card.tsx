import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Player } from '@/lib/types'
import { getPlayerWinRate, getPlayerPointsDiff } from '@/lib/data'
import { TrendingUp, Trophy } from 'lucide-react'

interface PlayerCardProps {
  player: Player
  rank?: number
  showStats?: boolean
}

export function PlayerCard({ player, rank, showStats = true }: PlayerCardProps) {
  const winRate = getPlayerWinRate(player)
  const pointsDiff = getPlayerPointsDiff(player)
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')

  return (
    <Link href={`/players/${player.id}`}>
      <Card className="group transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {rank && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                {rank}
              </div>
            )}
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
                  {player.name}
                </h3>
                {!player.active && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              {showStats && (
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {winRate}% WR
                  </span>
                  <span>
                    {player.totalWins}W - {player.totalLosses}L
                  </span>
                </div>
              )}
            </div>
            {showStats && player.tournamentsWon > 0 && (
              <div className="flex items-center gap-1 text-primary">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">{player.tournamentsWon}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface PlayerCardCompactProps {
  player: Player
  subtitle?: string
}

export function PlayerCardCompact({ player, subtitle }: PlayerCardCompactProps) {
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')

  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{player.name}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Link>
  )
}

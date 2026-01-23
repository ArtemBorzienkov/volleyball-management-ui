import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Game } from '@/lib/types'
import { MapPin, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GameCardProps {
  game: Game
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}

function TeamDisplay({
  players,
  score,
  isWinner,
}: {
  players: { name: string }[]
  score: number
  isWinner: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-3 transition-colors',
        isWinner ? 'bg-primary/10' : 'bg-secondary/50'
      )}
    >
      <div className="flex -space-x-2">
        {players.map((player, idx) => (
          <Avatar key={idx} className="h-8 w-8 border-2 border-background">
            <AvatarFallback
              className={cn(
                'text-xs font-semibold',
                isWinner
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              {getInitials(player.name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {players.map((p) => p.name.split(' ')[0]).join(' & ')}
        </p>
      </div>
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold',
          isWinner
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {score}
      </div>
    </div>
  )
}

export function GameCard({ game }: GameCardProps) {
  const formattedDate = new Date(game.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link href={`/games/${game.id}`}>
      <Card className="group transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Best of {game.score.sets.length > 2 ? '3' : '3'}
            </Badge>
          </div>

          <div className="space-y-2">
            <TeamDisplay
              players={[game.team1.player1, game.team1.player2]}
              score={game.score.team1Sets}
              isWinner={game.winner === 'team1'}
            />
            <TeamDisplay
              players={[game.team2.player1, game.team2.player2]}
              score={game.score.team2Sets}
              isWinner={game.winner === 'team2'}
            />
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{game.location}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function GameCardCompact({ game }: GameCardProps) {
  const team1Names = `${game.team1.player1.name.split(' ')[0]} & ${game.team1.player2.name.split(' ')[0]}`
  const team2Names = `${game.team2.player1.name.split(' ')[0]} & ${game.team2.player2.name.split(' ')[0]}`

  return (
    <Link
      href={`/games/${game.id}`}
      className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-secondary"
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm',
            game.winner === 'team1' ? 'font-semibold' : 'text-muted-foreground'
          )}
        >
          {team1Names}
        </p>
        <p
          className={cn(
            'truncate text-sm',
            game.winner === 'team2' ? 'font-semibold' : 'text-muted-foreground'
          )}
        >
          {team2Names}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-sm',
            game.winner === 'team1' ? 'font-semibold' : 'text-muted-foreground'
          )}
        >
          {game.score.team1Sets}
        </p>
        <p
          className={cn(
            'text-sm',
            game.winner === 'team2' ? 'font-semibold' : 'text-muted-foreground'
          )}
        >
          {game.score.team2Sets}
        </p>
      </div>
    </Link>
  )
}

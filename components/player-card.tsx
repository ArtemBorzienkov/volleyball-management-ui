'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Player } from '@/lib/types'
import { getPlayerWinRate, getPlayerPointsDiff } from '@/lib/data'
import { TrendingUp, Trophy, Medal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PlayerCardProps {
  player: Player
  rank?: number
  showStats?: boolean
  hasBorder?: boolean
  metric?: string // The ranking metric (e.g., 'eventsWon', 'winRate', 'gamesPlayed')
  totalEvents?: number // Total events participated in (for eventsWon metric)
  eventsWon?: number // Events won (for eventsWon metric)
}

export function PlayerCard({ 
  player, 
  rank, 
  showStats = true, 
  hasBorder = false,
  metric,
  totalEvents,
  eventsWon,
}: PlayerCardProps) {
  const { t } = useTranslation()
  const winRate = getPlayerWinRate(player)
  const pointsDiff = getPlayerPointsDiff(player)

  const renderRankBadge = () => {
    if (!rank) return null
    
    if (rank === 1) {
      return (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF8C00" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M16 2L20 12H28L21 18L24 28L16 22L8 28L11 18L4 12H12L16 2Z"
              fill="url(#goldGradient)"
              stroke="#FFA500"
              strokeWidth="0.5"
            />
            <circle cx="16" cy="16" r="4" fill="#FFD700" opacity="0.3" />
          </svg>
        </div>
      )
    }
    if (rank === 2) {
      return (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <defs>
              <linearGradient id="silverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8E8E8" stopOpacity="1" />
                <stop offset="50%" stopColor="#C0C0C0" stopOpacity="1" />
                <stop offset="100%" stopColor="#A8A8A8" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M16 2L20 12H28L21 18L24 28L16 22L8 28L11 18L4 12H12L16 2Z"
              fill="url(#silverGradient)"
              stroke="#C0C0C0"
              strokeWidth="0.5"
            />
            <circle cx="16" cy="16" r="4" fill="#E8E8E8" opacity="0.3" />
          </svg>
        </div>
      )
    }
    if (rank === 3) {
      return (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <defs>
              <linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#CD7F32" stopOpacity="1" />
                <stop offset="50%" stopColor="#B87333" stopOpacity="1" />
                <stop offset="100%" stopColor="#8B4513" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M16 2L20 12H28L21 18L24 28L16 22L8 28L11 18L4 12H12L16 2Z"
              fill="url(#bronzeGradient)"
              stroke="#B87333"
              strokeWidth="0.5"
            />
            <circle cx="16" cy="16" r="4" fill="#CD7F32" opacity="0.3" />
          </svg>
        </div>
      )
    }
    
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#363636] text-sm font-medium text-foreground">
        {rank}
      </div>
    )
  }

  if (!hasBorder) {
    return (
      <div className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/50">
        {renderRankBadge()}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-[#4F403D] text-[#BDBDBD] font-semibold text-sm">
            {player.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">
            {player.name}
          </h3>
          {showStats && (
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              {metric !== 'eventsWon' && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {winRate}% WR
                </span>
              )}
              {metric === 'eventsWon' && totalEvents !== undefined && eventsWon !== undefined ? (
                <span>
                  {totalEvents} {t('home.topPlayers.totalEvents')} - {eventsWon}W
                </span>
              ) : (
                metric !== 'eventsWon' && (
                  <span>
                    {player.totalWins}W - {player.totalLosses}L
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="group transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {renderRankBadge()}
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {player.name}
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
                {metric !== 'eventsWon' && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {winRate}% WR
                  </span>
                )}
                {metric === 'eventsWon' && totalEvents !== undefined && eventsWon !== undefined ? (
                  <span>
                    {totalEvents} {t('home.topPlayers.totalEvents')} - {eventsWon}W
                  </span>
                ) : (
                  metric !== 'eventsWon' && (
                    <span>
                      {player.totalWins}W - {player.totalLosses}L
                    </span>
                  )
                )}
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
  )
}

interface PlayerCardCompactProps {
  player: Player
  subtitle?: string
}

export function PlayerCardCompact({ player, subtitle }: PlayerCardCompactProps) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {player.name}
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

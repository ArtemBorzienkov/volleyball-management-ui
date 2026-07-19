'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import API from '@/lib/api'
import type {
  Player,
  PlayerRankHistory,
  PlayerGameRow,
  PlayerGamesResponse,
} from '@/lib/types'

const Loading = () => null

const GAMES_BATCH = 100

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function RatingChange({ value }: { value: number }) {
  const color =
    value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-muted-foreground'
  const sign = value > 0 ? '+' : ''
  return <span className={`font-medium ${color}`}>{`${sign}${value}`}</span>
}

function GamesTable({ playerId }: { playerId: string }) {
  const { t, i18n } = useTranslation()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<PlayerGamesResponse>({
    queryKey: ['player-games', playerId],
    enabled: !!playerId,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetch(API.GET_PLAYER_GAMES(playerId, pageParam as number, GAMES_BATCH)).then(
        (res) => res.json()
      ),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (n, page) => n + (Array.isArray(page?.games) ? page.games.length : 0),
        0
      )
      return loaded < (lastPage?.total ?? 0) ? loaded : undefined
    },
  })

  const games: PlayerGameRow[] = (data?.pages ?? []).flatMap((page) =>
    Array.isArray(page?.games) ? page.games : []
  )

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, games.length])

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t('rating.loadingGames')}
      </p>
    )
  }

  if (games.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t('rating.noGames')}
      </p>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('rating.table.date')}</TableHead>
            <TableHead className="text-right">{t('rating.table.team1')}</TableHead>
            <TableHead className="text-left">{t('rating.table.team2')}</TableHead>
            <TableHead className="text-center">{t('rating.table.ratingChange')}</TableHead>
            <TableHead className="text-center">{t('rating.table.newRating')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow key={game.gameId}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(game.date, i18n.language)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <span className="font-semibold text-primary">
                    {game.team1.player1.name}
                  </span>
                  <span className="text-muted-foreground">{game.team1.player2.name}</span>
                  <span className="w-6 text-right font-semibold tabular-nums">
                    {game.team1.points}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-left">
                <div className="flex items-center justify-start gap-3">
                  <span className="w-6 text-left font-semibold tabular-nums">
                    {game.team2.points}
                  </span>
                  <span className="text-muted-foreground">{game.team2.player1.name}</span>
                  <span className="text-muted-foreground">{game.team2.player2.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <RatingChange value={game.rankChange} />
              </TableCell>
              <TableCell className="text-center font-medium tabular-nums">
                {game.newRating}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div
        ref={sentinelRef}
        className="flex h-8 items-center justify-center text-xs text-muted-foreground"
      >
        {isFetchingNextPage
          ? t('rating.loadingMore')
          : hasNextPage
            ? ''
            : t('rating.endOfGames')}
      </div>
    </>
  )
}

function RatingContent() {
  const { t, i18n } = useTranslation()
  const searchParams = useSearchParams()
  const playerId = searchParams.get('id')
  const [graphOpen, setGraphOpen] = useState(true)

  const { data: player } = useQuery<Player>({
    queryKey: ['player', playerId],
    queryFn: () => fetch(API.GET_PLAYER_BY_ID(playerId as string)).then((res) => res.json()),
    enabled: !!playerId,
  })

  const { data: history = [], isLoading } = useQuery<PlayerRankHistory[]>({
    queryKey: ['player-rank-history', playerId],
    queryFn: () =>
      fetch(API.GET_PLAYER_RANK_HISTORY(playerId as string)).then((res) => res.json()),
    enabled: !!playerId,
  })

  const chartData = (Array.isArray(history) ? history : []).map((record) => ({
    ...record,
    label: formatDate(record.date, i18n.language),
  }))

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/players">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('rating.backToPlayers')}
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {player ? player.name : t('rating.player')}
        </h1>
        <p className="mt-1 text-muted-foreground">{t('rating.subtitle')}</p>
      </div>

      <Card className="mb-8">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setGraphOpen((open) => !open)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('rating.chartTitle')}</CardTitle>
            {graphOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {graphOpen && (
          <CardContent>
            {!playerId ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t('rating.noPlayerSelected')}
              </p>
            ) : isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t('rating.loadingHistory')}
              </p>
            ) : chartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t('rating.noHistory')}
              </p>
            ) : (
              <ChartContainer
                config={{
                  rank: {
                    label: t('rating.ratingAxis'),
                    color: 'oklch(0.70 0.18 45)',
                  },
                }}
                className="h-[400px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 250)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: t('rating.ratingAxis'),
                        angle: -90,
                        position: 'insideLeft',
                        fill: 'oklch(0.65 0 0)',
                      }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      cursor={{ stroke: 'oklch(0.70 0.18 45)', strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rank"
                      stroke="oklch(0.70 0.18 45)"
                      strokeWidth={2}
                      dot={{ fill: 'oklch(0.70 0.18 45)', r: 4 }}
                      activeDot={{ r: 6, fill: 'oklch(0.70 0.18 45)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('rating.gamesTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!playerId ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t('rating.noPlayerSelected')}
            </p>
          ) : (
            <GamesTable playerId={playerId} />
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default function RatingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<Loading />}>
          <RatingContent />
        </Suspense>
      </main>
    </div>
  )
}

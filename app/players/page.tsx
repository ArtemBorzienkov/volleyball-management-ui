'use client'

import { useState } from 'react'
import { useSearchParams, Suspense } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { PlayerCard } from '@/components/player-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { players } from '@/lib/data'
import { Search, Filter, Users, UserCheck } from 'lucide-react'

type FilterType = 'all' | 'active' | 'inactive' | 'male' | 'female'

const Loading = () => null

export default function PlayersPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('query') || '')
  const [activeFilter, setActiveFilter] = useState<FilterType>(searchParams?.get('filter') as FilterType || 'all')

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesFilter = true
    switch (activeFilter) {
      case 'active':
        matchesFilter = player.active
        break
      case 'inactive':
        matchesFilter = !player.active
        break
      case 'male':
        matchesFilter = player.gender === 'male'
        break
      case 'female':
        matchesFilter = player.gender === 'female'
        break
    }

    return matchesSearch && matchesFilter
  })

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Players' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Players</h1>
            <p className="mt-1 text-muted-foreground">
              Browse and search through all registered players.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {players.length} Total
            </Badge>
            <Badge variant="outline" className="gap-1">
              <UserCheck className="h-3 w-3" />
              {players.filter((p) => p.active).length} Active
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={activeFilter === filter.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        <Suspense fallback={<Loading />}>
          {filteredPlayers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlayers.map((player, idx) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No players found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </main>
    </div>
  )
}

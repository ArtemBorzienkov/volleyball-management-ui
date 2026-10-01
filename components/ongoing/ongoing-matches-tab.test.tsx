import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { OngoingEvent } from '@/lib/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => (vars ? `${key} ${JSON.stringify(vars)}` : key),
  }),
}))
vi.mock('@/components/providers/auth-provider', () => ({ useAuth: () => ({ user: null }) }))
// The card is exercised elsewhere; here only what the tab hands it matters.
vi.mock('@/components/ongoing/ongoing-match-card', () => ({
  OngoingMatchCard: ({ courtLabel, side1Label }: { courtLabel?: string; side1Label: string }) => (
    <div data-testid="card">
      {side1Label} @ {courtLabel}
    </div>
  ),
}))

import { OngoingMatchesTab } from './ongoing-matches-tab'

const team = (id: string) => ({ id, player1: { id: `${id}1`, name: `${id}1` }, player2: { id: `${id}2`, name: `${id}2` }, rating: 2000, groupIndex: 0 })
const fixture = (id: string, round: number, court: number, team1Id: string, team2Id: string) => ({
  id,
  eventId: 'e1',
  team1Id,
  team2Id,
  team1Points: null,
  team2Points: null,
  round,
  court,
  order: court - 1,
  phase: 'group',
  groupIndex: null,
  bracketRound: null,
  bracketSlot: null,
  thirdPlace: false,
  side1Players: [],
  side2Players: [],
})

const buildEvent = (games: unknown[]): OngoingEvent =>
  ({
    id: 'e1',
    name: 'Cup',
    date: '2026-12-20T00:00:00.000Z',
    createdByUserId: 'u1',
    config: {
      scheme: 'roundRobin',
      courts: [
        { label: '5', fromRound: 1, toRound: null },
        { label: '9', fromRound: 1, toRound: 4 },
      ],
    },
    teams: ['a', 'b', 'c', 'd'].map(team),
    soloPlayers: [],
    games,
    rotation: null,
  }) as unknown as OngoingEvent

describe('OngoingMatchesTab', () => {
  it('names each fixture’s court by the organiser’s label', () => {
    render(<OngoingMatchesTab event={buildEvent([fixture('g1', 1, 1, 'a', 'b'), fixture('g2', 1, 2, 'c', 'd')])} />)

    expect(screen.getAllByTestId('card').map((card) => card.textContent)).toEqual(['a1 & a2 @ 5', 'c1 & c2 @ 9'])
  })

  it('says how many teams sit out two rounds in a row', () => {
    const games = [
      fixture('g1', 1, 1, 'a', 'b'),
      fixture('g2', 2, 1, 'c', 'd'),
      fixture('g3', 3, 1, 'c', 'b'),
      fixture('g4', 4, 1, 'a', 'c'),
    ]
    render(<OngoingMatchesTab event={buildEvent(games)} />)

    expect(screen.getByText('ongoing.courts.doubleRestNote {"count":1}')).toBeInTheDocument()
  })

  it('stays quiet when nobody does', () => {
    const games = [fixture('g1', 1, 1, 'a', 'b'), fixture('g2', 1, 2, 'c', 'd'), fixture('g3', 2, 1, 'a', 'c')]
    render(<OngoingMatchesTab event={buildEvent(games)} />)

    expect(screen.queryByText(/doubleRestNote/)).not.toBeInTheDocument()
  })
})

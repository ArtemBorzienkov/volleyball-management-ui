import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { OngoingEvent } from '@/lib/types'

// The tab's own logic is what is under test: which rounds and groups it renders, whose fixtures land
// in which group card, and when the "next round" control is offered. The providers it happens to sit
// inside are stubbed so a test does not need a query client, a toast host or a live i18n bundle.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => (vars ? `${key} ${JSON.stringify(vars)}` : key),
  }),
}))
vi.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'admin', playerId: 'p1' } }),
}))
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }) }))
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

import { OngoingRotationTab } from './ongoing-rotation-tab'

const player = (id: string) => ({ id, name: id.toUpperCase() })

const standing = (id: string, place: number, wins: number) => ({
  place,
  player: player(id),
  rating: 1000,
  played: 3,
  wins,
  losses: 3 - wins,
  pointsFor: 60,
  pointsAgainst: 45,
  pointsDiff: 15,
})

const rotationGame = (round: number, groupIndex: number, order: number, side1: string[], side2: string[], played: boolean) => ({
  id: `g-${round}-${groupIndex}-${order}`,
  eventId: 'e1',
  team1Id: null,
  team2Id: null,
  team1Points: played ? 21 : null,
  team2Points: played ? 15 : null,
  round,
  court: order + 1,
  order,
  phase: 'rotation',
  groupIndex,
  bracketRound: null,
  bracketSlot: null,
  thirdPlace: false,
  side1Players: side1.map(player),
  side2Players: side2.map(player),
})

const buildEvent = (over: Partial<OngoingEvent> = {}): OngoingEvent =>
  ({
    id: 'e1',
    name: 'Cup',
    date: '2026-09-20T00:00:00.000Z',
    startTime: null,
    location: null,
    finishedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    createdByUserId: 'u1',
    config: {
      gamesPerPair: 1,
      courts: 1,
      maxTeams: null,
      scheme: 'fullRotation',
      groupCount: 2,
      qualifiersPerGroup: null,
      rotationRounds: 2,
      visibility: 'public',
      allowSoloRegistration: true,
    },
    teams: [],
    soloPlayers: [],
    games: [
      rotationGame(1, 0, 0, ['p1', 'p2'], ['p3', 'p4'], true),
      rotationGame(1, 0, 1, ['p1', 'p3'], ['p2', 'p4'], true),
      rotationGame(1, 0, 2, ['p1', 'p4'], ['p2', 'p3'], true),
      rotationGame(1, 1, 3, ['p5', 'p6'], ['p7', 'p8'], true),
      rotationGame(1, 1, 4, ['p5', 'p7'], ['p6', 'p8'], true),
      rotationGame(1, 1, 5, ['p5', 'p8'], ['p6', 'p7'], true),
    ],
    rotation: {
      totalRounds: 2,
      currentRound: 1,
      isFinished: false,
      rounds: [
        {
          round: 1,
          isComplete: true,
          groups: [
            { groupIndex: 0, standings: [standing('p1', 1, 3), standing('p2', 2, 1), standing('p3', 3, 1), standing('p4', 4, 1)] },
            { groupIndex: 1, standings: [standing('p5', 1, 3), standing('p6', 2, 1), standing('p7', 3, 1), standing('p8', 4, 1)] },
          ],
        },
      ],
      finalStandings: [],
    },
    ...over,
  }) as OngoingEvent

describe('OngoingRotationTab', () => {
  it('prompts for a roster when no round exists yet', () => {
    const event = buildEvent({ rotation: { totalRounds: 3, currentRound: 0, isFinished: false, rounds: [], finalStandings: [] } })

    render(<OngoingRotationTab event={event} />)

    // The prompt names how many players the configured groups need.
    expect(screen.getByText(/ongoing\.rotation\.notStarted.*"players":8/)).toBeInTheDocument()
  })

  it('renders one group card per group, each naming its rung of the ladder', () => {
    render(<OngoingRotationTab event={buildEvent()} />)

    expect(screen.getByText(/ongoing\.rotation\.groupStrongest/)).toBeInTheDocument()
    expect(screen.getByText(/ongoing\.rotation\.groupWeakest/)).toBeInTheDocument()
  })

  it('puts each fixture in its own group card and nowhere else', () => {
    render(<OngoingRotationTab event={buildEvent()} />)

    // Group 0's three pairings, and none of group 1's.
    expect(screen.getByText('P1 + P2')).toBeInTheDocument()
    expect(screen.getByText('P1 + P3')).toBeInTheDocument()
    expect(screen.getByText('P1 + P4')).toBeInTheDocument()
    expect(screen.getByText('P5 + P6')).toBeInTheDocument()

    const strongest = screen.getByText(/ongoing\.rotation\.groupStrongest/).closest('div')
    expect(strongest?.textContent).toContain('P1 + P2')
    expect(strongest?.textContent).not.toContain('P5 + P6')
  })

  it('offers the next round once every result of the current one is in', () => {
    render(<OngoingRotationTab event={buildEvent()} />)

    expect(screen.getByRole('button', { name: /ongoing\.rotation\.nextRound/ })).toBeEnabled()
  })

  it('disables the next round while a result is missing, and says why', () => {
    const event = buildEvent()
    event.games[0].team1Points = null
    event.games[0].team2Points = null
    event.rotation!.rounds[0].isComplete = false

    render(<OngoingRotationTab event={event} />)

    expect(screen.getByRole('button', { name: /ongoing\.rotation\.nextRound/ })).toBeDisabled()
    expect(screen.getByText(/ongoing\.rotation\.finishRoundFirst/)).toBeInTheDocument()
  })

  it('offers no next round on the last one — the ladder is the result', () => {
    const event = buildEvent()
    event.rotation!.currentRound = 2
    event.rotation!.rounds = [{ ...event.rotation!.rounds[0], round: 2 }]

    render(<OngoingRotationTab event={event} />)

    expect(screen.queryByRole('button', { name: /ongoing\.rotation\.nextRound/ })).not.toBeInTheDocument()
  })

  it('hides the podium while the event is still running', () => {
    render(<OngoingRotationTab event={buildEvent()} />)

    expect(screen.queryByText(/ongoing\.rotation\.finalStandings/)).not.toBeInTheDocument()
  })

  it('shows the podium once the event is finished', () => {
    const finished = buildEvent()
    finished.rotation!.currentRound = 2
    finished.rotation!.rounds = [{ ...finished.rotation!.rounds[0], round: 2 }]
    finished.rotation!.isFinished = true
    finished.rotation!.finalStandings = [standing('p1', 1, 3), standing('p2', 2, 1)]

    render(<OngoingRotationTab event={finished} />)

    // Scoped to the podium card: the group tables below name the same players.
    const podium = screen.getByText(/ongoing\.rotation\.finalStandings/).parentElement
    const places = [...podium!.querySelectorAll('li')].map((item) => item.textContent)

    expect(places).toEqual(['1.P1', '2.P2'])
  })

  it('shows wins and difference, and no points-scored column', () => {
    render(<OngoingRotationTab event={buildEvent()} />)

    expect(screen.getAllByText('ongoing.rotation.wins').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ongoing.rotation.diff').length).toBeGreaterThan(0)
    expect(screen.queryByText('ongoing.rotation.points')).not.toBeInTheDocument()
    // 60 points scored is in the fixture but must not reach the table.
    expect(screen.queryByText('60')).not.toBeInTheDocument()
  })

  it('signs the difference so a negative one is unambiguous', () => {
    const event = buildEvent()
    // Distinct values across both groups, so each assertion below matches exactly one cell.
    const diffs = [21, -11, 7, 0]
    event.rotation!.rounds[0].groups[0].standings.forEach((row, index) => {
      row.pointsDiff = diffs[index]
    })
    event.rotation!.rounds[0].groups[1].standings.forEach((row, index) => {
      row.pointsDiff = 100 + index
    })

    render(<OngoingRotationTab event={event} />)

    expect(screen.getByText('+21')).toBeInTheDocument()
    expect(screen.getByText('-11')).toBeInTheDocument()
    // Zero carries no sign — "+0" would read as a gain.
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('+0')).not.toBeInTheDocument()
  })

  it('masks the name of a player who opted out, in the table and in the fixtures', () => {
    const event = buildEvent()
    event.rotation!.rounds[0].groups[0].standings[0].player = {
      id: 'p1',
      name: 'Artem Borzienkov',
      isAnonymous: true,
    }
    event.games[0].side1Players = [
      { id: 'p1', name: 'Artem Borzienkov', isAnonymous: true },
      { id: 'p2', name: 'Open Player' },
    ]

    render(<OngoingRotationTab event={event} />)

    expect(screen.getByText('Ar*** Bo***')).toBeInTheDocument()
    expect(screen.getByText('Ar*** Bo*** + Open Player')).toBeInTheDocument()
    expect(screen.queryByText(/Borzienkov/)).not.toBeInTheDocument()
  })

  it('lists the newest round first, since that is the one being played', () => {
    const event = buildEvent()
    event.rotation!.currentRound = 2
    event.rotation!.totalRounds = 3
    event.rotation!.rounds = [
      { ...event.rotation!.rounds[0], round: 1 },
      { ...event.rotation!.rounds[0], round: 2 },
    ]

    render(<OngoingRotationTab event={event} />)

    const headings = screen.getAllByText(/ongoing\.rotation\.round /).map((node) => node.textContent)
    expect(headings[0]).toContain('"round":2')
    expect(headings[1]).toContain('"round":1')
  })
})

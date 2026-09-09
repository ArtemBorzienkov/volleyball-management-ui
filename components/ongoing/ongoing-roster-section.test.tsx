import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { OngoingEvent } from '@/lib/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => (vars ? `${key} ${JSON.stringify(vars)}` : key),
  }),
}))
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }) }))
vi.mock('@/components/ongoing/solo-pool-section', () => ({ SoloPoolSection: () => null }))

import { OngoingRosterSection } from './ongoing-roster-section'

const entrant = (n: number) => ({ id: `s${n}`, player: { id: `p${n}`, name: `P${n}` }, rating: 1000 })
const team = (n: number) => ({
  id: `t${n}`,
  player1: { id: `a${n}`, name: `A${n}` },
  player2: { id: `b${n}`, name: `B${n}` },
  rating: 2000,
  groupIndex: null,
})

const buildEvent = (scheme: string, teams: unknown[], soloPlayers: unknown[]): OngoingEvent =>
  ({
    id: 'e1',
    name: 'Cup',
    date: '2026-12-20T00:00:00.000Z',
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
      scheme,
      groupCount: scheme === 'fullRotation' ? 2 : 1,
      qualifiersPerGroup: null,
      rotationRounds: 3,
      visibility: 'public',
      allowSoloRegistration: true,
    },
    teams,
    soloPlayers,
    games: [],
    rotation: null,
  }) as OngoingEvent

const generateButton = () => screen.getByRole('button', { name: /ongoing\.config\.generate/ })

describe('OngoingRosterSection — teams card', () => {
  it('is shown for a pairs-based scheme', () => {
    render(<OngoingRosterSection event={buildEvent('roundRobin', [team(1), team(2)], [])} players={[]} />)

    expect(screen.getByText('ongoing.config.teamsTitle')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ongoing\.config\.saveTeams/ })).toBeInTheDocument()
  })

  it('is removed for a rotation tournament — there are no teams to build', () => {
    render(<OngoingRosterSection event={buildEvent('fullRotation', [], [])} players={[]} />)

    expect(screen.queryByText('ongoing.config.teamsTitle')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ongoing\.config\.saveTeams/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ongoing\.config\.addTeam/ })).not.toBeInTheDocument()
  })
})

describe('OngoingRosterSection — generate gating', () => {
  it('needs two teams in a pairs-based scheme', () => {
    render(<OngoingRosterSection event={buildEvent('roundRobin', [team(1)], [])} players={[]} />)

    expect(screen.getByText('ongoing.config.needTeams')).toBeInTheDocument()
    expect(generateButton()).toBeDisabled()
  })

  it('counts players, not teams, in a rotation tournament', () => {
    const short = Array.from({ length: 7 }, (_, i) => entrant(i))
    render(<OngoingRosterSection event={buildEvent('fullRotation', [], short)} players={[]} />)

    // Names the seats it needs and how many are in, rather than asking for teams that cannot exist.
    expect(screen.getByText(/ongoing\.config\.needRotationPlayers.*"seats":8.*"registered":7/)).toBeInTheDocument()
    expect(screen.queryByText('ongoing.config.needTeams')).not.toBeInTheDocument()
    expect(generateButton()).toBeDisabled()
  })

  it('enables generate once the rotation groups fill exactly', () => {
    const full = Array.from({ length: 8 }, (_, i) => entrant(i))
    render(<OngoingRosterSection event={buildEvent('fullRotation', [], full)} players={[]} />)

    expect(generateButton()).toBeEnabled()
    expect(screen.queryByText(/needRotationPlayers/)).not.toBeInTheDocument()
  })

  it('does not block a rotation event on unsaved teams it can never have', () => {
    const full = Array.from({ length: 8 }, (_, i) => entrant(i))
    render(<OngoingRosterSection event={buildEvent('fullRotation', [], full)} players={[]} />)

    expect(screen.queryByText('ongoing.config.unsavedTeams')).not.toBeInTheDocument()
    expect(generateButton()).toBeEnabled()
  })
})

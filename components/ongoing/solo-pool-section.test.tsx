import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { OngoingEvent } from '@/lib/types'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }) }))

import { SoloPoolSection } from './solo-pool-section'

const buildEvent = (scheme: string, soloPlayers: unknown[] = []): OngoingEvent =>
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
    teams: [],
    soloPlayers,
    games: [],
    rotation: null,
  }) as OngoingEvent

const entrant = (name: string, isAnonymous = false) => ({
  id: `s-${name}`,
  player: { id: `p-${name}`, name, isAnonymous },
  rating: 1000,
})

describe('SoloPoolSection heading', () => {
  it('calls the pool "participants" in a rotation tournament — entering alone is the only way in', () => {
    render(<SoloPoolSection event={buildEvent('fullRotation', [entrant('Ann')])} players={[]} disabled={false} />)

    expect(screen.getByText('calendar.participants')).toBeInTheDocument()
    expect(screen.queryByText('ongoing.config.solo.title')).not.toBeInTheDocument()
  })

  it('keeps the "registered without a partner" heading where pairs are the norm', () => {
    render(<SoloPoolSection event={buildEvent('roundRobin', [entrant('Ann')])} players={[]} disabled={false} />)

    expect(screen.getByText('ongoing.config.solo.title')).toBeInTheDocument()
    expect(screen.queryByText('calendar.participants')).not.toBeInTheDocument()
  })

  it('words the empty state per scheme too', () => {
    render(<SoloPoolSection event={buildEvent('fullRotation')} players={[]} disabled={false} />)

    expect(screen.getByText('ongoing.config.solo.emptyRotation')).toBeInTheDocument()
  })

  it('still masks an entrant who opted out of being named', () => {
    render(
      <SoloPoolSection
        event={buildEvent('fullRotation', [entrant('Artem Borzienkov', true)])}
        players={[]}
        disabled={false}
      />,
    )

    expect(screen.getByText(/Ar\*\*\* Bo\*\*\*/)).toBeInTheDocument()
    expect(screen.queryByText(/Borzienkov/)).not.toBeInTheDocument()
  })
})

describe('SoloPoolSection form-teams action', () => {
  const twoEntrants = [entrant('Ann'), entrant('Bob')]

  it('is offered where pairing the pool into teams makes sense', () => {
    render(<SoloPoolSection event={buildEvent('roundRobin', twoEntrants)} players={[]} disabled={false} />)

    expect(screen.getByRole('button', { name: 'ongoing.config.solo.formTeams' })).toBeInTheDocument()
  })

  it('is withheld for a rotation tournament — fixed pairs contradict the format', () => {
    render(<SoloPoolSection event={buildEvent('fullRotation', twoEntrants)} players={[]} disabled={false} />)

    expect(screen.queryByRole('button', { name: 'ongoing.config.solo.formTeams' })).not.toBeInTheDocument()
  })
})

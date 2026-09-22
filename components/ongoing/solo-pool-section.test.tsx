import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { OngoingEvent } from '@/lib/types'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

// The preview the mocked mutation hands back, so a test can open the pairing dialog on a draft of
// its choosing. Hoisted because vi.mock factories run before the module body.
const mocks = vi.hoisted(() => ({ preview: { pairs: [] as unknown[], unpaired: [] as string[] } }))

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: { onSuccess?: (data: unknown) => void }) => ({
    mutate: () => options.onSuccess?.(mocks.preview),
    isPending: false,
    isError: false,
    error: null,
  }),
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

const entrant = (name: string, isAnonymous = false, rating = 1000) => ({
  id: `s-${name}`,
  player: { id: `p-${name}`, name, isAnonymous },
  rating,
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

describe('SoloPoolSection — building teams by hand', () => {
  const POOL = [
    entrant('Ann', false, 1300),
    entrant('Bob', false, 1200),
    entrant('Cid', false, 1000),
    entrant('Dee', false, 800),
  ]

  const openDialog = (pairs: Array<[string, string]>, pool = POOL) => {
    mocks.preview = {
      pairs: pairs.map(([a, b]) => ({
        player1: { id: `p-${a}`, name: a },
        player2: { id: `p-${b}`, name: b },
        rating: 2000,
      })),
      unpaired: [],
    }
    render(<SoloPoolSection event={buildEvent('roundRobin', pool)} players={[]} disabled={false} />)
    fireEvent.click(screen.getByText('ongoing.config.solo.formTeams'))
  }

  const rows = () => screen.queryAllByLabelText('ongoing.config.solo.removePair')
  const button = (key: string) => screen.getByText(key).closest('button')!

  it('opens on the suggested pairs, one removable row each', () => {
    openDialog([['Ann', 'Dee'], ['Bob', 'Cid']])

    expect(rows()).toHaveLength(2)
  })

  it('adds a blank row to build a pair by hand', () => {
    openDialog([['Ann', 'Dee']])

    fireEvent.click(button('ongoing.config.solo.addPair'))

    expect(rows()).toHaveLength(2)
  })

  // A blank row would be dropped on send, taking a player with it — say so instead.
  it('blocks the confirm while a row is unfinished', () => {
    openDialog([['Ann', 'Dee']])
    expect(button('ongoing.config.solo.confirm')).not.toBeDisabled()

    fireEvent.click(button('ongoing.config.solo.addPair'))

    expect(screen.getByText('ongoing.config.solo.incompletePair')).toBeInTheDocument()
    expect(button('ongoing.config.solo.confirm')).toBeDisabled()
  })

  it('removes a pair and returns both players to the pool', () => {
    openDialog([['Ann', 'Dee'], ['Bob', 'Cid']])

    fireEvent.click(rows()[0])

    expect(rows()).toHaveLength(1)
    // Scoped to the leftover panel: both names also appear in the pool list behind the dialog.
    const leftovers = screen.getByText('ongoing.config.solo.unpaired').parentElement!
    expect(leftovers.textContent).toContain('Ann')
    expect(leftovers.textContent).toContain('Dee')
    expect(leftovers.textContent).not.toContain('Bob')
  })

  it('pairs only the players left over, keeping the hand-made rows', () => {
    openDialog([['Ann', 'Bob']])
    expect(rows()).toHaveLength(1)

    fireEvent.click(button('ongoing.config.solo.autoPairRest'))

    expect(rows()).toHaveLength(2)
    expect(screen.queryByText('ongoing.config.solo.unpaired')).not.toBeInTheDocument()
  })

  it('offers neither control once fewer than two players are left', () => {
    openDialog([['Ann', 'Dee'], ['Bob', 'Cid']])

    expect(button('ongoing.config.solo.addPair')).toBeDisabled()
    expect(button('ongoing.config.solo.autoPairRest')).toBeDisabled()
  })

  it('says so when every pair has been removed', () => {
    openDialog([['Ann', 'Dee']])

    fireEvent.click(rows()[0])

    expect(screen.getByText('ongoing.config.solo.noPairs')).toBeInTheDocument()
    expect(button('ongoing.config.solo.confirm')).toBeDisabled()
  })
})

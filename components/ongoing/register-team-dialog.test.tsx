import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { OngoingOpenEvent } from '@/lib/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'player', playerId: 'p1' } }),
}))
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }) }))
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, isError: false, error: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

import { RegisterTeamDialog } from './register-team-dialog'

const buildEvent = (over: Partial<OngoingOpenEvent> = {}): OngoingOpenEvent =>
  ({
    id: 'e1',
    name: 'Cup',
    date: '2026-12-20T00:00:00.000Z',
    startTime: null,
    location: null,
    maxTeams: null,
    teamsCount: 0,
    createdByUserId: 'u2',
    createdBy: null,
    teams: [],
    visibility: 'public',
    allowSoloRegistration: true,
    soloPlayers: [],
    scheme: 'roundRobin',
    groupCount: 1,
    ...over,
  }) as OngoingOpenEvent

const players = [
  { id: 'p1', name: 'Me' },
  { id: 'p2', name: 'Other' },
] as never[]

// fireEvent, not element.click(): the Radix trigger opens on a React-handled event and its content
// lands in a portal, so the assertions below await it with findBy*.
const openDialog = () => fireEvent.click(screen.getByRole('button', { name: /calendar\.register$/ }))

describe('RegisterTeamDialog — pairs-based scheme', () => {
  it('titles the dialog as a team registration and offers the partner/solo choice', async () => {
    render(<RegisterTeamDialog event={buildEvent()} players={players} />)
    openDialog()

    expect(await screen.findByText('calendar.registerTitle')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'calendar.modeWithPartner' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'calendar.modeSolo' })).toBeInTheDocument()
  })
})

describe('RegisterTeamDialog — already entered', () => {
  // The mocked useAuth below is player p1; these fixtures put that player on the roster.
  const entrant = (playerId: string) => ({
    id: `s-${playerId}`,
    player: { id: playerId, name: playerId },
    rating: 1000,
  })
  const pair = (a: string, b: string) => ({
    id: `t-${a}`,
    player1: { id: a, name: a },
    player2: { id: b, name: b },
    rating: 2000,
    groupIndex: null,
  })

  const registerControl = () => screen.queryByRole('button', { name: /calendar\.register$/ })

  it('offers registration to someone who has not entered', () => {
    render(<RegisterTeamDialog event={buildEvent()} players={players} />)

    expect(registerControl()).toBeInTheDocument()
  })

  it('offers nothing to a player already in the solo pool', () => {
    render(
      <RegisterTeamDialog event={buildEvent({ soloPlayers: [entrant('p1')] as never[] })} players={players} />,
    )

    expect(registerControl()).not.toBeInTheDocument()
  })

  it('offers nothing to a player already on a team', () => {
    render(<RegisterTeamDialog event={buildEvent({ teams: [pair('p1', 'p9')] as never[] })} players={players} />)

    expect(registerControl()).not.toBeInTheDocument()
  })

  it('recognises the player as the second half of a pair too', () => {
    render(<RegisterTeamDialog event={buildEvent({ teams: [pair('p9', 'p1')] as never[] })} players={players} />)

    expect(registerControl()).not.toBeInTheDocument()
  })

  it('still offers registration when somebody else is entered', () => {
    render(
      <RegisterTeamDialog event={buildEvent({ soloPlayers: [entrant('p9')] as never[] })} players={players} />,
    )

    expect(registerControl()).toBeInTheDocument()
  })

  it('says nothing at all once entered, not even that the tournament has started', () => {
    // Being in settles the question — the cancel control beside this one is the remaining action.
    render(
      <RegisterTeamDialog
        event={buildEvent({ hasStarted: true, soloPlayers: [entrant('p1')] as never[] })}
        players={players}
      />,
    )

    expect(screen.queryByText('calendar.inProgressBadge')).not.toBeInTheDocument()
    expect(registerControl()).not.toBeInTheDocument()
  })
})

describe('RegisterTeamDialog — tournament state', () => {
  it('says the tournament is in progress instead of offering registration', () => {
    render(<RegisterTeamDialog event={buildEvent({ hasStarted: true })} players={players} />)

    expect(screen.getByText('calendar.inProgressBadge')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /calendar\.register$/ })).not.toBeInTheDocument()
  })

  it('says registration is closed once the deadline has passed', () => {
    render(<RegisterTeamDialog event={buildEvent({ registrationOpen: false })} players={players} />)

    expect(screen.getByText('calendar.registrationClosedBadge')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /calendar\.register$/ })).not.toBeInTheDocument()
  })

  it('prefers the in-progress wording when both apply — it is the more specific fact', () => {
    render(
      <RegisterTeamDialog event={buildEvent({ hasStarted: true, registrationOpen: false })} players={players} />,
    )

    expect(screen.getByText('calendar.inProgressBadge')).toBeInTheDocument()
    expect(screen.queryByText('calendar.registrationClosedBadge')).not.toBeInTheDocument()
  })

  it('reports being in progress rather than being full — having started is the reason that matters', () => {
    const startedAndFull = buildEvent({
      hasStarted: true,
      maxTeams: 1,
      teamsCount: 1,
    })

    render(<RegisterTeamDialog event={startedAndFull} players={players} />)

    expect(screen.getByText('calendar.inProgressBadge')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /calendar\.noSpots/ })).not.toBeInTheDocument()
  })

  it('still offers registration on an open, unstarted tournament', () => {
    render(<RegisterTeamDialog event={buildEvent()} players={players} />)

    expect(screen.getByRole('button', { name: /calendar\.register$/ })).toBeInTheDocument()
    expect(screen.queryByText('calendar.inProgressBadge')).not.toBeInTheDocument()
  })

  it('treats an absent registrationOpen flag as open, for an older payload', () => {
    const older = buildEvent()
    delete (older as { registrationOpen?: boolean }).registrationOpen

    render(<RegisterTeamDialog event={older} players={players} />)

    expect(screen.getByRole('button', { name: /calendar\.register$/ })).toBeInTheDocument()
  })
})

describe('RegisterTeamDialog — fullRotation', () => {
  const rotationEvent = () => buildEvent({ scheme: 'fullRotation', groupCount: 2 })

  it('titles the dialog as a player registration, not a team one', async () => {
    render(<RegisterTeamDialog event={rotationEvent()} players={players} />)
    openDialog()

    expect(await screen.findByText('calendar.registerSoloTitle')).toBeInTheDocument()
    expect(screen.queryByText('calendar.registerTitle')).not.toBeInTheDocument()
  })

  it('offers no partner/solo toggle — there are no pairs to register', async () => {
    render(<RegisterTeamDialog event={rotationEvent()} players={players} />)
    openDialog()
    await screen.findByText('calendar.registerSoloTitle')

    expect(screen.queryByRole('button', { name: 'calendar.modeWithPartner' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'calendar.modeSolo' })).not.toBeInTheDocument()
  })

  it('opens straight into solo mode and explains the grouping', async () => {
    render(<RegisterTeamDialog event={rotationEvent()} players={players} />)
    openDialog()

    expect(await screen.findByText('calendar.rotationSoloHint')).toBeInTheDocument()
    // The partner picker belongs to the mode this scheme never enters.
    expect(screen.queryByText('calendar.player2')).not.toBeInTheDocument()
  })

  it('disables the control once every seat is taken', () => {
    const full = buildEvent({
      scheme: 'fullRotation',
      groupCount: 2,
      soloPlayers: Array.from({ length: 8 }, (_, index) => ({
        id: `s${index}`,
        player: { id: `p${index + 10}`, name: `Player ${index}` },
        rating: 1000,
      })) as never[],
    })

    render(<RegisterTeamDialog event={full} players={players} />)

    expect(screen.getByRole('button', { name: /calendar\.noSpots/ })).toBeDisabled()
  })
})

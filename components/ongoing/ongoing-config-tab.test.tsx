import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { OngoingEvent } from '@/lib/types'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
// mutate runs the real mutationFn, so a test can read the body the form sends from the fetch stub.
vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: { mutationFn?: () => unknown }) => ({
    mutate: () => options.mutationFn?.(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useQuery: () => ({ data: [] }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))
vi.mock('@/components/ongoing/ongoing-roster-section', () => ({
  OngoingRosterSection: () => null,
  rosterSignature: () => '',
}))

import { OngoingConfigTab } from './ongoing-config-tab'

const buildEvent = (
  scheme: string,
  allowSolo: boolean,
  configOverrides: Partial<OngoingEvent['config']> = {},
): OngoingEvent =>
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
      courts: [{ label: '1', fromRound: 1, toRound: null }],
      maxTeams: null,
      scheme,
      groupCount: scheme === 'fullRotation' ? 2 : 1,
      qualifiersPerGroup: null,
      rotationRounds: 3,
      visibility: 'public',
      allowSoloRegistration: allowSolo,
      ...configOverrides,
    },
    teams: [],
    soloPlayers: [],
    games: [],
    rotation: null,
    ...(scheme === 'fullRotation'
      ? { rotation: { totalRounds: 3, currentRound: 0, isFinished: false, rounds: [], finalStandings: [] } }
      : {}),
  }) as OngoingEvent

const soloCheckbox = () =>
  screen.getByText('ongoing.create.allowSoloLabel').closest('label')!.querySelector('input[type=checkbox]')!

describe('OngoingConfigTab — solo registration checkbox', () => {
  it('is editable for a pairs-based scheme', () => {
    render(<OngoingConfigTab event={buildEvent('roundRobin', false)} />)

    const checkbox = soloCheckbox()
    expect(checkbox).not.toBeDisabled()
    expect(checkbox).not.toBeChecked()
    expect(screen.getByText('ongoing.create.allowSoloHint')).toBeInTheDocument()
  })

  it('is locked on for fullRotation, which registers players rather than pairs', () => {
    // Stored as false to prove the control follows the scheme, not the stored flag: the API forces
    // it on either way, so an editable unchecked box would be a lie.
    render(<OngoingConfigTab event={buildEvent('fullRotation', false)} />)

    const checkbox = soloCheckbox()
    expect(checkbox).toBeDisabled()
    expect(checkbox).toBeChecked()
  })

  it('says why it is locked instead of leaving the box unexplained', () => {
    render(<OngoingConfigTab event={buildEvent('fullRotation', true)} />)

    expect(screen.getByText('ongoing.config.allowSoloLockedHint')).toBeInTheDocument()
    expect(screen.queryByText('ongoing.create.allowSoloHint')).not.toBeInTheDocument()
  })

  it('shows the rotation group and round fields, and hides the playoff qualifier field', () => {
    render(<OngoingConfigTab event={buildEvent('fullRotation', true)} />)

    expect(screen.getByText('ongoing.config.rotationGroupCount')).toBeInTheDocument()
    expect(screen.getByText('ongoing.config.rotationRounds')).toBeInTheDocument()
    expect(screen.queryByText('ongoing.config.qualifiersPerGroup')).not.toBeInTheDocument()
  })
})

const checkboxFor = (label: string) =>
  screen.getByText(label).closest('label')!.querySelector('input[type=checkbox]')! as HTMLInputElement

describe('OngoingConfigTab — solo-only registration', () => {
  it('is off by default and editable for a pairs-based scheme', () => {
    render(<OngoingConfigTab event={buildEvent('roundRobin', false)} />)

    const checkbox = checkboxFor('ongoing.create.soloOnlyLabel')
    expect(checkbox).not.toBeDisabled()
    expect(checkbox).not.toBeChecked()
  })

  // Ticking it must show the pool as open too, or the form would claim there is no way in at all.
  it('carries the plain solo checkbox with it', () => {
    render(<OngoingConfigTab event={buildEvent('roundRobin', false)} />)

    fireEvent.click(checkboxFor('ongoing.create.soloOnlyLabel'))

    expect(checkboxFor('ongoing.create.allowSoloLabel')).toBeChecked()
  })

  it('is locked on for fullRotation, which has no pair entry path at all', () => {
    render(<OngoingConfigTab event={buildEvent('fullRotation', true)} />)

    const checkbox = checkboxFor('ongoing.create.soloOnlyLabel')
    expect(checkbox).toBeDisabled()
    expect(checkbox).toBeChecked()
    expect(screen.getByText('ongoing.config.soloOnlyLockedHint')).toBeInTheDocument()
  })

  it('reflects a stored flag on a pairs-based scheme', () => {
    render(<OngoingConfigTab event={buildEvent('roundRobin', true, { soloOnlyRegistration: true })} />)

    expect(checkboxFor('ongoing.create.soloOnlyLabel')).toBeChecked()
  })
})

describe('OngoingConfigTab — rule checkboxes', () => {
  it('offers one checkbox per rule of the scheme, all ticked by default', () => {
    render(<OngoingConfigTab event={buildEvent('roundRobin', false)} />)

    expect(screen.getByText('ongoing.config.rulesTitle')).toBeInTheDocument()
    for (const label of ['ongoing.rules.roundRobin.step1', 'ongoing.rules.servingTitle', 'ongoing.rules.tiebreakTitle']) {
      expect(checkboxFor(label)).toBeChecked()
    }
  })

  it('shows a stored hidden rule as unticked', () => {
    render(<OngoingConfigTab event={buildEvent('roundRobin', false, { hiddenRules: ['serving'] })} />)

    expect(checkboxFor('ongoing.rules.servingTitle')).not.toBeChecked()
    expect(checkboxFor('ongoing.rules.tiebreakTitle')).toBeChecked()
  })

  it('unticks and re-ticks a rule', () => {
    render(<OngoingConfigTab event={buildEvent('roundRobin', false)} />)

    fireEvent.click(checkboxFor('ongoing.rules.roundRobin.step2'))
    expect(checkboxFor('ongoing.rules.roundRobin.step2')).not.toBeChecked()

    fireEvent.click(checkboxFor('ongoing.rules.roundRobin.step2'))
    expect(checkboxFor('ongoing.rules.roundRobin.step2')).toBeChecked()
  })

  // The list follows the scheme picked in the form above, not the saved one, so the boxes match
  // what the Rules tab will show once saved.
  it('lists the rotation steps for a fullRotation tournament', () => {
    render(<OngoingConfigTab event={buildEvent('fullRotation', true)} />)

    expect(checkboxFor('ongoing.rules.fullRotation.step5')).toBeChecked()
    expect(screen.queryByText('ongoing.rules.roundRobin.step1')).not.toBeInTheDocument()
  })
})

describe('OngoingConfigTab — courts', () => {
  afterEach(() => vi.restoreAllMocks())

  const COURTS = [
    { label: '5', fromRound: 1, toRound: null },
    { label: '7', fromRound: 1, toRound: null },
  ]
  const fixture = (id: string, round: number, court: number, points?: [number, number]) => ({
    id,
    eventId: 'e1',
    team1Id: 't1',
    team2Id: 't2',
    team1Points: points ? points[0] : null,
    team2Points: points ? points[1] : null,
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
  const withCourts = (games: unknown[] = []) =>
    ({ ...buildEvent('roundRobin', false, { courts: COURTS }), games }) as OngoingEvent

  const sentBody = (fetchStub: ReturnType<typeof vi.fn>) => JSON.parse(fetchStub.mock.calls[0][1].body)
  const stubFetch = () => {
    const stub = vi.fn(async () => ({ ok: true, json: async () => ({}) }))
    vi.stubGlobal('fetch', stub)
    return stub
  }
  const save = () => fireEvent.click(screen.getByText('ongoing.config.save'))

  it('replaces the old courts number with the court list', () => {
    render(<OngoingConfigTab event={withCourts()} />)

    expect(screen.getByText('ongoing.courts.title')).toBeInTheDocument()
    expect(screen.queryByText('ongoing.config.courts')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText('ongoing.courts.labelFor').map((input) => (input as HTMLInputElement).value)).toEqual(['5', '7'])
  })

  it('is hidden for full rotation, which schedules itself', () => {
    render(<OngoingConfigTab event={buildEvent('fullRotation', true, { courts: COURTS })} />)

    expect(screen.queryByText('ongoing.courts.title')).not.toBeInTheDocument()
  })

  it('does not send the hidden court list for full rotation', () => {
    const fetchStub = stubFetch()
    render(<OngoingConfigTab event={buildEvent('fullRotation', true, { courts: COURTS })} />)

    save()

    expect(sentBody(fetchStub)).not.toHaveProperty('courts')
  })

  it('sends the court list in order, a blank "to" as the end', () => {
    const fetchStub = stubFetch()
    render(<OngoingConfigTab event={withCourts()} />)

    fireEvent.change(screen.getAllByLabelText('ongoing.courts.toRoundFor')[1], { target: { value: '4' } })
    save()

    expect(sentBody(fetchStub).courts).toEqual([
      { label: '5', fromRound: 1, toRound: null },
      { label: '7', fromRound: 1, toRound: 4 },
    ])
  })

  it('asks before a change that rebuilds the schedule, and sends nothing if declined', () => {
    const fetchStub = stubFetch()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<OngoingConfigTab event={withCourts([fixture('g1', 1, 1), fixture('g2', 1, 2)])} />)

    fireEvent.click(screen.getByText('ongoing.courts.add'))
    save()

    expect(confirm).toHaveBeenCalledWith('ongoing.courts.rebuildConfirm')
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('saves once the rebuild is confirmed', () => {
    const fetchStub = stubFetch()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<OngoingConfigTab event={withCourts([fixture('g1', 1, 1)])} />)

    fireEvent.click(screen.getByText('ongoing.courts.add'))
    save()

    expect(sentBody(fetchStub).courts).toHaveLength(3)
  })

  it('does not ask for a rename — nothing is rebuilt', () => {
    stubFetch()
    const confirm = vi.spyOn(window, 'confirm')
    render(<OngoingConfigTab event={withCourts([fixture('g1', 1, 1)])} />)

    fireEvent.change(screen.getAllByLabelText('ongoing.courts.labelFor')[0], { target: { value: 'Центр' } })
    save()

    expect(confirm).not.toHaveBeenCalled()
  })

  it('does not ask when there is no schedule to rebuild', () => {
    stubFetch()
    const confirm = vi.spyOn(window, 'confirm')
    render(<OngoingConfigTab event={withCourts()} />)

    fireEvent.click(screen.getByText('ongoing.courts.add'))
    save()

    expect(confirm).not.toHaveBeenCalled()
  })

  it('locks everything but the names once a result is recorded', () => {
    render(<OngoingConfigTab event={withCourts([fixture('g1', 1, 1, [21, 15])])} />)

    expect(screen.getByText('ongoing.courts.lockedHint')).toBeInTheDocument()
    expect(screen.getByText('ongoing.courts.add').closest('button')).toBeDisabled()
    expect(screen.getAllByLabelText('ongoing.courts.labelFor')[0]).not.toBeDisabled()
  })

  it('will not save an invalid court list', () => {
    render(<OngoingConfigTab event={withCourts()} />)

    fireEvent.change(screen.getAllByLabelText('ongoing.courts.labelFor')[1], { target: { value: '5' } })

    expect(screen.getByText('ongoing.config.save').closest('button')).toBeDisabled()
  })
})

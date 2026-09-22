import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { OngoingEvent } from '@/lib/types'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
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
      courts: 1,
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

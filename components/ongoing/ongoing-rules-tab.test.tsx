import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { OngoingEvent } from '@/lib/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => (vars ? `${key} ${JSON.stringify(vars)}` : key),
  }),
}))

import { OngoingRulesTab } from './ongoing-rules-tab'

const buildEvent = (config: Partial<OngoingEvent['config']>): OngoingEvent =>
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
      courts: 2,
      maxTeams: null,
      scheme: 'roundRobin',
      groupCount: 1,
      qualifiersPerGroup: null,
      rotationRounds: 3,
      visibility: 'public',
      allowSoloRegistration: false,
      ...config,
    },
    teams: [],
    soloPlayers: [],
    games: [],
    rotation: null,
  }) as OngoingEvent

describe('OngoingRulesTab', () => {
  it('describes a round robin', () => {
    render(<OngoingRulesTab event={buildEvent({ scheme: 'roundRobin' })} />)

    expect(screen.getByText('ongoing.rules.roundRobin.title')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('describes a groups + playoff tournament, with its own bracket size', () => {
    render(<OngoingRulesTab event={buildEvent({ scheme: 'groupsPlayoff', groupCount: 4, qualifiersPerGroup: 2 })} />)

    expect(screen.getByText('ongoing.rules.groupsPlayoff.title')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    // 4 groups x 2 qualifiers = an 8-team bracket.
    expect(screen.getAllByText(/"bracketTeams":8/).length).toBeGreaterThan(0)
  })

  it('describes a full rotation, with its own player count', () => {
    render(<OngoingRulesTab event={buildEvent({ scheme: 'fullRotation', groupCount: 3, rotationRounds: 4 })} />)

    expect(screen.getByText('ongoing.rules.fullRotation.title')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    // 3 groups of 4.
    expect(screen.getAllByText(/"players":12/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/"rounds":4/).length).toBeGreaterThan(0)
  })

  it('carries the court and repeat counts into the copy', () => {
    render(<OngoingRulesTab event={buildEvent({ scheme: 'roundRobin', courts: 3, gamesPerPair: 2 })} />)

    expect(screen.getAllByText(/"courts":3/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/"gamesPerPair":2/).length).toBeGreaterThan(0)
  })

  it('shows the serving rule whatever the format is', () => {
    for (const scheme of ['roundRobin', 'groupsPlayoff', 'fullRotation']) {
      const { unmount } = render(<OngoingRulesTab event={buildEvent({ scheme, qualifiersPerGroup: 2, groupCount: 2 })} />)

      expect(screen.getByText('ongoing.rules.servingTitle')).toBeInTheDocument()
      expect(screen.getByText('ongoing.rules.serving')).toBeInTheDocument()
      unmount()
    }
  })

  it('describes the rotation group size without pinning the field size', () => {
    // The summary used to name a player total, which was wrong for a tournament whose group count
    // is decided by how many turn up.
    render(<OngoingRulesTab event={buildEvent({ scheme: 'fullRotation', groupCount: 3 })} />)

    const summary = screen.getByText(/ongoing\.rules\.fullRotation\.summary/)
    expect(summary.textContent).toContain('"groupSize":4')
  })

  it('explains the rotation tie-break for a rotation tournament', () => {
    render(<OngoingRulesTab event={buildEvent({ scheme: 'fullRotation', groupCount: 2 })} />)

    expect(screen.getByText('ongoing.rules.tiebreakRotation')).toBeInTheDocument()
    expect(screen.queryByText('ongoing.rules.tiebreakTeams')).not.toBeInTheDocument()
  })

  it('explains the team tie-break for the other schemes', () => {
    render(<OngoingRulesTab event={buildEvent({ scheme: 'groupsPlayoff', qualifiersPerGroup: 2, groupCount: 2 })} />)

    expect(screen.getByText('ongoing.rules.tiebreakTeams')).toBeInTheDocument()
    expect(screen.queryByText('ongoing.rules.tiebreakRotation')).not.toBeInTheDocument()
  })

  it('falls back to the round-robin steps for an unknown scheme rather than rendering nothing', () => {
    render(<OngoingRulesTab event={buildEvent({ scheme: 'somethingNew' })} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('reports no qualifiers as zero rather than NaN when the scheme has none', () => {
    render(<OngoingRulesTab event={buildEvent({ scheme: 'roundRobin', qualifiersPerGroup: null })} />)

    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })
})

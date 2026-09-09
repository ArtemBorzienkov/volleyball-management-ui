import { describe, expect, it } from 'vitest'
import { teamName } from './ongoing-standings'
import type { OngoingTeam } from './types'

const team = (p1: { name: string; isAnonymous?: boolean }, p2: { name: string; isAnonymous?: boolean }) =>
  ({
    id: 't1',
    player1: { id: 'p1', ...p1 },
    player2: { id: 'p2', ...p2 },
    rating: 2000,
    groupIndex: null,
  }) as OngoingTeam

describe('teamName', () => {
  it('names both players when neither opted out', () => {
    expect(teamName(team({ name: 'Artem Borzienkov' }, { name: 'Open Player' }))).toBe(
      'Artem Borzienkov & Open Player',
    )
  })

  it('masks only the player who opted out', () => {
    expect(teamName(team({ name: 'Artem Borzienkov', isAnonymous: true }, { name: 'Open Player' }))).toBe(
      'Ar*** Bo*** & Open Player',
    )
  })

  it('masks both when both opted out', () => {
    expect(
      teamName(team({ name: 'Artem Borzienkov', isAnonymous: true }, { name: 'Open Player', isAnonymous: true })),
    ).toBe('Ar*** Bo*** & Op*** Pl***')
  })

  it('never leaks a masked player’s full name into the team label', () => {
    const label = teamName(team({ name: 'Artem Borzienkov', isAnonymous: true }, { name: 'Open Player' }))

    expect(label).not.toContain('Borzienkov')
  })
})

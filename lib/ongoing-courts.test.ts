import { describe, expect, it } from 'vitest'
import {
  courtLabel,
  courtListProblem,
  fromCourtDrafts,
  hasRecordedResult,
  isStructuralCourtChange,
  newCourtDraft,
  teamsWithDoubleRest,
  toCourtDrafts,
} from './ongoing-courts'
import type { OngoingGame } from './types'

const court = (label: string, fromRound = 1, toRound: number | null = null) => ({ label, fromRound, toRound })
const draft = (label: string, fromRound = '1', toRound = '') => ({ label, fromRound, toRound })

describe('court drafts', () => {
  it('round-trips a court list, blank "to" meaning the end', () => {
    const courts = [court('5'), court('9', 2, 4)]

    expect(toCourtDrafts(courts)).toEqual([draft('5'), draft('9', '2', '4')])
    expect(fromCourtDrafts(toCourtDrafts(courts))).toEqual(courts)
  })

  it('falls back to the position for a blank label, and to round 1 for a blank "from"', () => {
    expect(fromCourtDrafts([draft('  ', ''), draft('B')])).toEqual([court('1'), court('B')])
  })

  it('names a new court with the next number nobody uses', () => {
    expect(newCourtDraft([draft('1'), draft('2')])).toEqual(draft('3'))
    expect(newCourtDraft([draft('1'), draft('3')])).toEqual(draft('4'))
    expect(newCourtDraft([draft('5'), draft('7')])).toEqual(draft('3'))
  })
})

describe('courtListProblem', () => {
  it('accepts a valid list', () => {
    expect(courtListProblem([draft('5'), draft('7'), draft('9', '1', '4')])).toBeNull()
  })

  it.each([
    ['no courts', [], 'ongoing.courts.errorEmpty'],
    ['a long name', [draft('Centre Court')], 'ongoing.courts.errorLabelLength'],
    ['a repeated name, whatever the case', [draft('A'), draft('a')], 'ongoing.courts.errorDuplicate'],
    ['a blank name clashing with a number', [draft('2'), draft('')], 'ongoing.courts.errorDuplicate'],
    ['"from" below 1', [draft('A', '0')], 'ongoing.courts.errorFrom'],
    ['a fractional "from"', [draft('A', '1.5')], 'ongoing.courts.errorFrom'],
    ['"to" before "from"', [draft('A', '5', '4')], 'ongoing.courts.errorTo'],
  ])('flags %s', (_case, drafts, key) => {
    expect(courtListProblem(drafts)?.key).toBe(key)
  })

  it('flags more than 20 courts', () => {
    const many = Array.from({ length: 21 }, (_, index) => draft(String(index + 1)))

    expect(courtListProblem(many)?.key).toBe('ongoing.courts.errorTooMany')
  })

  it('names the court at fault by position', () => {
    expect(courtListProblem([draft('A'), draft('B', '3', '1')])).toEqual({
      key: 'ongoing.courts.errorTo',
      values: { position: 2 },
    })
  })
})

// Must agree with the API, which rebuilds the schedule for exactly these and refuses them after a result.
describe('isStructuralCourtChange', () => {
  const before = [court('5'), court('7'), court('9', 1, 4)]

  it('is false for a rename', () => {
    expect(isStructuralCourtChange(before, [court('5'), court('8'), court('9', 1, 4)])).toBe(false)
  })

  it('is true for adding, removing, re-ranging or moving a court', () => {
    expect(isStructuralCourtChange(before, [...before, court('11')])).toBe(true)
    expect(isStructuralCourtChange(before, before.slice(1))).toBe(true)
    expect(isStructuralCourtChange(before, [court('5'), court('7'), court('9', 1, 5)])).toBe(true)
    expect(isStructuralCourtChange([court('5'), court('7')], [court('7'), court('5')])).toBe(true)
  })
})

describe('courtLabel', () => {
  const courts = [court('5'), court('7')]

  it('names a scheduled fixture by the court at its position', () => {
    expect(courtLabel({ phase: 'group', court: 2 }, courts)).toBe('7')
  })

  it('falls back to the number when the position has no court', () => {
    expect(courtLabel({ phase: 'group', court: 3 }, courts)).toBe('3')
  })

  // Rotation fixtures carry a notional number of their own, not a position in this list.
  it('leaves rotation and playoff fixtures on their own numbers', () => {
    expect(courtLabel({ phase: 'rotation', court: 1 }, courts)).toBe('1')
    expect(courtLabel({ phase: 'playoff', court: 0 }, courts)).toBe('0')
  })
})

const game = (id: string, round: number, team1Id: string, team2Id: string, points?: [number, number]) =>
  ({
    id,
    round,
    team1Id,
    team2Id,
    phase: 'group',
    court: 1,
    team1Points: points ? points[0] : null,
    team2Points: points ? points[1] : null,
  }) as OngoingGame

describe('teamsWithDoubleRest', () => {
  it('finds a team idle for two rounds between its games', () => {
    const games = [game('g1', 1, 'a', 'b'), game('g2', 2, 'c', 'd'), game('g3', 3, 'c', 'b'), game('g4', 4, 'a', 'c')]

    expect(teamsWithDoubleRest(games)).toEqual(['a'])
  })

  it('counts idling before a team’s first game', () => {
    const games = [game('g1', 1, 'a', 'b'), game('g2', 2, 'a', 'b'), game('g3', 3, 'c', 'a')]

    expect(teamsWithDoubleRest(games)).toEqual(['c'])
  })

  // A finished team is done, not waiting.
  it('does not count idling after a team’s last game', () => {
    const games = [game('g1', 1, 'a', 'b'), game('g2', 2, 'c', 'd'), game('g3', 3, 'c', 'd'), game('g4', 4, 'c', 'd')]

    expect(teamsWithDoubleRest(games)).toEqual([])
  })

  it('treats a round number with no fixtures as a break, not a rest', () => {
    const games = [game('g1', 1, 'a', 'b'), game('g2', 4, 'a', 'b')]

    expect(teamsWithDoubleRest(games)).toEqual([])
  })

  it('ignores playoff games', () => {
    const games = [game('g1', 1, 'a', 'b'), { ...game('p1', 5, 'a', 'c'), phase: 'playoff' } as OngoingGame]

    expect(teamsWithDoubleRest(games)).toEqual([])
  })
})

describe('hasRecordedResult', () => {
  it('is true once any fixture has a score', () => {
    expect(hasRecordedResult({ games: [game('g1', 1, 'a', 'b')] })).toBe(false)
    expect(hasRecordedResult({ games: [game('g1', 1, 'a', 'b'), game('g2', 2, 'a', 'c', [21, 15])] })).toBe(true)
  })
})

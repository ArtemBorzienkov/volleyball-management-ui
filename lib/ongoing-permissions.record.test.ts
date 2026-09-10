import { describe, expect, it } from 'vitest'
import { canRecordOngoingResult, ongoingEntrantPlayerIds } from './ongoing-permissions'

const team = (a: string, b: string) => ({ player1: { id: a }, player2: { id: b } })
const solo = (id: string) => ({ player: { id } })
const rotation = (ids: string[][]) => ({
  rounds: [{ groups: ids.map((group) => ({ standings: group.map((id) => ({ player: { id } })) })) }],
})

const event = (over: Partial<Parameters<typeof canRecordOngoingResult>[1]> = {}) => ({
  createdByUserId: 'organiser',
  teams: [],
  soloPlayers: [],
  rotation: null,
  ...over,
})

const player = (id: string, playerId: string | null, role = 'player') => ({ id, role, playerId })

describe('ongoingEntrantPlayerIds', () => {
  it('collects both halves of every pair', () => {
    const ids = ongoingEntrantPlayerIds(event({ teams: [team('a', 'b'), team('c', 'd')] }))

    expect([...ids].sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('collects the solo pool', () => {
    expect([...ongoingEntrantPlayerIds(event({ soloPlayers: [solo('x'), solo('y')] }))].sort()).toEqual(['x', 'y'])
  })

  it('collects every rotation group of every round', () => {
    const ids = ongoingEntrantPlayerIds(event({ rotation: rotation([['a', 'b'], ['c', 'd']]) }))

    expect([...ids].sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('de-duplicates a player who appears in more than one place', () => {
    const ids = ongoingEntrantPlayerIds(event({ soloPlayers: [solo('a')], rotation: rotation([['a', 'b']]) }))

    expect([...ids].sort()).toEqual(['a', 'b'])
  })

  it('is empty for a tournament nobody has entered', () => {
    expect(ongoingEntrantPlayerIds(event()).size).toBe(0)
  })
})

describe('canRecordOngoingResult', () => {
  it('refuses a logged-out visitor', () => {
    expect(canRecordOngoingResult(null, event({ teams: [team('a', 'b')] }))).toBe(false)
  })

  it('allows the organiser, who need not have entered', () => {
    expect(canRecordOngoingResult(player('organiser', null), event())).toBe(true)
  })

  it('allows an admin who entered nothing', () => {
    expect(canRecordOngoingResult(player('someone', null, 'admin'), event())).toBe(true)
  })

  it('allows a player on a team', () => {
    expect(canRecordOngoingResult(player('u1', 'a'), event({ teams: [team('a', 'b')] }))).toBe(true)
    expect(canRecordOngoingResult(player('u1', 'b'), event({ teams: [team('a', 'b')] }))).toBe(true)
  })

  it('allows a player in the solo pool', () => {
    expect(canRecordOngoingResult(player('u1', 'x'), event({ soloPlayers: [solo('x')] }))).toBe(true)
  })

  it('allows a player in a rotation group', () => {
    expect(canRecordOngoingResult(player('u1', 'c'), event({ rotation: rotation([['c', 'd']]) }))).toBe(true)
  })

  it('refuses a logged-in stranger', () => {
    expect(canRecordOngoingResult(player('u9', 'zz'), event({ teams: [team('a', 'b')] }))).toBe(false)
  })

  it('refuses an account with no linked player', () => {
    expect(canRecordOngoingResult(player('u9', null), event({ teams: [team('a', 'b')] }))).toBe(false)
  })

  it('tolerates a payload with no rotation block', () => {
    expect(canRecordOngoingResult(player('u1', 'a'), event({ teams: [team('a', 'b')], rotation: null }))).toBe(true)
  })
})

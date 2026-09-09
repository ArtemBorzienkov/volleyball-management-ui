import { describe, expect, it } from 'vitest'
import { isOngoingEventFull } from './ongoing-permissions'

const pairsEvent = (over: Partial<Parameters<typeof isOngoingEventFull>[0]> = {}) => ({
  maxTeams: 8,
  teamsCount: 0,
  soloPlayers: [],
  ...over,
})

describe('isOngoingEventFull — pairs-based schemes', () => {
  it('is never full without a cap', () => {
    expect(isOngoingEventFull(pairsEvent({ maxTeams: null, teamsCount: 99 }))).toBe(false)
  })

  it('counts two partnerless entrants as the one team they will become', () => {
    expect(isOngoingEventFull(pairsEvent({ maxTeams: 2, teamsCount: 1, soloPlayers: [1, 2] }))).toBe(true)
  })

  it('counts an odd partnerless entrant as holding a slot of its own', () => {
    expect(isOngoingEventFull(pairsEvent({ maxTeams: 2, teamsCount: 1, soloPlayers: [1] }))).toBe(true)
  })

  it('leaves room while below the cap', () => {
    expect(isOngoingEventFull(pairsEvent({ maxTeams: 4, teamsCount: 2, soloPlayers: [1] }))).toBe(false)
  })
})

describe('isOngoingEventFull — fullRotation', () => {
  const rotation = (players: number, groupCount: number) => ({
    maxTeams: null,
    teamsCount: 0,
    soloPlayers: Array.from({ length: players }, (_, index) => index),
    scheme: 'fullRotation',
    groupCount,
  })

  it('fills at four players per group', () => {
    expect(isOngoingEventFull(rotation(7, 2))).toBe(false)
    expect(isOngoingEventFull(rotation(8, 2))).toBe(true)
    expect(isOngoingEventFull(rotation(11, 3))).toBe(false)
    expect(isOngoingEventFull(rotation(12, 3))).toBe(true)
  })

  it('ignores maxTeams, which counts pairs and would never trip here', () => {
    // A null cap would make any other scheme unfillable; the seats still apply.
    expect(isOngoingEventFull({ ...rotation(8, 2), maxTeams: null })).toBe(true)
    // And a generous cap must not make a full roster look open.
    expect(isOngoingEventFull({ ...rotation(8, 2), maxTeams: 99 })).toBe(true)
  })

  it('treats a rotation event with no group count as already full rather than unbounded', () => {
    // Defensive: a payload without groupCount must not advertise infinite room.
    expect(isOngoingEventFull({ maxTeams: null, teamsCount: 0, soloPlayers: [1], scheme: 'fullRotation' })).toBe(true)
  })

  it('does not apply the seat rule to another scheme', () => {
    expect(
      isOngoingEventFull({ maxTeams: null, teamsCount: 0, soloPlayers: [1, 2, 3, 4, 5, 6, 7, 8], scheme: 'roundRobin', groupCount: 2 }),
    ).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { toOpenEventShape } from './ongoing-open-event'
import type { OngoingEvent, OngoingGame } from './types'

const game = (points: [number, number] | null): OngoingGame =>
  ({
    id: 'g1',
    eventId: 'e1',
    team1Id: 't1',
    team2Id: 't2',
    team1Points: points ? points[0] : null,
    team2Points: points ? points[1] : null,
    round: 1,
    court: 1,
    order: 0,
    phase: 'group',
    groupIndex: null,
    bracketRound: null,
    bracketSlot: null,
    thirdPlace: false,
    side1Players: [],
    side2Players: [],
  }) as OngoingGame

const team = (id: string) =>
  ({ id, player1: { id: `${id}a`, name: 'A' }, player2: { id: `${id}b`, name: 'B' }, rating: 2000, groupIndex: null })

const buildEvent = (over: Partial<OngoingEvent> = {}): OngoingEvent =>
  ({
    id: 'e1',
    name: 'Cup',
    // Far future, so the registration deadline has not passed.
    date: '2030-06-01T00:00:00.000Z',
    startTime: '10:00',
    location: 'WBSA',
    finishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdByUserId: 'u1',
    config: {
      gamesPerPair: 1,
      courts: 1,
      maxTeams: 8,
      scheme: 'roundRobin',
      groupCount: 1,
      qualifiersPerGroup: null,
      rotationRounds: 3,
      visibility: 'private',
      allowSoloRegistration: true,
    },
    teams: [team('t1'), team('t2')],
    soloPlayers: [],
    games: [],
    rotation: null,
    ...over,
  }) as OngoingEvent

describe('toOpenEventShape', () => {
  it('lifts the config fields the registration controls read', () => {
    const open = toOpenEventShape(buildEvent())

    expect(open).toMatchObject({
      maxTeams: 8,
      scheme: 'roundRobin',
      groupCount: 1,
      visibility: 'private',
      allowSoloRegistration: true,
    })
  })

  it('carries the identity and roster through unchanged', () => {
    const event = buildEvent()
    const open = toOpenEventShape(event)

    expect(open).toMatchObject({ id: 'e1', name: 'Cup', createdByUserId: 'u1', date: event.date })
    expect(open.teams).toBe(event.teams)
    expect(open.soloPlayers).toBe(event.soloPlayers)
  })

  it('counts the teams, the way the list endpoint does', () => {
    expect(toOpenEventShape(buildEvent()).teamsCount).toBe(2)
    expect(toOpenEventShape(buildEvent({ teams: [] })).teamsCount).toBe(0)
  })

  it('reports a tournament as started once any game has a result', () => {
    expect(toOpenEventShape(buildEvent({ games: [] })).hasStarted).toBe(false)
    expect(toOpenEventShape(buildEvent({ games: [game(null)] })).hasStarted).toBe(false)
    expect(toOpenEventShape(buildEvent({ games: [game([21, 15])] })).hasStarted).toBe(true)
  })

  it('needs both scores before calling a game played', () => {
    const half = { ...game(null), team1Points: 21 } as OngoingGame

    expect(toOpenEventShape(buildEvent({ games: [half] })).hasStarted).toBe(false)
  })

  it('closes registration once the tournament date has arrived', () => {
    expect(toOpenEventShape(buildEvent()).registrationOpen).toBe(true)
    expect(toOpenEventShape(buildEvent({ date: '2020-01-01T00:00:00.000Z' })).registrationOpen).toBe(false)
  })

  it('reports no organiser: nothing on this payload names them, and the controls do not use it', () => {
    expect(toOpenEventShape(buildEvent()).createdBy).toBeNull()
  })
})

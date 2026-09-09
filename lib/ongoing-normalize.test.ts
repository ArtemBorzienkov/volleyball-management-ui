import { describe, expect, it } from 'vitest'
import {
  normalizeOngoingEvent,
  normalizeOngoingOpenEvent,
  type OlderOngoingEvent,
  type OlderOngoingOpenEvent,
} from './ongoing-normalize'

// Every normalizer here exists for one reason: `.env` ships pointing at a remote API, so the backend
// answering may predate these fields. A missing array must not reach a component that maps over it.
describe('normalizeOngoingEvent', () => {
  const older = (over: Record<string, unknown> = {}) =>
    ({
      id: 'e1',
      name: 'Cup',
      date: '2026-09-20T00:00:00.000Z',
      startTime: null,
      location: null,
      finishedAt: null,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      createdByUserId: null,
      config: { gamesPerPair: 1, courts: 1, maxTeams: null, scheme: 'roundRobin', groupCount: 1, qualifiersPerGroup: null },
      teams: [],
      games: [],
      ...over,
    }) as unknown as OlderOngoingEvent

  it('defaults the rotation round count rather than leaving it undefined', () => {
    expect(normalizeOngoingEvent(older()).config.rotationRounds).toBe(3)
  })

  it('keeps a round count the API did send', () => {
    const raw = older() as OlderOngoingEvent & { config: { rotationRounds?: number } }
    raw.config.rotationRounds = 5
    expect(normalizeOngoingEvent(raw).config.rotationRounds).toBe(5)
  })

  it('reports no rotation ladder when the API sends none', () => {
    expect(normalizeOngoingEvent(older()).rotation).toBeNull()
  })

  it('passes a rotation ladder through untouched', () => {
    const rotation = { totalRounds: 3, currentRound: 1, isFinished: false, rounds: [], finalStandings: [] }
    expect(normalizeOngoingEvent(older({ rotation })).rotation).toEqual(rotation)
  })

  it('gives every game empty sides, so the rotation tab can always map over them', () => {
    const raw = older({
      games: [{ id: 'g1', eventId: 'e1', team1Id: 't1', team2Id: 't2', team1Points: null, team2Points: null, round: 1, court: 1, order: 0, phase: 'group', bracketRound: null, bracketSlot: null, thirdPlace: false }],
    })

    const [game] = normalizeOngoingEvent(raw).games

    expect(game.side1Players).toEqual([])
    expect(game.side2Players).toEqual([])
    expect(game.groupIndex).toBeNull()
  })

  it('keeps sides the API did send', () => {
    const raw = older({
      games: [{ id: 'g1', eventId: 'e1', team1Id: null, team2Id: null, team1Points: 21, team2Points: 15, round: 1, court: 1, order: 0, phase: 'rotation', groupIndex: 0, bracketRound: null, bracketSlot: null, thirdPlace: false, side1Players: [{ id: 'p1', name: 'A' }], side2Players: [{ id: 'p2', name: 'B' }] }],
    })

    const [game] = normalizeOngoingEvent(raw).games

    expect(game.side1Players).toHaveLength(1)
    expect(game.groupIndex).toBe(0)
  })

  it('survives a payload with no games array at all', () => {
    const withoutGames = older()
    Reflect.deleteProperty(withoutGames, 'games')

    expect(normalizeOngoingEvent(withoutGames).games).toEqual([])
  })

  it('still fills the solo pool and visibility defaults it was written for', () => {
    const event = normalizeOngoingEvent(older())

    expect(event.soloPlayers).toEqual([])
    expect(event.config.visibility).toBe('public')
    expect(event.config.allowSoloRegistration).toBe(false)
  })
})

describe('normalizeOngoingOpenEvent', () => {
  const older = (over: Record<string, unknown> = {}) =>
    ({
      id: 'e1',
      name: 'Cup',
      date: '2026-09-20T00:00:00.000Z',
      startTime: null,
      location: null,
      maxTeams: null,
      teamsCount: 0,
      teams: [],
      ...over,
    }) as unknown as OlderOngoingOpenEvent

  it('defaults the scheme so the calendar picks the pairs-based capacity rule', () => {
    const event = normalizeOngoingOpenEvent(older())

    expect(event.scheme).toBe('roundRobin')
    expect(event.groupCount).toBe(1)
  })

  it('keeps a rotation scheme and its group count', () => {
    const event = normalizeOngoingOpenEvent(older({ scheme: 'fullRotation', groupCount: 3 }))

    expect(event.scheme).toBe('fullRotation')
    expect(event.groupCount).toBe(3)
  })

  it('fills the fields the solo pool and privacy work added', () => {
    const event = normalizeOngoingOpenEvent(older())

    expect(event.visibility).toBe('public')
    expect(event.allowSoloRegistration).toBe(false)
    expect(event.soloPlayers).toEqual([])
    expect(event.createdBy).toBeNull()
  })
})

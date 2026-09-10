import { describe, expect, it } from 'vitest'
import { buildFinishTournamentPrefill, getFinishTournamentGate } from './ongoing-finish'
import type { OngoingEvent } from './types'

/**
 * The bug these cover: a fullRotation tournament has no `OngoingTeam` rows, so the team-based
 * hand-off silently produced a prefill with zero games and zero places — an empty /add-results form.
 */

const p = (id: string) => ({ id, name: id.toUpperCase() })

const rotationGame = (round: number, groupIndex: number, order: number, s1: string[], s2: string[], pts: [number, number] | null) => ({
  id: `g-${round}-${groupIndex}-${order}`,
  eventId: 'e1',
  team1Id: null,
  team2Id: null,
  team1Points: pts ? pts[0] : null,
  team2Points: pts ? pts[1] : null,
  round,
  court: order + 1,
  order,
  phase: 'rotation',
  groupIndex,
  bracketRound: null,
  bracketSlot: null,
  thirdPlace: false,
  side1Players: s1.map(p),
  side2Players: s2.map(p),
})

const standing = (id: string, place: number) => ({
  place,
  player: p(id),
  rating: 1000,
  played: 3,
  wins: 2,
  losses: 1,
  pointsFor: 50,
  pointsAgainst: 45,
  pointsDiff: 5,
})

const rotationEvent = (over: Partial<OngoingEvent> = {}): OngoingEvent =>
  ({
    id: 'e1',
    name: 'Rotation Cup',
    date: '2026-09-10T00:00:00.000Z',
    startTime: null,
    location: 'WBSA',
    finishedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    createdByUserId: 'u1',
    config: {
      gamesPerPair: 1,
      courts: 1,
      maxTeams: null,
      scheme: 'fullRotation',
      groupCount: 2,
      qualifiersPerGroup: null,
      rotationRounds: 1,
      visibility: 'public',
      allowSoloRegistration: true,
    },
    teams: [],
    soloPlayers: [],
    games: [
      rotationGame(1, 0, 0, ['a1', 'a2'], ['a3', 'a4'], [21, 15]),
      rotationGame(1, 0, 1, ['a1', 'a3'], ['a2', 'a4'], [21, 16]),
      rotationGame(1, 0, 2, ['a1', 'a4'], ['a2', 'a3'], [21, 17]),
      rotationGame(1, 1, 3, ['b1', 'b2'], ['b3', 'b4'], [21, 18]),
    ],
    rotation: {
      totalRounds: 1,
      currentRound: 1,
      isFinished: true,
      rounds: [
        {
          round: 1,
          isComplete: true,
          groups: [
            { groupIndex: 0, standings: [standing('a1', 1), standing('a2', 2), standing('a3', 3), standing('a4', 4)] },
            { groupIndex: 1, standings: [standing('b1', 1), standing('b2', 2), standing('b3', 3), standing('b4', 4)] },
          ],
        },
      ],
      finalStandings: [
        standing('a1', 1), standing('a2', 2), standing('a3', 3), standing('a4', 4),
        standing('b1', 5), standing('b2', 6), standing('b3', 7), standing('b4', 8),
      ],
    },
    ...over,
  }) as OngoingEvent

const teamEvent = (): OngoingEvent =>
  ({
    ...rotationEvent(),
    config: { ...rotationEvent().config, scheme: 'roundRobin', groupCount: 1 },
    teams: [
      { id: 't1', player1: p('x1'), player2: p('x2'), rating: 2000, groupIndex: null },
      { id: 't2', player1: p('y1'), player2: p('y2'), rating: 1900, groupIndex: null },
    ],
    games: [
      {
        ...rotationGame(1, 0, 0, [], [], [21, 15]),
        team1Id: 't1',
        team2Id: 't2',
        phase: 'group',
        groupIndex: null,
        side1Players: [],
        side2Players: [],
      },
    ],
    rotation: null,
  }) as OngoingEvent

describe('buildFinishTournamentPrefill — fullRotation', () => {
  const prefill = buildFinishTournamentPrefill(rotationEvent())

  it('carries every played fixture, taking the four players from the sides', () => {
    expect(prefill.games).toHaveLength(4)
    expect(prefill.games[0]).toEqual({
      team1Player1: 'a1',
      team1Player2: 'a2',
      team2Player1: 'a3',
      team2Player2: 'a4',
      team1Points: 21,
      team2Points: 15,
    })
  })

  it('does not arrive empty — the whole point of the fix', () => {
    expect(prefill.games.length).toBeGreaterThan(0)
    expect(prefill.places.length).toBeGreaterThan(0)
  })

  it('places every player individually, strongest group first', () => {
    expect(prefill.places).toEqual([
      { place: '1', playerId: 'a1' },
      { place: '2', playerId: 'a2' },
      { place: '3', playerId: 'a3' },
      { place: '4', playerId: 'a4' },
      { place: '5', playerId: 'b1' },
      { place: '6', playerId: 'b2' },
      { place: '7', playerId: 'b3' },
      { place: '8', playerId: 'b4' },
    ])
  })

  it('gives one place per player, never a shared team place', () => {
    const places = prefill.places.map((row) => row.place)

    expect(new Set(places).size).toBe(places.length)
  })

  it('keeps the event name, date and location', () => {
    expect(prefill.eventName).toBe('Rotation Cup')
    expect(prefill.eventDate).toBe('2026-09-10')
    expect(prefill.eventLocation).toBe('WBSA')
  })

  it('skips a fixture with no result yet', () => {
    const event = rotationEvent()
    event.games.push(rotationGame(1, 1, 4, ['b1', 'b3'], ['b2', 'b4'], null))

    expect(buildFinishTournamentPrefill(event).games).toHaveLength(4)
  })

  it('skips a malformed side rather than emitting an incomplete row', () => {
    const event = rotationEvent()
    event.games = [rotationGame(1, 0, 0, ['a1'], ['a3', 'a4'], [21, 15])]

    expect(buildFinishTournamentPrefill(event).games).toEqual([])
  })

  it('falls back to the newest round when the ladder has no final standings yet', () => {
    const event = rotationEvent()
    event.rotation!.finalStandings = []

    const places = buildFinishTournamentPrefill(event).places

    expect(places.map((row) => row.playerId)).toEqual(['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4'])
  })
})

describe('buildFinishTournamentPrefill — team-based schemes are unchanged', () => {
  it('still reads players from the team rows', () => {
    const prefill = buildFinishTournamentPrefill(teamEvent())

    expect(prefill.games).toEqual([
      { team1Player1: 'x1', team1Player2: 'x2', team2Player1: 'y1', team2Player2: 'y2', team1Points: 21, team2Points: 15 },
    ])
  })

  it('still shares a place between both members of a team', () => {
    const places = buildFinishTournamentPrefill(teamEvent()).places
    const first = places.filter((row) => row.place === '1').map((row) => row.playerId)

    expect(first).toEqual(['x1', 'x2'])
  })
})

describe('getFinishTournamentGate — fullRotation', () => {
  it('allows finishing once the last round is complete', () => {
    expect(getFinishTournamentGate(rotationEvent())).toEqual({ canFinish: true })
  })

  it('refuses while rounds remain, even though every generated game is played', () => {
    const event = rotationEvent()
    event.config.rotationRounds = 3
    event.rotation!.totalRounds = 3
    event.rotation!.isFinished = false

    expect(getFinishTournamentGate(event)).toEqual({
      canFinish: false,
      reasonKey: 'ongoing.finish.rotationNotFinished',
    })
  })

  it('still refuses when a fixture has no result', () => {
    const event = rotationEvent()
    event.games.push(rotationGame(1, 1, 4, ['b1', 'b3'], ['b2', 'b4'], null))

    expect(getFinishTournamentGate(event)).toEqual({
      canFinish: false,
      reasonKey: 'ongoing.finish.gamesNotPlayed',
    })
  })

  it('still refuses when no fixtures exist at all', () => {
    const event = rotationEvent()
    event.games = []

    expect(getFinishTournamentGate(event)).toEqual({
      canFinish: false,
      reasonKey: 'ongoing.finish.noGames',
    })
  })

  it('leaves the team-based gate alone', () => {
    expect(getFinishTournamentGate(teamEvent())).toEqual({ canFinish: true })
  })
})

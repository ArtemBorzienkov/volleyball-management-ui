import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canCancelOngoingEntry,
  isOngoingCancellationOpen,
  isOngoingEventFull,
  isSoloOnlyOngoingEvent,
  ongoingEventStartInstant,
} from './ongoing-permissions'

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

describe('ongoingEventStartInstant', () => {
  it('reads the start time as a wall clock on the stored UTC day', () => {
    const start = ongoingEventStartInstant('2026-09-16T00:00:00.000Z', '08:00')

    expect(new Date(start!).toISOString()).toBe('2026-09-16T08:00:00.000Z')
  })

  it('falls back to midnight without a start time, or with an unreadable one', () => {
    for (const startTime of [null, undefined, '', 'noon', '25:00', '08:60']) {
      const start = ongoingEventStartInstant('2026-09-16T00:00:00.000Z', startTime)
      expect(new Date(start!).toISOString()).toBe('2026-09-16T00:00:00.000Z')
    }
  })

  it('returns null for an unreadable date', () => {
    expect(ongoingEventStartInstant('not-a-date', '08:00')).toBeNull()
  })
})

describe('isOngoingCancellationOpen — the 24-hour window', () => {
  afterEach(() => vi.useRealTimers())

  const at = (now: string) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(now))
  }

  it('is closed exactly 24 hours before an 08:00 start', () => {
    at('2026-09-15T08:00:00.000Z')

    expect(isOngoingCancellationOpen('2026-09-16T00:00:00.000Z', '08:00')).toBe(false)
  })

  it('is open one second earlier', () => {
    at('2026-09-15T07:59:59.000Z')

    expect(isOngoingCancellationOpen('2026-09-16T00:00:00.000Z', '08:00')).toBe(true)
  })

  // The whole reason startTime is read: the old rule allowed the entire day before.
  it('is closed at midday the day before an 08:00 start', () => {
    at('2026-09-15T12:00:00.000Z')

    expect(isOngoingCancellationOpen('2026-09-16T00:00:00.000Z', '08:00')).toBe(false)
    expect(isOngoingCancellationOpen('2026-09-17T00:00:00.000Z', '08:00')).toBe(true)
  })

  it('measures from midnight when no start time is set', () => {
    at('2026-09-14T23:00:00.000Z')

    expect(isOngoingCancellationOpen('2026-09-16T00:00:00.000Z', null)).toBe(true)
    expect(isOngoingCancellationOpen('2026-09-15T00:00:00.000Z', null)).toBe(false)
  })

  it('is closed for an unreadable date rather than open by accident', () => {
    expect(isOngoingCancellationOpen('not-a-date', '08:00')).toBe(false)
  })
})

describe('canCancelOngoingEntry', () => {
  afterEach(() => vi.useRealTimers())

  const EVENT = {
    createdByUserId: 'organiser',
    date: '2026-09-16T00:00:00.000Z',
    startTime: '08:00',
    visibility: 'public',
    allowSoloRegistration: true,
  }
  const ENTRANT = { id: 'u1', role: 'player', playerId: 'p1' }

  it('lets an entrant withdraw while more than 24 hours remain', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T06:00:00.000Z'))

    expect(canCancelOngoingEntry(ENTRANT, EVENT, ['p1'])).toBe(true)
  })

  it('refuses an entrant inside the window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'))

    expect(canCancelOngoingEntry(ENTRANT, EVENT, ['p1'])).toBe(false)
  })

  // The organiser is fixing a roster, not withdrawing — the deadline is not theirs.
  it('still lets the organiser remove an entry inside the window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-16T07:00:00.000Z'))

    expect(canCancelOngoingEntry({ id: 'organiser', role: 'player' }, EVENT, ['p1'])).toBe(true)
  })

  it('refuses someone who is not in the entry at all', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T00:00:00.000Z'))

    expect(canCancelOngoingEntry(ENTRANT, EVENT, ['p9'])).toBe(false)
  })
})

describe('isSoloOnlyOngoingEvent', () => {
  it('is true for fullRotation, which has no pair entry path at all', () => {
    expect(isSoloOnlyOngoingEvent({ scheme: 'fullRotation' })).toBe(true)
  })

  it('is true for any scheme the organiser configured that way', () => {
    expect(isSoloOnlyOngoingEvent({ scheme: 'roundRobin', soloOnlyRegistration: true })).toBe(true)
  })

  it('is false for an ordinary tournament, and for a payload predating the flag', () => {
    expect(isSoloOnlyOngoingEvent({ scheme: 'roundRobin', soloOnlyRegistration: false })).toBe(false)
    expect(isSoloOnlyOngoingEvent({ scheme: 'groupsPlayoff' })).toBe(false)
  })
})

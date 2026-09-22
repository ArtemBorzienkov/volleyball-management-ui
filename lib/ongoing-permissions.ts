// Four players per group is what makes the three-fixture rotation work; mirrored from the API.
export const ROTATION_GROUP_SIZE = 4

export function canManageOngoingEvent(
  user: { id: string; role: string } | null,
  createdByUserId: string | null,
): boolean {
  if (!user) return false
  return user.role === 'admin' || user.id === createdByUserId
}

/** Everyone entered in a tournament: on a pair, waiting in the pool, or in a rotation group. */
export function ongoingEntrantPlayerIds(event: {
  teams: Array<{ player1: { id: string }; player2: { id: string } }>
  soloPlayers: Array<{ player: { id: string } }>
  rotation?: { rounds: Array<{ groups: Array<{ standings: Array<{ player: { id: string } }> }> }> } | null
}): Set<string> {
  return new Set<string>([
    ...event.teams.flatMap((team) => [team.player1.id, team.player2.id]),
    ...event.soloPlayers.map((solo) => solo.player.id),
    ...(event.rotation?.rounds ?? []).flatMap((round) =>
      round.groups.flatMap((group) => group.standings.map((row) => row.player.id)),
    ),
  ])
}

/**
 * Recording a result is open to the tournament's own entrants as well as its organiser — mirrors the
 * API's assertCanRecordResult. Deliberately per-event, not per-game: at a real event whoever is free
 * enters the score, and a rotation player changes partner every fixture.
 */
export function canRecordOngoingResult(
  user: { id: string; role: string; playerId?: string | null } | null,
  event: {
    createdByUserId: string | null
    teams: Array<{ player1: { id: string }; player2: { id: string } }>
    soloPlayers: Array<{ player: { id: string } }>
    rotation?: { rounds: Array<{ groups: Array<{ standings: Array<{ player: { id: string } }> }> }> } | null
  },
): boolean {
  if (!user) return false
  if (canManageOngoingEvent(user, event.createdByUserId)) return true
  if (!user.playerId) return false
  return ongoingEntrantPlayerIds(event).has(user.playerId)
}

interface OngoingAccessUser {
  id: string
  role: string
  playerId?: string | null
}

interface OngoingAccessEvent {
  createdByUserId: string | null
  date: string
  /** Venue-local wall clock, "HH:MM". Absent on an event whose organiser never set one. */
  startTime?: string | null
  visibility: string
  allowSoloRegistration: boolean
}

/** Withdrawing yourself closes this long before the first ball. Mirrors the API's constant. */
export const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * When the tournament starts, as an absolute instant — mirrors the API's eventStartInstant.
 *
 * `date` is a calendar day stored as UTC midnight and startTime is a wall clock with no zone of its
 * own, so the two are combined in UTC. That is the only reading both sides reach the same answer
 * from; it is off by the venue's UTC offset, which is hours, not days. Null for an unreadable date.
 */
export function ongoingEventStartInstant(dateIso: string, startTime?: string | null): number | null {
  const day = new Date(dateIso)
  if (Number.isNaN(day.getTime())) return null

  const match = /^(\d{1,2}):(\d{2})$/.exec((startTime ?? '').trim())
  const hours = match ? Number(match[1]) : 0
  const mins = match ? Number(match[2]) : 0
  const minutes = hours > 23 || mins > 59 ? 0 : hours * 60 + mins

  return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()) + minutes * 60_000
}

// Mirrors the backend's isCancellationOpen: withdrawing yourself closes 24 hours before the start.
export function isOngoingCancellationOpen(dateIso: string, startTime?: string | null): boolean {
  const start = ongoingEventStartInstant(dateIso, startTime)
  if (start === null) return false

  return Date.now() < start - CANCELLATION_WINDOW_MS
}

/**
 * Mirrors the backend's isRegistrationDateOpen: entries close at the end of the day OF the
 * tournament — deliberately not the cancellation rule, which is tighter. Registering late only adds
 * a player; withdrawing late leaves a hole in a schedule already built.
 */
export function isOngoingRegistrationDateOpen(dateIso: string): boolean {
  const eventDate = new Date(dateIso)
  if (Number.isNaN(eventDate.getTime())) return false
  const now = new Date()

  const eventDay = Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate())
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

  return eventDay >= today
}

export function canRegisterInOngoingEvent(user: OngoingAccessUser | null, event: OngoingAccessEvent): boolean {
  if (!user) return false
  if (canManageOngoingEvent(user, event.createdByUserId)) return true
  return event.visibility !== 'private'
}

export function canRegisterSoloInOngoingEvent(user: OngoingAccessUser | null, event: OngoingAccessEvent): boolean {
  return event.allowSoloRegistration && canRegisterInOngoingEvent(user, event)
}

/**
 * Pairs have no way in: everyone enters alone and the organiser builds the teams. fullRotation is
 * this by construction — the API forces the flag on — and any scheme can be configured that way.
 */
export function isSoloOnlyOngoingEvent(event: { scheme?: string; soloOnlyRegistration?: boolean }): boolean {
  return event.scheme === 'fullRotation' || event.soloOnlyRegistration === true
}

// The manager is deliberately not bound by the deadline — they may fix a roster right up to the first
// recorded result.
export function canCancelOngoingEntry(
  user: OngoingAccessUser | null,
  event: OngoingAccessEvent,
  entryPlayerIds: string[],
): boolean {
  if (!user) return false
  if (canManageOngoingEvent(user, event.createdByUserId)) return true
  if (!user.playerId || !entryPlayerIds.includes(user.playerId)) return false
  return isOngoingCancellationOpen(event.date, event.startTime)
}

// Mirrors the backend's effectiveTeamCount: two partnerless entrants will become one team, and an
// odd one still holds a slot of its own. /ongoing/open deliberately lists full tournaments, so the
// client is what decides to disable registration — the numbers below come straight from that payload.
export function isOngoingEventFull(event: {
  maxTeams: number | null
  teamsCount: number
  soloPlayers: unknown[]
  scheme?: string
  groupCount?: number
}): boolean {
  // fullRotation seats a fixed number of players — groups of four that have to fill exactly — and
  // ignores maxTeams, which counts pairs.
  if (event.scheme === 'fullRotation') {
    return event.soloPlayers.length >= (event.groupCount ?? 0) * ROTATION_GROUP_SIZE
  }
  if (event.maxTeams === null) return false
  return event.teamsCount + Math.ceil(event.soloPlayers.length / 2) >= event.maxTeams
}

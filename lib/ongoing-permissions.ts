// Four players per group is what makes the three-fixture rotation work; mirrored from the API.
export const ROTATION_GROUP_SIZE = 4

export function canManageOngoingEvent(
  user: { id: string; role: string } | null,
  createdByUserId: string | null,
): boolean {
  if (!user) return false
  return user.role === 'admin' || user.id === createdByUserId
}

interface OngoingAccessUser {
  id: string
  role: string
  playerId?: string | null
}

interface OngoingAccessEvent {
  createdByUserId: string | null
  date: string
  visibility: string
  allowSoloRegistration: boolean
}

// Mirrors the backend's isCancellationOpen: withdrawing yourself closes at the end of the day before
// the tournament. UTC calendar days on both sides, so a date-only value is read identically here and
// on the server regardless of the viewer's timezone.
export function isOngoingCancellationOpen(dateIso: string): boolean {
  const eventDate = new Date(dateIso)
  if (Number.isNaN(eventDate.getTime())) return false
  const now = new Date()

  const eventDay = Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate())
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

  return today < eventDay
}

export function canRegisterInOngoingEvent(user: OngoingAccessUser | null, event: OngoingAccessEvent): boolean {
  if (!user) return false
  if (canManageOngoingEvent(user, event.createdByUserId)) return true
  return event.visibility !== 'private'
}

export function canRegisterSoloInOngoingEvent(user: OngoingAccessUser | null, event: OngoingAccessEvent): boolean {
  return event.allowSoloRegistration && canRegisterInOngoingEvent(user, event)
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
  return isOngoingCancellationOpen(event.date)
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

import { isPlayed } from '@/lib/ongoing-standings'
import { isOngoingRegistrationDateOpen } from '@/lib/ongoing-permissions'
import type { OngoingEvent, OngoingOpenEvent } from '@/lib/types'

/**
 * Presents a loaded tournament in the shape `/ongoing/open` returns, so the calendar's registration
 * controls work on the tournament page too. Reusing them matters: between them they already handle
 * started, past-deadline, full, private and rotation-only tournaments, and a second implementation
 * would drift from those rules.
 *
 * The flags the list endpoint computes server-side are derived here from the same inputs:
 * `teamsCount` from the roster, `hasStarted` from the games, `registrationOpen` from the date.
 * `createdBy` has no source on this payload and neither control reads it — only the calendar card's
 * organiser line does.
 */
export function toOpenEventShape(event: OngoingEvent): OngoingOpenEvent {
  return {
    id: event.id,
    name: event.name,
    date: event.date,
    startTime: event.startTime,
    location: event.location,
    maxTeams: event.config.maxTeams,
    teamsCount: event.teams.length,
    createdByUserId: event.createdByUserId,
    createdBy: null,
    teams: event.teams,
    visibility: event.config.visibility,
    allowSoloRegistration: event.config.allowSoloRegistration,
    soloPlayers: event.soloPlayers,
    scheme: event.config.scheme,
    groupCount: event.config.groupCount,
    hasStarted: event.games.some(isPlayed),
    registrationOpen: isOngoingRegistrationDateOpen(event.date),
  }
}

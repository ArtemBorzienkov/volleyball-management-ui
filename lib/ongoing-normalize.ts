import type { OngoingEvent, OngoingEventListItem, OngoingOpenEvent } from '@/lib/types'

// The API is deployed separately from this app, so the backend answering right now may predate the
// solo-pool fields — and `.env` ships pointing at a remote host, so that skew is the normal state
// during a deploy, not an edge case. Filling the gaps here, at the fetch boundary, is what keeps
// every component below free of `?? []` and stops a missing array from throwing mid-render.
type Older<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type OlderOngoingEventListItem = Older<
  OngoingEventListItem,
  'teams' | 'soloPlayers' | 'createdBy' | 'visibility'
>
export type OlderOngoingOpenEvent = Older<
  OngoingOpenEvent,
  | 'soloPlayers'
  | 'visibility'
  | 'allowSoloRegistration'
  | 'createdByUserId'
  | 'createdBy'
  | 'scheme'
  | 'groupCount'
  | 'hasStarted'
  | 'registrationOpen'
>
export type OlderOngoingEvent = Omit<OngoingEvent, 'soloPlayers' | 'config' | 'games' | 'rotation'> &
  Partial<Pick<OngoingEvent, 'soloPlayers' | 'rotation'>> & {
    games: Array<Older<OngoingEvent['games'][number], 'groupIndex' | 'side1Players' | 'side2Players'>>
    config: Older<OngoingEvent['config'], 'visibility' | 'allowSoloRegistration' | 'rotationRounds'>
  }

export function normalizeOngoingListItem(raw: OlderOngoingEventListItem): OngoingEventListItem {
  return {
    ...raw,
    createdBy: raw.createdBy ?? null,
    visibility: raw.visibility ?? 'public',
    teams: raw.teams ?? [],
    soloPlayers: raw.soloPlayers ?? [],
  }
}

export function normalizeOngoingOpenEvent(raw: OlderOngoingOpenEvent): OngoingOpenEvent {
  return {
    ...raw,
    // An older backend has no notion of private tournaments, so its events are all public.
    visibility: raw.visibility ?? 'public',
    allowSoloRegistration: raw.allowSoloRegistration ?? false,
    createdByUserId: raw.createdByUserId ?? null,
    createdBy: raw.createdBy ?? null,
    soloPlayers: raw.soloPlayers ?? [],
    scheme: raw.scheme ?? 'roundRobin',
    groupCount: raw.groupCount ?? 1,
    // A backend that predates these only ever listed tournaments that were open and unstarted, so
    // that is what its payloads mean.
    hasStarted: raw.hasStarted ?? false,
    registrationOpen: raw.registrationOpen ?? true,
  }
}

export function normalizeOngoingEvent(raw: OlderOngoingEvent): OngoingEvent {
  return {
    ...raw,
    config: {
      ...raw.config,
      visibility: raw.config.visibility ?? 'public',
      allowSoloRegistration: raw.config.allowSoloRegistration ?? false,
      rotationRounds: raw.config.rotationRounds ?? 3,
    },
    soloPlayers: raw.soloPlayers ?? [],
    // A backend without the rotation scheme sends neither the participants nor the ladder; the
    // rotation tab is unreachable in that case, but the match list still maps over every game.
    games: (raw.games ?? []).map((game) => ({
      ...game,
      groupIndex: game.groupIndex ?? null,
      side1Players: game.side1Players ?? [],
      side2Players: game.side2Players ?? [],
    })),
    rotation: raw.rotation ?? null,
  }
}
